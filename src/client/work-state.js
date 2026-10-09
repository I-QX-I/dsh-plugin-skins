		/**
		 * How long the retract animation runs. The state attribute has to outlive it,
		 * so this is the exit's duration plus a small margin.
		 */
		const RETRACT_MS = 830

		/**
		 * Translate the composer's send/stop icon swap into the `data-sk` attribute
		 * the working-state rules animate on.
		 *
		 * A `:has(> svg > rect)` selector can detect the swap, but it cannot outlive
		 * it: when the turn ends the selector stops matching and the browser drops the
		 * animation on that same frame, leaving nowhere to play a retract. Holding the
		 * state in an attribute gives the exit phase somewhere to live.
		 * @param ctx - client plugin context.
		 * @returns teardown that removes every attribute and listener it added.
		 */
		function createWorkWatcher (ctx) {
			let frame = 0
			let current = null
			let endTimer
			const readWorking = () => {
				const card = document.querySelector('[data-composer-card]')
				if (card === null) return null
				const rect = card.querySelector("button[class*='_primary'] > svg > rect")
				return rect === null ? null : rect.closest('button')
			}
			const evaluate = () => {
				frame = 0
				const button = readWorking()
				if (button === current) return
				clearTimeout(endTimer)
				endTimer = undefined
				const previous = current
				current = button
				if (button !== null) {
					if (previous !== null && previous.isConnected) previous.removeAttribute('data-sk')
					button.setAttribute('data-sk', 'work')
					return
				}
				if (previous === null || !previous.isConnected) return
				previous.setAttribute('data-sk', 'ending')
				endTimer = setTimeout(() => {
					endTimer = undefined
					previous.removeAttribute('data-sk')
				}, RETRACT_MS)
			}
			const schedule = () => {
				if (frame === 0) frame = requestAnimationFrame(evaluate)
			}
			const observer = new MutationObserver(schedule)
			observer.observe(document.body, { childList: true, subtree: true })
			schedule()
			ctx.effect(() => () => {
				observer.disconnect()
				if (frame !== 0) cancelAnimationFrame(frame)
				clearTimeout(endTimer)
				if (current !== null && current.isConnected) current.removeAttribute('data-sk')
			}, 'skins: working-state watcher')
		}

