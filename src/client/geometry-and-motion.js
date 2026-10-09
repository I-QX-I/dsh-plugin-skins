		function segmentTrajectory (start, x, width, velocity = {}, motion = {}) {
			const duration=motion.duration??500, omega=motion.omega??26, squash=motion.squash??.025
			const spring=(from,to,speed,t)=>{
				const delta=from-to, b=(speed||0)+omega*delta, decay=Math.exp(-omega*t)
				return {value:to+(delta+b*t)*decay,velocity:(b-omega*(delta+b*t))*decay}
			}
			const distance=Math.abs(x-start.x), pull=Math.min(motion.pull??10,distance*.06)
			const initial=start.x+start.width/2, goal=x+width/2
			const sample=t=>{
				const c=spring(initial,goal,velocity.centre,t),w=spring(start.width,width,velocity.width,t),y=spring(start.y,1,velocity.y,t)
				const u=omega*t, wave=u*u*Math.exp(-u)/(.5413411329), waveSpeed=omega*u*(2-u)*Math.exp(-u)/(.5413411329)
				return {centre:c.value,width:w.value+pull*wave,y:y.value-squash*wave,
					velocity:{centre:c.velocity,width:w.velocity+pull*waveSpeed,y:y.velocity-squash*waveSpeed}}
			}
			const frames=Array.from({length:65},(_,i)=>{
				const offset=i/64, s=sample(offset*duration/1000)
				return {offset,transform:i===64?`translateX(${x}px) scale(1,1)`:`translateX(${s.centre-s.width/2}px) scale(${s.width/width},${s.y})`}
			})
			return {duration,frames,sample}
		}

		function navigationMotionProfile (start, width, height) {
			const travel=Math.hypot(start.x/Math.max(start.width,width),start.y/Math.max(start.height,height))
			const duration=Math.round(220+140*Math.max(0,Math.min(1,travel-1)))
			return {duration,omega:30*360/duration,pull:0,squash:0}
		}
		function createSurfaceGeometry (ctx) {
			let afterSync = () => {}
			let enabled = false
			let pending = 0
			let fullPending = false
			let codeObserver = null
			const codeVisibility = new Map()
			const owned = new Map()
			const markers = new Map()
			let contourKeys = new WeakMap()
			const segments = new Map()
			const navigation = new Map()
			const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
			const cancelSegment = state => { state?.animation?.cancel(); if(state){state.animation=null;state.trajectory=null;state.release?.();state.release=null} }
			const settleSegments = () => { for(const state of [...segments.values(),...navigation.values()])cancelSegment(state) }
			const stopMotionMedia = listenMediaQuery(reduceMotion, settleSegments)
			const observed = new Set()
			const mark = (element, name, active) => {
				if (!markers.has(element)) markers.set(element, new Map())
				const attrs = markers.get(element)
				if (!attrs.has(name)) attrs.set(name, element.getAttribute(name))
				/* toggleAttribute() is a mutation for the style engine even when the
				 * attribute is already in the requested state, so an unconditional call
				 * invalidated style on every scan. This runs once per tracked element per
				 * scroll frame — measured at ~130 style recalcs per second of transcript
				 * scrolling — and almost none of those calls changed anything. Reading
				 * the attribute first makes the idle case free: hasAttribute is a cheap
				 * lookup on an attribute we just wrote, and the only writes that remain
				 * are the ones that genuinely flip a state. */
				if (element.hasAttribute(name) === !!active) return
				element.toggleAttribute(name, active)
			}
			const put = (element, name, value) => {
				if (element.style.getPropertyValue(name) === value) return
				if (!owned.has(element)) owned.set(element, new Map())
				const props = owned.get(element)
				if (!props.has(name)) props.set(name, [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)])
				element.style.setProperty(name, value)
			}
			const restore = () => {
				for(const block of codeVisibility.keys())codeObserver?.unobserve(block)
				codeVisibility.clear()
				settleSegments(); segments.clear(); for(const state of navigation.values())state.layer?.remove();navigation.clear()
				for (const [element, props] of owned) {
					for (const [name, [value, priority]] of props) {
						if (value) element.style.setProperty(name, value, priority)
						else element.style.removeProperty(name)
					}
				}
				owned.clear()
				for (const [element, attrs] of markers) {
					for (const [name, value] of attrs) {
						if (value === null) element.removeAttribute(name)
						else element.setAttribute(name, value)
					}
				}
				markers.clear()
				for (const element of observed) resize?.unobserve(element)
				observed.clear()
				contourKeys = new WeakMap()
			}
			const sync = (scrollOnly = false) => {
				if (!enabled) return
				const updates = []
				const markerUpdates = []
				const segmentMotions = []
				const navigationMotions = []
				if (!scrollOnly) {
				const frame = document.querySelector('.BynINW_frame')
				/* Retained inactive conversations also own panels. Only the current
				 * session may select the push layout; overlay/fullscreen stay native. */
				const panel = [...(frame?.querySelectorAll('[data-sidebar-right-panel]') ?? [])].find((element) => !element.closest('[hidden]'))
				const width = Number.parseFloat(panel?.style.width)
				const push = panel?.getAttribute('data-sidebar-right-panel') === 'push' && Number.isFinite(width) && width >= 0
				if (frame) {
					mark(frame, 'data-sk-push', push)
					if (push) put(frame, '--sk-right-width', `${width}px`)
				}
				for (const segment of document.querySelectorAll?.('.sk-seg') ?? []) {
					const selected=segment.querySelector('.sk-segBtn[data-on]'),r=segment.getBoundingClientRect(),s=selected?.getBoundingClientRect()
					if(!s||!r.width||segment.closest('[hidden]'))continue
                    if(!observed.has(segment)){resize?.observe(segment);observed.add(segment)}
                    // A travelling horizontal lens cannot describe a wrapped
                    // choice group. Native selected-button fills stay readable.
                    if(r.height > s.height + 4.5) {
                        cancelSegment(segments.get(segment));segments.delete(segment)
                        markerUpdates.push([segment,'data-sk-seg',false])
                        continue
                    }
					const x=s.left-r.left, width=s.width, previous=segments.get(segment)
					if(previous&&(Math.abs(previous.x-x)>.1||Math.abs(previous.width-width)>.1)) {
						const style=getComputedStyle(segment,'::before'),m=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform)
						const start={x:m.m41,width:parseFloat(style.width)*m.m11,y:m.m22}
						const velocity=previous.trajectory?.sample(Number(previous.animation?.currentTime||0)/1000).velocity
						cancelSegment(previous)
						segmentMotions.push({segment,x,width,start,velocity})
					}
					if(previous){previous.x=x;previous.width=width}
					else segments.set(segment,{x,width,animation:null})
					updates.push([segment,'--sk-seg-x',`${x}px`],[segment,'--sk-seg-width',`${width}px`])
					markerUpdates.push([segment,'data-sk-seg',true])
				}
				/* Retarget the selected material within each existing host control
				 * group. No clones, per-frame DOM reads or moving foreground labels. */
				const currentGroups=new Map()
				for(const selected of document.querySelectorAll?.(NAV_SELECTED) ?? []) {
					if(selected.closest('[hidden]'))continue
					const r=selected.getBoundingClientRect()
					if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)continue
					const group=selected.matches(SESSION_SELECTED)?selected.closest('[role="tree"]')||selected.parentElement:selected.parentElement
					currentGroups.set(group,selected)
					let state=navigation.get(group)
					if(state&&state.selected!==selected&&state.selected.isConnected&&!reduceMotion?.matches) {
						const old=state.selected.getBoundingClientRect()
						const sample=state.trajectory?.sample(Number(state.animation?.currentTime||0)/1000)
						/* The host has already deselected the old row, so its pseudo
						 * box may be gone. Sample our trajectory, not that absent box. */
						const start={x:old.left+(sample?sample.x.centre-sample.x.width/2:0)-r.left,y:old.top+(sample?sample.y.centre-sample.y.width/2:0)-r.top,width:sample?.x.width??old.width,height:sample?.y.width??old.height}
						const g=group.getBoundingClientRect(),style=getComputedStyle(selected),gs=getComputedStyle(group),material=getComputedStyle(selected,'::before')
						cancelSegment(state)
						navigationMotions.push({selected,group,start,width:r.width,height:r.height,velocity:sample?.velocity,state,left:r.left-g.left-group.clientLeft+group.scrollLeft,top:r.top-g.top-group.clientTop+group.scrollTop,radius:style.borderRadius,position:gs.position,z:gs.zIndex,rim:material.boxShadow,clip:material.clipPath})
					}
					if(!state){state={selected,animation:null};navigation.set(group,state)}
					state.selected=selected
				}
				for(const [group,state] of navigation)if(!currentGroups.has(group)){cancelSegment(state);state.layer?.remove();navigation.delete(group)}
				}
				if(!scrollOnly){
					const blocks=new Set(document.querySelectorAll?.('.md-code-block')??[])
					for(const block of codeVisibility.keys())if(!blocks.has(block)){codeObserver?.unobserve(block);codeVisibility.delete(block)}
					for(const block of blocks)if(!codeVisibility.has(block)){codeVisibility.set(block,null);codeObserver?.observe(block)}
				}
				for (const [block,visible] of codeVisibility) {
					if(visible===false)continue
					if (block.closest('[hidden]')) continue
					const banner = block.querySelector('[class*="_bannerWrap"]')
					if (!banner) continue
					const b = block.getBoundingClientRect()
					if (b.bottom <= 0 || b.top >= window.innerHeight) continue
					const top = Math.max(0, banner.getBoundingClientRect().top - b.top)
					updates.push([block, '--sk-code-clip-top', `${Math.round(top * 1000) / 1000}px`])
				}
				if (!scrollOnly) {
				for (const root of document.querySelectorAll?.(COMPOSER_SURFACE) ?? []) {
					if (root.closest('[hidden]')) continue
					const card = root.querySelector(':scope > [data-composer-card]')
					if (!card) continue
					const c = card.getBoundingClientRect()
					updates.push([root,'--sk-composer-height',`${c.height}px`])
					const contourKey=[Math.round(c.width),Math.round(c.height)].join('/')
					if(contourKeys.get(root)!==contourKey) contourKeys.set(root,contourKey)
					markerUpdates.push([root,'data-sk-composer-surface',true])
                    // An expanded editor is a reading surface. Keep its backdrop
                    // out of the full-area SVG pipeline as its height grows.
                    markerUpdates.push([root,'data-sk-composer-reading',c.height>SK_READING_SURFACE_HEIGHT])
					for (const element of [card]) if (!observed.has(element)) {resize?.observe(element);observed.add(element)}
				}
                const sidebar=document.querySelector('.BynINW_sidebarCol'),content=sidebar?.querySelector('[data-slot="sidebar"] > [class*="_root"]')
                if(content)updates.push([sidebar,'--sk-sidebar-native-width',content.style.width||`${content.getBoundingClientRect().width}px`])
				}
				/* Read all rectangles before writes, once per scroll/resize frame. */
				for (const args of updates) put(...args)
				for (const args of markerUpdates) mark(...args)
				/* Sample once; the browser plays only the material transform. */
				for(const {selected,group,start,width,height,velocity,state,left,top,radius,position,z,rim,clip} of navigationMotions) {
					if(!selected.animate||start.width<=0||start.height<=0)continue
					if(position==='static')put(group,'position','relative')
					if(z==='auto')put(group,'z-index','0')
					if(!state.layer){state.layer=document.createElement('div');state.layer.setAttribute('data-sk-nav-lens','');state.layer.setAttribute('aria-hidden','true');group.append(state.layer)}
					const layer=state.layer;layer.hidden=false
					Object.assign(layer.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,borderRadius:radius})
						// Optical discovery may follow this geometry read. Keep these
						// recipes live so installing a map retires fallback inset rings
						// on the moving and stationary surfaces together.
						layer.style.setProperty('--sk-nav-rim',selected.matches(SESSION_SELECTED)
							? 'var(--sk-mat-rim), var(--sk-session-cast-shadow)'
							: selected.matches(PANEL_ACTIVE) ? 'var(--sk-mat-rim)' : rim)
					layer.style.setProperty('--sk-nav-clip',clip)
					layer.toggleAttribute('data-sk-nav-open',selected.matches(GLASS_CONTROLS))
					mark(group,'data-sk-nav-flight',true);mark(selected,'data-sk-nav-foreground',true)
					state.release=()=>{layer.hidden=true;mark(group,'data-sk-nav-flight',false);mark(selected,'data-sk-nav-foreground',false)}
					/* Navigation follows native dimensions without a separate swell
					 * pulse. Settings retain their wider morph profile. */
					const profile=navigationMotionProfile(start,width,height)
					if(selected.matches(GLASS_CONTROLS)){
						profile.duration=Math.max(280,profile.duration);profile.omega=26*360/profile.duration
						profile.pull=Math.min(.6,width*.01)
					}
					const horizontal=segmentTrajectory({x:start.x,width:start.width,y:1},0,width,velocity?.x,profile)
					const vertical=segmentTrajectory({x:start.y,width:start.height,y:1},0,height,velocity?.y,profile)
					const sample=t=>{const x=horizontal.sample(t),y=vertical.sample(t);return {x,y,velocity:{x:x.velocity,y:y.velocity}}}
					const frames=horizontal.frames.map(f=>{const {x,y}=sample(f.offset*horizontal.duration/1000);return {offset:f.offset,transform:`translate(${x.centre-x.width/2}px,${y.centre-y.width/2}px) scale(${x.width/width},${y.width/height})`}})
					/* End exactly on the native silhouette, avoiding a residual rim. */
					frames[frames.length-1].transform='none'
					const animation=layer.animate(frames,{duration:horizontal.duration,easing:'linear',pseudoElement:'::before'})
					if(animation.effect?.pseudoElement!=='::before'){animation.cancel();cancelSegment(state);continue}
					state.animation=animation;state.trajectory={sample}
					animation.onfinish=()=>{if(state.animation===animation)cancelSegment(state)}
				}
				for(const {segment,x,width,start,velocity} of segmentMotions) {
					if(reduceMotion?.matches||!segment.animate||!Number.isFinite(start.width)||start.width<=0)continue
					const trajectory=segmentTrajectory(start,x,width,velocity)
					const animation=segment.animate(trajectory.frames,{duration:trajectory.duration,easing:'linear',pseudoElement:'::before'})
					if(animation.effect?.pseudoElement!=='::before'){animation.cancel();continue}
					const state=segments.get(segment);state.animation=animation;state.trajectory=trajectory
					animation.onfinish=()=>{if(state.animation===animation)cancelSegment(state)}
				}
				for(const [segment,state] of segments)if(!segment.isConnected){cancelSegment(state);segments.delete(segment)}
				for (const element of owned.keys()) if (!element.isConnected) owned.delete(element)
				for (const element of markers.keys()) if (!element.isConnected) markers.delete(element)
				for (const element of observed) if (!element.isConnected) {resize?.unobserve(element);observed.delete(element)}
				if (!scrollOnly) afterSync()
			}
			const schedule = (event) => {
				/* Only sticky code headers change geometry during scrolling. Resize,
				 * mounting and control selection still request the complete scan. */
				if (event?.type !== 'scroll') fullPending = true
				if (!enabled || pending) return
				pending = requestAnimationFrame(() => { pending = 0; const full=fullPending;fullPending=false;sync(!full) })
			}
			const observer = new MutationObserver((records) => {
                // The editor can replace many paragraph nodes during paste or
                // composition. ResizeObserver owns the card silhouette; editor
                // internals do not affect navigation or transcript code clips.
                if (resize) records=records.filter(r=>!r.target.closest?.("[data-composer-card] [contenteditable='true']"))
				const relevant=records.filter(r=>!r.target.closest?.('[data-sk-liquid-defs],[data-sk-measure],[data-sk-bokeh],[data-sk-nav-lens]')&&(r.type!=='childList'||!r.addedNodes||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('[data-sk-liquid-defs],[data-sk-nav-lens],[data-sk-optical-edge]'))||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===3)))
				if(relevant.some(r=>r.type==='childList'&&(!r.addedNodes||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1))||['hidden','data-on','aria-pressed'].includes(r.attributeName)||['class','aria-selected','aria-current'].includes(r.attributeName)&&r.target.matches?.("[class*='_sessionRow'],[class*='_panelRow'],[role='tab']")||r.target.matches?.('.BynINW_frame, [data-sidebar-right-panel]')))schedule()
				else if(relevant.some(r=>r.type==='childList'))schedule({type:'scroll'})
			})
			observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'hidden', 'data-sidebar-right-panel','data-on','aria-pressed','class','aria-selected','aria-current'] })
			document.addEventListener('scroll', schedule, { capture: true, passive: true })
			window.addEventListener?.('resize', schedule, { passive: true })
			/* ResizeObserver runs before paint; update the silhouette in that same
			 * frame, including the last few frames of returning to normal width. */
			const refreshNow = () => {
                // A synchronous full scan consumes the queued discovery as well.
                cancelAnimationFrame(pending); pending = 0; fullPending = false
                sync()
            }
            const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(refreshNow) : null
			if (resize) resize.observe(document.documentElement)
			/* Track sticky headers near the viewport rather than measuring the
			 * entire retained transcript on every scroll frame. Unsupported hosts
			 * keep the existing measured fallback. */
			if(typeof IntersectionObserver==='function')codeObserver=new IntersectionObserver(entries=>{
				let changed=false
				for(const entry of entries)if(codeVisibility.has(entry.target)&&codeVisibility.get(entry.target)!==entry.isIntersecting){codeVisibility.set(entry.target,entry.isIntersecting);changed=true}
				if(changed)schedule({type:'scroll'})
			},{rootMargin:'64px'})
			ctx.effect(() => () => {
				observer.disconnect()
				codeObserver?.disconnect()
                stopMotionMedia()
				resize?.disconnect()
				document.removeEventListener('scroll', schedule, true)
				window.removeEventListener?.('resize', schedule)
				cancelAnimationFrame(pending)
				enabled = false
				restore()
			}, 'skins: surface geometry')
			const toggle = (active) => {
				enabled = active
				if (active) sync()
				else { cancelAnimationFrame(pending); pending = 0; restore() }
			}
			toggle.refresh = refreshNow
			toggle.afterSync = callback => { afterSync = callback }
			return toggle
		}

