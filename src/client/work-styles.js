		/* ------------------------------------------------------------------ *
		 * The skin stylesheet                                                 *
		 * ------------------------------------------------------------------ */

		/**
		 * Build the working-state motion rules for one effect preset.
		 *
		 * The state is carried by a `data-sk` attribute the watcher sets on the
		 * working button, not by `:has()`. `:has()` can detect the send-to-stop icon
		 * swap, but it cannot survive the swap back — the moment work ends the
		 * selector stops matching and the browser drops the animation on that frame,
		 * so there is nowhere to play a retract. An attribute is set by JavaScript,
		 * which can hold it for the length of the exit.
		 *
		 * The bead's inset shadows are identical in every frame — only the lit-edge
		 * alpha moves — because CSS interpolates a box-shadow list layer by layer and
		 * only when the counts match. The ring is a spread-only shadow, so it is a
		 * real annulus; the bloom is a blurred shadow far wider than the bead, which
		 * is what spills light onto the sheet around it.
		 * @param effect - `off`, `soft` or `strong`.
		 * @returns CSS text, empty for `off`.
		 */
		function buildWorkingCss (effect) {
			if (effect === 'off') return ''
			const work = "[data-sk='work']"
			const ending = "[data-sk='ending']"
			/* The state attribute has to sit between the class and any pseudo-element:
			 * nothing may follow `::after` in a selector. Both branches require BUTTON
			 * for the same reason as the static rules — a substring class match reaches
			 * wrappers, and the working halo must not be painted on the whole card. */
			const sel = (state = '', suffix = '') =>
				`[data-composer-card] button[class$='_primary']${state}${suffix},\n` +
				`[data-composer-card] button[class*='_primary ']${state}${suffix}`
			const lit = (v) => v.toFixed(2)
			/* The inset multipliers are chosen so that lit = 0.52 reproduces the
			 * resting rule's own insets (.52 / .13 / .30 / .07) exactly: the exit's
			 * last frame has to be the resting shadow, or removing the state
			 * attribute would change the bead. The first bloom layer also repeats the
			 * resting rule's permanent glow, so a frame with it at zero is the resting
			 * look and not a bead with its glow cut off. */
			const frame = (o) => [
				`inset 0 1px 0 rgba(255,255,255,${lit(o.lit)})`,
				`inset 0 -1px 0 rgba(255,255,255,${lit(o.lit * 0.23)})`,
				`inset 0 0 0 1px rgba(255,255,255,${lit(o.lit * 0.58)})`,
				`inset 0 0 13px rgba(var(--sk-glow),${lit(o.lit * 0.135)})`,
				'inset 0 0 0 rgba(var(--sk-glow-2),0)',
				'inset 0 0 0 rgba(var(--sk-glow),0)',
				'0 0 0 0 rgba(255,255,255,0)',
				`0 0 ${o.b1}px ${o.s1}px rgba(var(--sk-glow), ${lit(o.a1)})`,
				`0 0 ${o.b2}px ${o.s2}px rgba(var(--sk-glow), ${lit(o.a2)})`,
				/* The travelling ring is the skin's colour too.
				 *
				 * It used to be thrown in the second tone — the one rotated 26 degrees
				 * away to stand in for dispersion — and at alpha 0.46-0.66 with a spread
				 * of up to 8px that is not a fringe, it is a pink halo flashing around a
				 * violet bead at the start and the end of every run. Dispersion is worth
				 * keeping, and it is kept: it survives as the 0.10 hairline pair on the
				 * two inner corners, which is what a fringe actually looks like. A LIGHT
				 * has to be the colour of the surface it is on. */
				`0 0 ${o.rb}px ${o.rs}px rgba(var(--sk-glow), ${lit(o.ra)})`,
				/* A cast shadow is the absence of light, so it is neutral. It used to
				 * be a saturated blue, which is why the button read as blue on every
				 * skin no matter what the fill was. */
				'0 6px 16px rgba(0,0,0,0.42)',
				'0 1px 3px rgba(0,0,0,0.30)',
			].join(', ')

			/* The light that lives inside the glass: an 11s orbit, a 2.9s spark and a
			 * 5.3s icon breath. No period divides another.
			 *
			 * Every loop's first and last frame carries the value the bead has at
			 * rest, so starting and stopping does not change anything on screen — the
			 * loop departs from and returns to the resting appearance instead of
			 * snapping to it. The orbit layer is absent at rest and fades in through
			 * its own opacity transition. */
			const inner = `
${sel(work, '::after')} { opacity: 1; will-change: transform; animation: sk-bead-orbit 11s linear infinite; }
/* The light that breathes inside the glass is the SKIN's colour, not white.
 *
 * This element is the specular while idle, and its white is right there — a
 * reflection is the colour of its source. The working state re-uses the same
 * element as the light inside the bead, and a white cloud at half opacity over
 * the whole button is not a light, it is a wash: measured on screen the button's
 * core sat at 19-23% saturation while the composer it sits on was at 47-54%, so
 * the control went pale exactly when it was busiest. Four separate faults in this
 * project have now been "add white to make it brighter"; this is the last of them.
 *
 * Only the working state is recoloured. The idle specular keeps its white,
 * because that one is a reflection and reflections really are white. */
${sel(work, '::before')} {
	background: radial-gradient(closest-side circle at 50% 50%, rgba(var(--sk-glow-fill), 0.55), rgba(var(--sk-glow-fill), 0) 70%);
	animation: sk-bead-twinkle 2.9s ease-in-out infinite;
}
${sel(work, ' svg')} { animation: sk-bead-breathe 5.3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
@keyframes sk-bead-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
/* Alpha only. The spark scaled the light from 1 to 1.18 on every breath — the same
 * fault the halo below was already cured of, where a changing radius reads as the
 * OBJECT growing rather than as light rising. transform is therefore pinned to the
 * centred value in every frame. It cannot simply be dropped: the element's resting
 * transform parks it off-screen to the left, and the light would never be seen. */
@keyframes sk-bead-twinkle { 0%, 100% { transform: scale(1); opacity: 0.72; } 50% { transform: scale(1); opacity: 1; } }
@keyframes sk-bead-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }`

			/* Motion is optional. Stopping the loop keeps the state readable: the
			 * travelling rim light freezes, and the halo holds a settled mid value. */
			const still = `
@media (prefers-reduced-motion: reduce) {
	${sel(work)},
	${sel(ending)},
	${sel(work, '::after')},
	${sel(work, '::before')},
	${sel(work, ' svg')} { animation: none !important; }
	${sel(work, '::after')} { opacity: 0.85 !important; }
	${sel(work)} { box-shadow: ${frame({ lit: 0.56, rim: 0.28, b1: 10, s1: 3, a1: 0.28, b2: 22, s2: 6, a2: 0.14, rb: 5, rs: 4, ra: 0.22 })} !important; }
}`

			if (effect === 'soft') return inner + still

			/* The three phases share their boundary frames by reference. Hand-tuning
			 * two keyframes to "the same numbers" is what made the first cut feel
			 * wrong: the entry peaked and then dimmed before the loop's slow climb
			 * (a visible double pulse), and the exit opened on a value the loop only
			 * held at one phase, so ending a run mid-breath flashed.
			 *
			 * REST is the loop's trough, the entry's last frame and the exit's first
			 * frame. The entry's bloom now only ever rises, so it feeds straight into
			 * the loop's first inhale; the exit opens on the trough, which bounds how
			 * far it can disagree with the phase the loop happened to be in.
			 *
			 * Each keyframe also carries its own timing function: the gather
			 * decelerates as the ring closes, the release snaps, the retract settles
			 * then absorbs. One curve for a three-beat animation is what made the
			 * release feel mushy. */
			const REST = { lit: 0.52, rim: 0.24, b1: 7, s1: 1, a1: 0.24, b2: 16, s2: 4, a2: 0.12, rb: 3, rs: 0, ra: 0 }
			const SWELL = { lit: 0.58, rim: 0.30, b1: 10, s1: 3, a1: 0.33, b2: 24, s2: 7, a2: 0.17, rb: 4, rs: 3, ra: 0.30 }
			const PEAK = { lit: 0.64, rim: 0.38, b1: 14, s1: 4, a1: 0.42, b2: 34, s2: 10, a2: 0.22, rb: 6, rs: 12, ra: 0 }
			/** Dark, bloom-free, and with a wide invisible ring: the entry's origin. */
			const DARK = { lit: 0.44, rim: 0.14, b1: 0, s1: 0, a1: 0, b2: 0, s2: 0, a2: 0, rb: 4, rs: 20, ra: 0 }
			/** The plain crystal: every value the resting rule paints, and nothing else. */
			const GONE = { lit: 0.52, rim: 0.24, b1: 14, s1: 0, a1: 0.16, b2: 0, s2: 0, a2: 0, rb: 0, rs: 0, ra: 0 }
			const EASE_GATHER = 'cubic-bezier(0.25, 0.9, 0.4, 1)'
			const EASE_CLOSE = 'cubic-bezier(0.5, 0, 0.5, 1)'
			const EASE_RELEASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
			const EASE_SETTLE = 'cubic-bezier(0.4, 0, 0.5, 1)'
			const EASE_ABSORB = 'cubic-bezier(0.4, 0, 0.25, 1)'

			const halo = `
${sel(work)} {
	animation:
		sk-bead-gather 0.9s both,
		sk-bead-halo 3.4s ease-in-out 0.9s infinite;
}
${sel(ending)} {
	animation: sk-bead-retract 0.75s both;
}
/* Entry — the ring closes in and brightens, then throws one ring outward while
 * the bloom starts to rise. It ends on REST, so the loop continues the climb. */
@keyframes sk-bead-gather {
	0% { box-shadow: ${frame(DARK)}; animation-timing-function: ${EASE_GATHER}; }
	45% { box-shadow: ${frame({ lit: 0.56, rim: 0.30, b1: 2, s1: 0, a1: 0.06, b2: 5, s2: 1, a2: 0.03, rb: 6, rs: 8, ra: 0.46 })}; animation-timing-function: ${EASE_CLOSE}; }
	62% { box-shadow: ${frame({ lit: 0.64, rim: 0.44, b1: 4, s1: 0, a1: 0.12, b2: 9, s2: 2, a2: 0.06, rb: 4, rs: 3.5, ra: 0.66 })}; animation-timing-function: ${EASE_RELEASE}; }
	100% { box-shadow: ${frame({ ...REST, rb: 7, rs: 14, ra: 0 })}; }
}
/* Loop — intensity, not size, and no stops at the waypoints.
 *
 * Two faults were fixed here. The first version pulsed every parameter together —
 * blur radius 7 to 10 to 14, spread 1 to 3 to 4 — so the glow physically grew and
 * shrank, and the eye reads a changing radius as the object scaling. Only the
 * alphas move now; the radii are pinned to their resting values.
 *
 * The second fault was the tempo. Four waypoints on one ease-in-out curve means
 * velocity falls to zero four times per breath, and the stalls read as a stutter
 * rather than a breath. There are eight waypoints now, sampled from one smooth
 * asymmetric rise and fall, each segment on LINEAR timing — so the curve is
 * approximated without ever stopping. Nothing accelerates from rest or arrives at
 * rest except at the two ends of the cycle, where the value is the resting state
 * anyway, so the loop closes without a seam and restarts without a jump. */
@keyframes sk-bead-halo {
	0% { box-shadow: ${frame(REST)}; }
	12% { box-shadow: ${frame({ ...REST, lit: 0.535, rim: 0.262, a1: 0.27, a2: 0.135 })}; }
	28% { box-shadow: ${frame({ ...REST, lit: 0.565, rim: 0.305, a1: 0.33, a2: 0.17 })}; }
	46% { box-shadow: ${frame({ ...REST, lit: 0.595, rim: 0.35, a1: 0.385, a2: 0.20 })}; }
	64% { box-shadow: ${frame({ ...REST, lit: 0.605, rim: 0.365, a1: 0.40, a2: 0.21 })}; }
	80% { box-shadow: ${frame({ ...REST, lit: 0.585, rim: 0.33, a1: 0.355, a2: 0.185 })}; }
	92% { box-shadow: ${frame({ ...REST, lit: 0.548, rim: 0.276, a1: 0.29, a2: 0.145 })}; }
	100% { box-shadow: ${frame({ ...REST, rb: 6, rs: 12, ra: 0 })}; }
}
/* Exit — a ring comes back from outside, draws inward and brightens, then is
 * absorbed while the bloom decays to the plain crystal. It opens on REST and ends
 * on GONE, which is what the resting rule paints, so nothing pops. */
@keyframes sk-bead-retract {
	0% { box-shadow: ${frame({ ...REST, rb: 7, rs: 16, ra: 0 })}; animation-timing-function: ${EASE_SETTLE}; }
	38% { box-shadow: ${frame({ lit: 0.56, rim: 0.30, b1: 4, s1: 1, a1: 0.12, b2: 9, s2: 2, a2: 0.05, rb: 5, rs: 6, ra: 0.44 })}; animation-timing-function: ${EASE_ABSORB}; }
	100% { box-shadow: ${frame(GONE)}; }
}`
			return inner + halo + still
		}

