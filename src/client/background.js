		/**
		 * Pull the discrete circles back out of an authored blob string.
		 *
		 * The artwork is written as one CSS background because that is the readable
		 * way to author it, but a background layer cannot give each circle its own
		 * motion — one transform moves the whole layer. So the string is taken apart
		 * again and each circle becomes its own element.
		 * @param css - the skin's `near` layer string.
		 * @returns one descriptor per circle.
		 */
		function parseBlobs (css, gain = 1) {
			const out = []
			const re = /radial-gradient\(circle\s+(\d+)px\s+at\s+([\d.]+)%\s+([\d.]+)%,\s*rgba\(([^)]*)\)\s+0\s+(\d+)%,\s*rgba\([^)]*\)\s+(\d+)%\)/g
			let match
			while ((match = re.exec(css)) !== null) {
				/* The lights are the picture. On a near-black base the only thing that
				 * makes the scene feel alive rather than murky is how bright the lights
				 * themselves are, so they are lifted here, once, for every skin. Raising
				 * the base colour instead would have traded the design away: the panes
				 * are dark tints, and on a light base they read as dark patches on a
				 * bright field — figure and ground inverted. */
				const channels = match[4].split(',').map((v) => v.trim())
				const alpha = Math.min(1, Number(channels[3]) * 1.95 * gain)
				/* Saturation, not just brightness.
				 *
				 * Raising the alpha alone made the lights brighter but never more vivid,
				 * and the reason is perceptual: on a dark field colours read as greyer
				 * than they are — the Bezold-Brucke shift — so a dark theme needs
				 * noticeably more saturation than the swatch suggests. Each channel is
				 * pushed away from its own mean, which adds chroma while leaving the
				 * value where it was. */
				const rgb = [Number(channels[0]), Number(channels[1]), Number(channels[2])]
				const vivid = skinColors.chromaChannels(rgb, 1.45)
				out.push({
					size: Number(match[1]),
					x: Number(match[2]),
					y: Number(match[3]),
					color: `rgba(${vivid[0]}, ${vivid[1]}, ${vivid[2]}, ${alpha.toFixed(3)})`,
					inner: Number(match[5]),
					/* The authored falloff ran about 36 points, which turned every disc
					 * into a soft cloud — the field read as fog rather than as lights.
					 * A real out-of-focus light keeps a defined edge and falls off fast;
					 * that edge is most of what makes it read as a disc at all. Tightening
					 * it here rather than editing thirty-six hand-written gradients keeps
					 * the artwork readable in the source and lets one number control it. */
					outer: Math.min(Number(match[6]), Number(match[5]) + 16),
				})
			}
			return composeBlobs(out)
		}

        /** Five deliberate scales instead of a dense band of similar small dots.
         * Preserve the two leading theme colors/anchors and spaced accent colors.
         * Radii are fixed artwork sizes; animation never changes them. */
        function composeBlobs (blobs) {
            if (blobs.length <= 5) return blobs
            const ranked = [...blobs].sort((a, b) => b.size - a.size)
            const last = ranked.length - 1
            const ranks = [0, 1, Math.round(last * .4), Math.round(last * .68), last]
            const radii = [336, 224, 148, 96, 64]
            return ranks.map((rank, i) => ({ ...ranked[rank], size: radii[i] }))
        }

        const DRIFT_PERIOD = 180
        const DRIFT_SAMPLES = 512
        const driftPlans = new WeakMap()
        const driftFrames = Array.from({ length: DRIFT_SAMPLES + 1 }, (_, i) =>
            `${i * 100 / DRIFT_SAMPLES}% { transform: var(--sk-drift-${i % DRIFT_SAMPLES}); }`).join('\n')

        function sampleLightPath (points, time) {
            const u = time * points.length, n = Math.floor(u), t = u - n
            return [0, 1].map(axis => {
                const at = delta => points[(n + delta + points.length) % points.length][axis]
                const a = at(-1), b = at(0), c = at(1), d = at(2)
                return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
            })
        }

        /** Plan independent smooth paths together, preferring fewer bright-core
         * intersections and a quieter reading centre. Partial edge crops retain
         * the original airy composition; halos may still overlap in tight windows.
         * A shared clock makes the spatial plan valid over the whole repeat,
         * without locks, per-frame collision work or position teleportation.
         * Node-owned cached plans survive preference echoes and are GC on unload. */
        function lightDriftPlan (host, blobs) {
            const key = blobs.map(b => [b.x, b.y, b.size, b.inner].join(',')).join('/')
            const old = driftPlans.get(host)
            if (old?.key === key) return old.recipes
            const width = window.innerWidth || 1280, height = window.innerHeight || 820
            const plans = [], positions = [], radii = blobs.map(b => b.size * b.inner / 100 * .7)
            for (let index = 0; index < blobs.length; index++) {
                let best, bestPositions, bestScore = Infinity
                for (let attempt = 0; attempt < 32; attempt++) {
                    const points = Array.from({ length: 8 }, (_, i) => i === 0
                        ? [blobs[index].x, blobs[index].y]
                        : [-12 + Math.random() * 124, -12 + Math.random() * 124])
                    const samples = Array.from({ length: 64 }, (_, i) => sampleLightPath(points, i / 64))
                    // Keep the reading centre quiet; large cores carry more weight.
                    // This is a soft field, not a hard exclusion box or fixed lane.
                    let score = samples.reduce((sum, [x, y]) => {
                        const calm = Math.exp(-(((x - 56) / 26) ** 2 + ((y - 48) / 29) ** 2))
                        return sum + radii[index] ** 2 * calm * .45
                    }, 0)
                    for (let other = 0; other < index; other++) for (let i = 0; i < samples.length; i++) {
                        const dx = (samples[i][0] - positions[other][i][0]) * width / 100
                        const dy = (samples[i][1] - positions[other][i][1]) * height / 100
                        const gap = Math.max(0, radii[index] + radii[other] - Math.hypot(dx, dy))
                        score += gap * gap + .09 * (radii[index] + radii[other]) ** 2 * Math.exp(-(dx * dx + dy * dy) / (2 * (radii[index] + radii[other]) ** 2))
                    }
                    if (score < bestScore) { best = points; bestPositions = samples; bestScore = score }
                    if (score === 0) break
                }
                plans.push(best)
                positions.push(bestPositions)
            }
            const recipes = blobs.map((blob, index) => Array.from({ length: DRIFT_SAMPLES }, (_, i) => {
                const [x, y] = sampleLightPath(plans[index], i / DRIFT_SAMPLES)
                return `--sk-drift-${i}:translate3d(${(x - blob.x).toFixed(4)}vw,${(y - blob.y).toFixed(4)}vh,0)`
            }).join(';'))
            driftPlans.set(host, { key, recipes })
            return recipes
        }

        /** Reuse lights and their random recipes across skin/preference updates. */
		function mountBokeh (host, blobs, animate, speed = 'standard') {
			const children = [...host.children]
            const drift = lightDriftPlan(host, blobs)
			const nodes = blobs.map((blob, index) => {
				const node = children[index] ?? document.createElement('i')
				const box = blob.size * 2
				node.setAttribute('aria-hidden', 'true')
				node.style.cssText = [
					drift[index],
					`left:${blob.x}%;top:${blob.y}%;width:${box}px;height:${box}px;margin:${-box / 2}px 0 0 ${-box / 2}px`,
					`background-image:radial-gradient(circle ${blob.size}px at 50% 50%,${blob.color} 0 ${blob.inner}%,rgba(0,0,0,0) ${blob.outer}%)`,
					/* The module switch has to reach here too. It used to gate only the
					 * stylesheet, while these elements carried their animation inline —
					 * so turning "drifting background lights" off left twelve lights
					 * animating, and a test built on that switch proved nothing. */
					animate
						? `animation:sk-blob-drift ${DRIFT_PERIOD / ambientCssRate(speed)}s linear -2s infinite, sk-blob-breathe ${15 + index % 5 * 2}s ease-in-out ${(-(index * 2.37)).toFixed(2)}s infinite`
						: 'animation:none',
				].join(';')
				return node
			})
			/* Reuse existing lights so a preference acknowledgement cannot restart
			 * their animation or move every disc back to its initial position. */
			if (nodes.length !== children.length || nodes.some((node, index) => node !== children[index])) host.replaceChildren(...nodes)
		}


        // Two independent periodic fields. Multiple spatial harmonics deform
        // their intersections, rather than moving the wallpaper in a circle.
        // Generate once, animate transforms on the compositor, no frame loop.
        const COLOR_FLOW = [{name:'sk-drift-far', seconds:24, phase:.4},
            {name:'sk-flow-return', seconds:34, phase:2.1}]
        const colorFlowFrames = COLOR_FLOW.map(({name,phase}) => {
            const frame = i => {
                const t = (i % 128) * Math.PI * 2 / 128
                const x = 11 * Math.sin(t + phase) + 4 * Math.sin(3 * t - phase)
                const y = 8 * Math.cos(2 * t + phase) + 3 * Math.sin(t - phase)
                const sx = 1.07 + .055 * Math.sin(2 * t - phase)
                const sy = 1.07 + .055 * Math.cos(3 * t + phase)
                // Change color contribution as well as position: the broad
                // fields trade prominence instead of merely sliding a texture.
                const weight = .76 + .24 * Math.sin(t + phase)
                return `${i * 100 / 128}% { transform: translate3d(${x.toFixed(4)}vmin,${y.toFixed(4)}vmin,0) scale(${sx.toFixed(5)},${sy.toFixed(5)}); opacity: ${weight.toFixed(5)}; }`
            }
            return `@keyframes ${name} { ${Array.from({length:129},(_,i)=>frame(i)).join('\n')} }`
        }).join('\n')

        /** Theme color fields and fixed-size lights share the existing drift gate.
         * Gradient textures are painted once; only their transforms animate.
         * The light container stays still, so its children never gain depth/zoom. */
        function buildAmbientCss (skin, far, choice = {}) {
            const colors = [...skin.far.matchAll(/rgba\((\d+,\d+,\d+),([.\d]+)\)/g)]
                .filter(match => Number(match[2]) > 0).map(match => match[1])
            const palette = skinColors.scenePalette(colors.length ? colors : [skinColors.accent(skin.tint, 0)], choice.colorSeparation)
            const first = palette[0] ?? skinColors.accent(skin.tint, 0)
            const second = palette[1] ?? first, third = palette[2] ?? first
            return `
/* Broad theme fields deform independently above the anchored ground. */
body[data-sk-drift][data-sk-active]::before {
 content: ''; position: fixed; inset: -18%; z-index: -1;
 pointer-events: none; background-repeat: no-repeat;
 background-image: radial-gradient(ellipse 38% 52% at 26% 46%, rgba(${first},.32), rgba(${first},0) 78%),
  radial-gradient(ellipse 44% 42% at 72% 58%, rgba(${third},.36), rgba(${third},0) 78%), ${far} !important;
 animation: sk-drift-far ${COLOR_FLOW[0].seconds / ambientCssRate(choice.flowSpeed)}s linear -2s infinite;
}
[data-sk-bokeh] {
 position: fixed; inset: 0; z-index: -1; pointer-events: none;
 overflow: hidden; opacity: 1;
}
/* A broad color ribbon crosses the primary field on a different phase.
 * Its palette comes from the theme. No extra dots, blur or per-frame painting.
 * Overscan keeps texture edges outside the clipped window at every phase. */
body[data-sk-active][data-sk-drift] [data-sk-bokeh]::before {
 content: ''; position: absolute; inset: -18%; pointer-events: none;
 background: radial-gradient(ellipse 42% 58% at 28% 42%, rgba(${first},.60), rgba(${first},0) 74%),
  radial-gradient(ellipse 45% 48% at 68% 61%, rgba(${second},.64), rgba(${second},0) 76%),
  linear-gradient(118deg, rgba(${third},0) 16%, rgba(${third},.26) 48%, rgba(${third},0) 79%);
 animation: sk-flow-return ${COLOR_FLOW[1].seconds / ambientCssRate(choice.flowSpeed)}s linear -1s infinite;
}
/* Independent color-field periods avoid a short shared orbit. Every field
 * matches its position and velocity at wrap; the base stays anchored. */
${colorFlowFrames}
[data-sk-bokeh] > i {
 position: absolute; display: block; background-repeat: no-repeat;
 /* Fixed radius. Breathing changes only opacity, independently of movement. */
 opacity: 1;
}
/* Node-owned noise paths animate only translation; no per-frame JS. */
@keyframes sk-blob-drift { ${driftFrames} }
@keyframes sk-blob-breathe {
 0%, 100% { opacity: .84; }
 50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
 body[data-sk-drift][data-sk-active]::before,
 [data-sk-bokeh],
 [data-sk-bokeh]::before,
 [data-sk-bokeh] > i { animation: none !important; }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
 [data-sk-bokeh]::before { display: none !important; }
}
`
        }



        /** Change speed without resetting phase. No scene timer or frame loop.
         * CSS durations provide the fallback when playback-rate APIs are absent. */
        function createAmbientPlayback (ctx, host) {
            if (!ambientPlaybackSupported()) return () => {}
            let latest, signature, frame = 0
            const update = () => {
                if (!latest) return
                for (const animation of document.getAnimations()) {
                    const target = animation.effect?.target
                    const own = target === document.body || target === host || target?.parentElement === host
                    const key = animation.animationName === 'sk-blob-drift' ? 'orbSpeed'
                        : COLOR_FLOW.some(({name}) => name === animation.animationName) ? 'flowSpeed' : null
                    if (own && key) {
                        const rate = ambientRate(latest[key])
                        if (animation.playbackRate !== rate) animation.updatePlaybackRate(rate)
                    }
                }
            }
            const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
            const changed = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { frame = 0; update() }) }
            const stopMedia = listenMediaQuery(media, changed)
            ctx.effect(() => () => {
                cancelAnimationFrame(frame)
                stopMedia()
                latest = undefined
            }, 'skins: ambient playback')
            return choice => {
                latest = choice
                const key = [choice.skin, choice.vivid, choice.drift, choice.flowSpeed, choice.orbSpeed, choice.colorSeparation].join('/')
                if (signature !== key) { signature = key; update() }
            }
        }
