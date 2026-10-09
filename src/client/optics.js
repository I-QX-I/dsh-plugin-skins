        // One responsive rectangle pipeline serves both controls and input cards.
		function createLiquidGlass (ctx, refreshGeometry = () => {}) {
			// Broad readable surfaces have room for a wider curve. The normalized
			// optical profile is shared; geometric bounds keep small controls clean.
			const GLASS_EDGE = 64, GLASS_MAP_SCALE = 64
			if (!document.createElementNS || !window.matchMedia) return () => {}
			// Keep native blur when the renderer cannot parse an SVG backdrop.
			// Do not install broken URL filters or change the saved material choice.
			if(typeof CSS!=='undefined'&&CSS.supports&&!CSS.supports('backdrop-filter','url("#dsh-capability-probe")'))return () => {}
			const ns = 'http://www.w3.org/2000/svg'
			const svg = document.createElementNS(ns, 'svg')
			svg.setAttribute('data-sk-liquid-defs', '')
			svg.setAttribute('aria-hidden', 'true')
			svg.setAttribute('focusable', 'false')
			svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;overflow:hidden'
			const defs = document.createElementNS(ns, 'defs')
			svg.append(defs)
			document.body.append(svg)
			const owned = new Map(), cache = new Map(), reading = new Set()
			const broadMessage = (element,rect) => element.matches("[class*='_bubble']:not([class*='_bubble_'])") && rect.height > SK_READING_SURFACE_HEIGHT
			let thickness = glassThickness(), reflectionGain = 1
            let enabled = false, timer = 0, serial = 0
            let candidates = []
			const media = window.matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)')
			const baseSelector = `${COMPOSER_SURFACE}[data-sk-composer-surface], [class*='_tabs'] > button[role='tab'][aria-selected='true'], ${DOCK_TABS}, ${PANEL_ACTIVE}, [class*='_bubble']:not([class*='_bubble_']), ${CONTENT_CARDS}, ${HOVER_PREVIEW}, [data-sk-nav-lens]:not([hidden]), [data-presented-file], [data-queue-dock] ul > li, [data-testid='todo-panel'], [data-turn-trigger], [data-goal-bar] > [class$='_bar'], [role='dialog'], [role='menu'], [role='listbox'], .sk-card, .sk-seg, .sk-tile[data-on], ${SESSION_SELECTED}, [class$='_newSession'], [class*='_newSession '], [class*='_toBottom']:not([class*='_toBottomSlot'])`
			const selector = `:is(${baseSelector}):not(${SETTINGS_PANEL},${SETTINGS_PANEL} *,${PLUGIN_CARDS})`
			const restore = (element, state) => {
				element.removeAttribute('data-sk-live-static')
                if (state.marker === null) element.removeAttribute('data-sk-liquid')
				else element.setAttribute('data-sk-liquid', state.marker)
				if (state.value) element.style.setProperty('--sk-liquid-filter', state.value, state.priority)
				else element.style.removeProperty('--sk-liquid-filter')
				state.filter?.remove()
                state.viewport?.remove()
				resize?.unobserve(element)
				if(element.hasAttribute('data-sk-composer-surface'))for(const child of element.children)resize?.unobserve(child)
			}
			const clear = () => {
				for (const [element,state] of owned) restore(element,state)
				for (const element of reading) resize?.unobserve(element)
				reading.clear()
				owned.clear(); cache.clear(); candidates = []; defs.replaceChildren()
			}
			const roundedDistance = (x,y,w,h,r) => {
				const qx = Math.abs(x-w/2)-(w/2-r), qy = Math.abs(y-h/2)-(h/2-r)
				return Math.hypot(Math.max(0,qx),Math.max(0,qy))+Math.min(Math.max(qx,qy),0)-r
			}
			// Exact coverage of the tangent contour over a square texture pixel.
            // The CDF of two uniform projections handles diagonal normals too;
            // a one-axis ramp would give corners a different edge thickness.
            const pixelCoverage = (distance, nx, ny, density) => {
                const a = Math.abs(nx) / (2 * density), b = Math.abs(ny) / (2 * density)
                if (Math.min(a, b) < 1e-8) return Math.min(1, Math.max(0, .5 - distance / (2 * Math.max(a, b, 1e-8))))
                const square = value => Math.max(0, value) ** 2, z = -distance
                return Math.min(1, Math.max(0, (square(z+a+b)-square(z+a-b)-square(z-a+b)+square(z-a-b))/(8*a*b)))
            }
            const makeFilter = (w,h,r,scatter,pane=false,openBottom=false,edgeOverride=null) => {
				// Sharp cached atlases use 4x; diffuse settings corners need 1.5x.
				const density = Math.min(4,Math.sqrt(131072/(w*h))), iw = Math.max(2,Math.ceil(w*density)), ih = Math.max(2,Math.ceil(h*density))
				const canvas = document.createElement('canvas'); canvas.width=iw; canvas.height=ih
				const context = canvas.getContext('2d'), pixels = context.createImageData(iw,ih)
				const reflectionEnabled=!pane
				const littleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1
				new Uint32Array(pixels.data.buffer).fill(littleEndian?0xff008080:0x808000ff)
				const edge = edgeOverride ?? Math.min(GLASS_EDGE*thickness.shoulder,(r||6)*.85*thickness.shoulder,h*.30)
				const quietInset = Math.max(r,edge+2)
				/* Contact-bound refraction: no source jump at the silhouette. The
				 * displacement grows just inside the edge, then joins a neutral centre.
				 * This is a bounded optical approximation, not ray tracing. */
				const profile = new Float32Array(128)
                const reflectionProfile=new Float32Array(128)
                // The sampled source remains monotone, avoiding folded text.
                for(let i=0;i<128;i++) {
                    const t=i/127
                    // A broad convex shoulder, rather than a thin decorative bevel.
                    // Source coordinates remain ordered; the central plane is neutral.
                    profile[i]=thickness.bend*edge*(pane ? .7 : reflectionEnabled ? .65+1.3*t : .85+2.2*t)*t*(1-t)*(1-t)*(1-t)
                    // Schlick-shaped grazing response for a convex shoulder.
                    // The fixed studio light is an approximation, not captured
                    // environment radiance; keep its exposure deliberately low.
                    if(reflectionEnabled){const cosTheta=Math.sqrt(t*(2-t));reflectionProfile[i]=.24*(.04+.96*Math.pow(1-cosTheta,5))*Math.pow(1-t,2)}
                }
                // Fit the 8-bit channel range to this bevel instead of giving
                // tiny controls a large, visibly quantized displacement range.
                const strength=reflectionEnabled?Math.min(GLASS_MAP_SCALE,Math.max(8,Math.ceil(edge*.57+2))):32
                const distance = (x,y) => roundedDistance(x,y,w,(openBottom?h*2:h),r)
				for(let y=0;y<ih;y++) for(let x=0;x<iw;x++) {
					const px=(x+.5)*w/iw, py=(y+.5)*h/ih
					/* Rectangular interiors are optically neutral. Skip distance,
					 * normal and lighting work there without changing any edge pixels. */
					if(px>quietInset&&px<w-quietInset&&py>quietInset&&(openBottom||py<h-quietInset))continue
					const d=distance(px,py), i=(y*iw+x)*4
					let dx=0,dy=0,nx=0,ny=0,clarity=0
					if(d<=1.5 && d>=-edge) {
						const cx=px-w/2,cy=py-(openBottom?h*2:h)/2
						const qx=Math.abs(cx)-w/2+r,qy=Math.abs(cy)-(openBottom?h*2:h)/2+r
						const ax=Math.max(qx,0),ay=Math.max(qy,0),length=Math.hypot(ax,ay)
						const depth=Math.min(1,Math.max(0,-d/edge))
						const sample=depth*127,lo=Math.floor(sample),hi=Math.min(127,lo+1)
						const bend=(profile[lo]+(profile[hi]-profile[lo])*(sample-lo))/(strength*112/510)
						nx=length?Math.sign(cx)*ax/length:qx>=qy?Math.sign(cx):0
						ny=length?Math.sign(cy)*ay/length:qy>qx?Math.sign(cy):0
                        dx=-nx*bend; dy=-ny*bend
                        if(reflectionEnabled&&d<(Math.abs(nx)+Math.abs(ny))*.5/density){
                            // Pixel coverage at the analytic contour. A hard
                            // d<=0 switch produced a jagged bright arc before the
                            // CSS radius clipped that sampled contour again.
                            const coverage = pixelCoverage(d, nx, ny, density)
                            // The otherwise unused blue channel carries reflection
                            // coverage, sharing one decode with the RG displacement.
                            // Grazing reflection wraps the whole silhouette, with
                            // a brighter upper light and a softer lower return.
                            const facing=.10+.90*Math.pow(Math.max(0,-nx*.6-ny*.8),2)
                            clarity=coverage*facing*(reflectionProfile[lo]+(reflectionProfile[hi]-reflectionProfile[lo])*(sample-lo))
                        }
                        /* A readable frosted centre fades into a clearer curved
                         * edge. Lighting follows the real contour, not a second
                         * rounded rectangle drawn inside the glass. */
                        // Settings corners retain their separate coverage mask.

					}
					pixels.data[i]=Math.round(128+dx*112); pixels.data[i+1]=Math.round(128+dy*112)
					pixels.data[i+2]=Math.round(clarity*255); pixels.data[i+3]=255
				}
				context.putImageData(pixels,0,0)
				const filter=document.createElementNS(ns,'filter'), id=`dsh-liquid-${++serial}`
				for(const [k,v] of Object.entries({id,x:'0',y:'0',width:'100%',height:'100%','color-interpolation-filters':'sRGB'})) filter.setAttribute(k,v)
				/* A larger typing surface scatters more light so scrolling prose does
				 * not compete with the placeholder. Small controls stay optically clear. */
				const blur=scatter>0?document.createElementNS(ns,'feGaussianBlur'):null
				if(blur){blur.setAttribute('stdDeviation',String(scatter));blur.setAttribute('in','lens');blur.setAttribute('result','scene')}
				const map=document.createElementNS(ns,'feImage')
				for(const [k,v] of Object.entries({href:canvas.toDataURL(),x:'0',y:'0',width:String(w),height:String(h),preserveAspectRatio:'none',result:'bevel'})) map.setAttribute(k,v)
                filter.append(map)
                const primitive=(name,attrs)=>{const el=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));filter.append(el);return el}
                // Eight-bit 128 encodes 128/255, not exactly 0.5. Compensate
                // before displacement so the entire neutral centre is not
                // unnecessarily shifted and resampled by a fraction of a pixel.
                if(reflectionEnabled)primitive('feColorMatrix',{in:'bevel',type:'matrix',values:'1 0 0 0 -0.00196078431372549  0 1 0 0 -0.00196078431372549  0 0 1 0 0  0 0 0 1 0',result:'vectors'})
                const displace=(input,result)=>primitive('feDisplacementMap',{in:input,in2:reflectionEnabled?'vectors':'bevel',scale:strength,xChannelSelector:'R',yChannelSelector:'G',result})
                /* Refract first, then scatter once: roughness stays even across
                 * the curved band instead of stretching a pre-blurred glyph. */
                displace('SourceGraphic','lens')
                if(blur)filter.append(blur)
                if(reflectionEnabled){
                    const matrix = primitive('feColorMatrix',{in:'bevel',type:'matrix',values:`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 ${reflectionGain} 0 0`,result:'reflection'})
                    primitive('feComposite',{in:'reflection',in2:blur?'scene':'lens',operator:'over',result:'material'})
                }
				return {filter,value:`url("#${id}")`}
			}
            // SVG images without a viewBox resolve pixels and viewport units at
            // their requested feImage size. Keep corners/bevels in CSS pixels,
            // rather than stretching a whole baked contour during native resize.
            const responsiveImage = (href,size,patch,neutral,edge,guard) => {
                const middle=size/2
                // SVG's numeric/percentage geometry is interoperable here.
                // Place opposite edges at 100%, then offset the fixed patch;
                // CSS calc() on nested SVG x/y is not implemented consistently.
                const slice=(x,y,width,height,vx,vy,vw,vh)=>`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="none" overflow="hidden"><use href="#atlas"/></svg>`
                const anchor=(x,y,width,height,content)=>`<svg x="${x}" y="${y}" width="${width}" height="${height}" overflow="visible">${content}</svg>`
                // Straight strips only contain the active optical band. Cover
                // their clip boundaries with matching corner samples; otherwise
                // partial coverage can mix perpendicular neutral vectors.
                const band=Math.min(patch,edge), sideFar=size-band, patterns=[]
                // Repeat the constant straight-edge sample instead of stretching
                // a one-column viewport. The atlas and optical profile stay shared.
                const tile=(id,x,y,width,height,vx,vy,horizontal)=>{
                    patterns.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" width="${horizontal?1:size}" height="${horizontal?size:1}"><use href="#atlas" x="${-vx}" y="${-vy}"/></pattern>`)
                    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" overflow="hidden"><rect width="100%" height="100%" fill="url(#${id})"/></svg>`
                }
                const sides=[tile('strip-1',0,0,'100%',band,middle,0,true),anchor(0,'100%','100%',band,tile('strip-2',0,-band,'100%',band,middle,sideFar,true)),
                    tile('strip-3',0,0,band,'100%',0,middle,false),anchor('100%',0,band,'100%',tile('strip-4',-band,0,band,'100%',sideFar,middle,false))]
                const corner=patch+guard, cornerFar=size-corner
                const corners=[slice(0,0,corner,corner,0,0,corner,corner),anchor('100%',0,corner,corner,slice(-corner,0,corner,corner,cornerFar,0,corner,corner)),
                    anchor(0,'100%',corner,corner,slice(0,-corner,corner,corner,0,cornerFar,corner,corner)),anchor('100%','100%',corner,corner,slice(-corner,-corner,corner,corner,cornerFar,cornerFar,corner,corner))]
                return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="${ns}" width="100%" height="100%"><defs><image id="atlas" width="${size}" height="${size}" href="${href}"/>${patterns.join('')}</defs>${neutral?'<rect width="100%" height="100%" fill="rgb(128,128,0)"/>':''}${sides.join('')}${corners.join('')}</svg>`)
            }
            const makeRectFilter = (radius,scatter,edge,openBottom,guard=0) => {
                const size=Math.ceil(Math.max(64,radius*2+32,edge*2+32)), patch=Math.max(radius,edge)
                const template=makeFilter(size,size,radius,scatter,false,openBottom,edge)
                for(const image of template.filter.querySelectorAll('feImage')) image.setAttribute('href',responsiveImage(image.getAttribute('href'),size,patch,image.getAttribute('result')==='bevel',edge,guard))
                return template
            }
            const installMap = (state,template,key) => {
                const filter=template.cloneNode(true); filter.id=state.id
                if(state.viewport)for(const image of filter.querySelectorAll('feImage')) {
                    image.setAttribute('width','100%');image.setAttribute('height','100%')
                }
                if(state.filter)state.filter.replaceWith(filter);else (state.viewport??defs).append(filter)
                state.filter=filter;state.key=key
            }
			const sync = (scrollOnly = false) => {
				clearTimeout(timer);timer=0
				fullPending=false
				if(!enabled || media.matches) { clear(); return }
				const used = new Set()
				const releases = [], plans = []
				const rectangles=new Map()
				const bounds=element=>{if(!rectangles.has(element))rectangles.set(element,element.getBoundingClientRect());return rectangles.get(element)}
				/* The skip test has to be applied when RELEASING too, not only when
				 * acquiring. Without it the compact new-session control keeps the lens
				 * it was given while the sidebar was open: the element stays in `owned`,
				 * `restore()` is never called for it, and a 28px chrome circle keeps an
				 * SVG filter it no longer needs. Releasing a lens the stylesheet has
				 * already stripped is safe - the fill is gone, so nothing it painted was
				 * visible. */
				const compactNewSession=element=>element.matches("[class$='_newSession'],[class*='_newSession ']")
					&&element.closest('[data-windows-titlebar]')
					&&element.closest("[class*='_root'][class*='_collapsed']")
				for(const [element,state] of owned) {
					const r=bounds(element)
					if(!element.isConnected || element.hasAttribute('data-sk-composer-reading') || broadMessage(element,r) || compactNewSession(element) || !element.matches(selector) || element.closest('[hidden]') || !r.width || !r.height || r.bottom < -600 || r.top > innerHeight+600 || (r.right<0 || r.left>innerWidth)&&!element.closest('.BynINW_sidebarCol')) releases.push([element,state])
				}
				// Observe native reading surfaces so shrinking restores their lens.
				// No text reads, cloned messages or per-frame style writes are needed.
				for(const element of reading){
					const r=bounds(element)
					if(!element.isConnected||!broadMessage(element,r)||element.closest('[hidden]')||r.bottom < -600||r.top > innerHeight+600){resize?.unobserve(element);reading.delete(element)}
				}
				// Scrolling changes bounds, not membership. DOM/selection/resize
                // mutations still promote a complete discovery before this list
                // is reused. Avoid walking retained transcript markup each tick.
                if (!scrollOnly) candidates = [...document.querySelectorAll(selector)]
                for(const element of candidates) {
                    if (!element.isConnected) continue
					if(element.hasAttribute('data-sk-composer-reading'))continue
					if(element.closest('[hidden],[data-sk-measure]') || element.closest('#codex-audit-fixture')) continue
					/* Compact chrome uses one shared feedback layer, without an unseen
					 * full-size new-session lens beneath a transparent title-bar button.
					 *
					 * `data-windows-titlebar` is on <html> (preload-app.cjs:578), so on its
					 * own it only says "this is the Windows build" — it is true for every
					 * element in the window. Requiring the host's collapsed sidebar root
					 * is what makes it mean "compact". Without that the expanded 38px
					 * new-session button was denied its lens as well as its fill, which is
					 * the bare text button in the user's screenshot. The stylesheet uses
					 * the identical condition. */
					if(compactNewSession(element)) continue
					const rect=bounds(element)
					if(!rect.width || !rect.height || rect.bottom < -600 || rect.top > innerHeight+600 || (rect.right<0 || rect.left>innerWidth)&&!element.closest('.BynINW_sidebarCol')) continue
					if(broadMessage(element,rect)){
						if(!reading.has(element)){reading.add(element);resize?.observe(element)}
						continue
					}
					// Scrolling moves existing surfaces without changing their optics.
					// New/re-entering surfaces still acquire their complete material.
					if(scrollOnly&&owned.has(element)){used.add(owned.get(element).key);continue}
					// CSSStyleDeclaration is live. Snapshot every value used below
					// before any lens is installed, so reads cannot flush writes from
					// the previous surface or observe a half-installed material.
					const liveStyle=getComputedStyle(element), opticalStyle={}
					for(const name of ['borderTopLeftRadius','borderLeftWidth','borderRightWidth','borderTopWidth','borderBottomWidth','position']) opticalStyle[name]=liveStyle[name]
					const tokens=new Map(['--sk-readability-floor','--sk-scatter'].map(name=>[name,liveStyle.getPropertyValue(name)]))
					opticalStyle.getPropertyValue=name=>tokens.get(name)
					let w=Math.round(rect.width),h=Math.round(rect.height),radius=Math.min(parseFloat(opticalStyle.borderTopLeftRadius)||0,w/2,h/2),shape=null
					if(element.hasAttribute('data-sk-composer-surface')) {
                        // Read the host card, excluding the dock below it.
						const card=element.querySelector(':scope > [data-composer-card]')
						if(!card)continue
						const c=bounds(card)
						if(!c.width||!c.height)continue
						w=Math.round(c.width);h=Math.round(c.height);radius=Math.min(parseFloat(getComputedStyle(card).borderTopLeftRadius)||28,w/2,h/2)
						shape={above:true,card:Math.round(c.height),dock:Math.round(c.width),gap:0}
					}
					const openBottom=element.matches(GLASS_CONTROLS)||element.hasAttribute('data-sk-nav-open')
					/* Liquid controls stay clear; reading surfaces add a modest scatter.
					 * Preset scaling stops at a small readability floor for input/cards.
					 * Frosted blur tokens are independent of these optical maps. */
					const baseScatter=shape?5:element.matches('[data-testid="todo-panel"],[data-turn-trigger],[data-goal-bar] > [class$="_bar"]')?1.8:element.matches('[role="dialog"]')?5:element.matches('[role="menu"],[role="listbox"]')?3:element.matches(`${CONTENT_CARDS},.md-code-block,[data-presented-file],.sk-card`)?3:1.2
                    const numberToken=(name,fallback)=>{const value=parseFloat(opticalStyle.getPropertyValue(name));return Number.isFinite(value)?value:fallback}
                    const floor=numberToken('--sk-readability-floor',1)
                    const scatter=Math.max(floor*(shape?2.8:element.matches(HOVER_PREVIEW)?3.5:element.matches(`${CONTENT_CARDS},.md-code-block,[data-presented-file]`)?2:0),baseScatter*numberToken('--sk-scatter',1))
					const edge=Math.min(GLASS_EDGE*thickness.shoulder,(radius||6)*.85*thickness.shoulder,h*.30)
                    // Keep the clip guard inside the straight span. In a circle
                    // opposite corner patches must meet, never overwrite one
                    // another. Use the already measured live size, not a DPR guess.
                    const minimum=shape?Math.min(w,h):Math.min(rect.width,rect.height)
                    const guard=Math.min(2,Math.max(0,minimum/2-radius))
                    const key=['nine-slice',radius,edge,scatter,openBottom,guard].join('/')
                    plans.push({element,opticalStyle,shape,key,radius,scatter,edge,openBottom,guard})
                }
                // Commit only after all rectangles and style tokens are read.
                // Canvas baking and SVG/attribute writes never alternate with
                // the next surface's measurement. No extra frame of latency.
                for(const [element,state] of releases){restore(element,state);owned.delete(element)}
                for(const {element,opticalStyle,shape,key,radius,scatter,edge,openBottom,guard} of plans){
                    if(!cache.has(key))cache.set(key,makeRectFilter(radius,scatter,edge,openBottom,guard))
					const cached=cache.get(key);cache.delete(key);cache.set(key,cached)
					used.add(key)
					if(!owned.has(element)) {
						owned.set(element,{marker:element.getAttribute('data-sk-liquid'),value:element.style.getPropertyValue('--sk-liquid-filter'),priority:element.style.getPropertyPriority('--sk-liquid-filter'),id:`dsh-liquid-instance-${++serial}`})
                        {
                            const viewport=document.createElementNS(ns,'svg')
                            viewport.setAttribute('data-sk-liquid-viewport','')
                            viewport.setAttribute('data-sk-liquid-defs','')
                            viewport.setAttribute('aria-hidden','true');viewport.setAttribute('focusable','false')
                            element.append(viewport);owned.get(element).viewport=viewport
                        }
						resize?.observe(element)
						if(shape)for(const child of element.children)resize?.observe(child)
					}
					const state=owned.get(element)
                    if(state.key!==key) installMap(state,cached.filter,key)
                    if(!shape){
                        const left=parseFloat(opticalStyle.borderLeftWidth)||0,right=parseFloat(opticalStyle.borderRightWidth)||0,top=parseFloat(opticalStyle.borderTopWidth)||0,bottom=parseFloat(opticalStyle.borderBottomWidth)||0
                        const bounds=`left:${-left}px;top:${-top}px;width:calc(100% + ${left+right}px);height:calc(100% + ${top+bottom}px)`
                        if(state.viewportBounds!==bounds){state.viewport.style.cssText=bounds;state.viewportBounds=bounds}
                    }

					if(!element.hasAttribute('data-sk-liquid'))element.setAttribute('data-sk-liquid','')
                    if(opticalStyle.position==='static'&&!element.hasAttribute('data-sk-live-static'))element.setAttribute('data-sk-live-static','')
					const value=`url("#${state.id}")`
					if(element.style.getPropertyValue('--sk-liquid-filter')!==value) element.style.setProperty('--sk-liquid-filter',value)
				}
				/* Detached templates keep recently used sizes warm on return scroll.
				 * Bound the cache; only owned instances live in the SVG scene. */
				for(const [key,item] of cache) {
					if(cache.size<=32)break
					if(!used.has(key)){item.filter.remove();cache.delete(key)}
				}
				/* Baking lenses can span an animation tick. Re-read the contour after
				 * the canvas work, then fit all images to those final live bounds. */
				fitLiveBounds()
			}
			/* Coalesce discovery scans. Width changes use responsive SVG inputs at
			 * paint time; settling must not swap in a differently shaped bevel. */
			let fullPending=false
			const schedule = event => { if(enabled) {
				const full=event?.type!=='scroll'
				if(full&&!fullPending){clearTimeout(timer);timer=0}
				fullPending ||= full
				// Structural changes respond on the next task. Scrolling keeps a
				// bounded throttle; continuous input must not postpone discovery.
				if(!timer)timer=setTimeout(()=>sync(!fullPending),fullPending?0:120)
			} }
            // Responsive corner patches resolve against the local SVG viewport.
            // No composer-specific normal field or resize-time image rebuild.
            const fitLiveBounds = () => refreshGeometry()
			// SurfaceGeometry already measures the composer before paint and calls
			// fit. Rectangular maps resolve their own SVG bounds. Re-running the
			// complete geometry scan from this observer duplicated every resize.
			const resizeKnown = new WeakSet()
			const resize = typeof ResizeObserver==='function' ? new ResizeObserver(entries=>{
				// The first notification follows the bounds already read on install.
				// Later size changes still refresh the optics normally.
				if(!entries){schedule();return}
				let changed=false
				for(const entry of entries){if(resizeKnown.has(entry.target))changed=true;else resizeKnown.add(entry.target)}
				if(changed)schedule()
			}) : null
			const observer=new MutationObserver(records=>{
                // Editing paragraphs cannot add a glass surface. Card-size
                // changes are already observed; keep discovery for accessories
                // outside the editor and for hosts without ResizeObserver.
                if (resize) records=records.filter(r=>!r.target.closest?.("[data-composer-card] [contenteditable='true']"))
                const structural=records.some(r=>r.type==='childList'&&(!r.addedNodes||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1)))
                if(structural)for(const [element,state] of owned)if(element.isConnected&&state.viewport?.parentElement!==element)element.append(state.viewport)
                // Appending our own lens infrastructure is not host content.
                records=records.filter(r=>!r.target.closest?.('[data-sk-liquid-defs],[data-sk-measure]')&&(r.type!=='childList'||[...(r.addedNodes||[]),...(r.removedNodes||[])].some(n=>n.nodeType===1&&!n.matches?.('[data-sk-liquid-defs],[data-sk-nav-lens],[data-sk-optical-edge]'))))
				if(records.some(r=>{
                    if(r.target.closest?.('[data-sk-liquid-defs],[data-sk-measure]'))return false
                    if(r.type==='childList')return [...(r.addedNodes||[]),...(r.removedNodes||[])].some(n=>n.nodeType===1)
                    return r.type==='attributes'&&(r.attributeName==='hidden'||((owned.has(r.target)||r.target.matches?.(selector))&&['class','data-on','aria-selected','aria-current'].includes(r.attributeName)))
                }))schedule()
			})
			/* The sidebar's panel switcher changes its lens BETWEEN two states rather
			 * than appearing in one: the element is already on screen when the row is
			 * clicked, so only an attribute mutation announces that it now needs a lens
			 * (or no longer does). `aria-current` and `class` are therefore filtered in
			 * alongside the pre-existing list — without them the row would wait for the
			 * next unrelated scan, or for a scroll, to acquire or shed its lens. */
			observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','data-on','aria-selected','aria-current','class']})
			document.addEventListener('scroll',schedule,{capture:true,passive:true})
			window.addEventListener('resize',schedule,{passive:true})
            const stopMedia = listenMediaQuery(media, schedule)
			ctx.effect(()=>()=>{enabled=false;clearTimeout(timer);observer.disconnect();resize?.disconnect();document.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);stopMedia();clear();svg.remove()},'skins: liquid optics')
			const toggle=active=>{enabled=active;clearTimeout(timer);timer=0;if(active)sync();else clear()}
			toggle.setThickness = id => {
                const next = glassThickness(id)
                if (next === thickness) return
                thickness = next
                // A user choice rebuilds bounded atlases once. No per-frame work.
                clear()
                if (enabled) schedule()
            }
            toggle.setRim = id => {
                const gain = glassRim(id).gain
                if (gain === reflectionGain) return
                reflectionGain = gain
                for (const state of [...cache.values(), ...owned.values()]) {
                    for (const matrix of state.filter?.querySelectorAll?.('feColorMatrix[result="reflection"]') ?? [])
                        matrix.setAttribute('values', `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 ${gain} 0 0`)
                }
            }
            toggle.refresh=schedule
            toggle.fit=()=>{
                // Geometry owns this transition, including hosts without RO.
                // Retire only the expanded composer, without a global scan.
                for(const [element,state] of owned)if(element.hasAttribute('data-sk-composer-reading')){
                    restore(element,state);owned.delete(element)
                }
                // A newly mounted composer must get its lens before its first
                // sidebar animation, rather than waiting for a quiet timeout.
                const fresh=enabled&&!media.matches&&[...document.querySelectorAll(COMPOSER_SURFACE+'[data-sk-composer-surface], [data-sk-nav-lens]:not([hidden])')].some(e=>{
                    if(owned.has(e)||e.hasAttribute('data-sk-composer-reading')||e.closest('[hidden],[data-sk-measure]'))return false
                    const r=e.getBoundingClientRect()
                    return r.width&&r.height&&r.bottom>=-600&&r.top<=innerHeight+600&&r.right>=0&&r.left<=innerWidth
                })
                if(fresh)sync()
            }
			return toggle
		}

		/* A critically damped trajectory sampled once for compositor playback.
		 * Re-targeting carries velocity as well as the current painted position. */
