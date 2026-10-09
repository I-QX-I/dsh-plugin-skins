		/* ------------------------------------------------------------------ *
		 * Preference: localStorage cache + durable configForms write          *
		 * ------------------------------------------------------------------ */

		/** Minimal observable store; the framework only needs snapshot+subscribe. */
		function createStore (initial) {
			let snapshot = initial
			const listeners = new Set()
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener)
					return () => listeners.delete(listener)
				},
				set: (value) => {
					snapshot = value
					for (const listener of listeners) listener()
				},
			}
		}

		/** Normalize whatever the two stores hold into a usable choice. */
		function normalize (raw) {
			// Retired Ocean overlapped the original Aero. Normalize both storage
            // sources at the boundary; all other preferences retain their values.
            const skinId = raw?.skin === 'ocean' ? 'aero' : raw?.skin
            const skin = typeof skinId === 'string' && SKINS.some(s => s.id === skinId) ? skinId : DEFAULT_CHOICE.skin
			const intensity = typeof raw?.intensity === 'string' && INTENSITIES.some((i) => i.id === raw.intensity)
				? raw.intensity
				: DEFAULT_CHOICE.intensity
			const effect = typeof raw?.effect === 'string' && EFFECTS.some((e) => e.id === raw.effect)
				? raw.effect
				: DEFAULT_CHOICE.effect
			const vivid = typeof raw?.vivid === 'string' && VIVIDS.some((v) => v.id === raw.vivid)
				? raw.vivid
				: DEFAULT_CHOICE.vivid
			const speed = (value, fallback) => AMBIENT_SPEEDS.some(p => p.id === value) ? value : fallback
            const flag = (value, fallback) => (value === 'on' || value === 'off' ? value : fallback)
			return {
				skin,
                thickness: GLASS_THICKNESSES.some(p => p.id === raw?.thickness) ? raw.thickness : DEFAULT_CHOICE.thickness,
                rim: GLASS_RIMS.some(p => p.id === raw?.rim) ? raw.rim : DEFAULT_CHOICE.rim,
                flowSpeed: speed(raw?.flowSpeed, DEFAULT_CHOICE.flowSpeed), orbSpeed: speed(raw?.orbSpeed, DEFAULT_CHOICE.orbSpeed),
                colorSeparation: COLOR_SEPARATIONS.includes(raw?.colorSeparation) ? raw.colorSeparation : DEFAULT_CHOICE.colorSeparation,
				intensity,
				effect,
				vivid,
				drift: flag(raw?.drift, DEFAULT_CHOICE.drift),
				pointer: flag(raw?.pointer, DEFAULT_CHOICE.pointer),
				glass: flag(raw?.glass, DEFAULT_CHOICE.glass),
			}
		}

		/**
		 * Drop keys the other side did not actually carry.
		 *
		 * A field missing from the Host's accepted value means "this half has
		 * nothing to say about it", not "reset it". Spreading such a value straight
		 * over the live choice would let the Host's default overwrite the user's
		 * pick — which is how a freshly added field snaps back the moment the form
		 * answers, because the running Host module still has the older schema.
		 * @param raw - value as received.
		 * @returns the same value without undefined entries.
		 */
		function definedOnly (raw) {
			const out = {}
			for (const [key, value] of Object.entries(raw ?? {})) if (value !== undefined) out[key] = value
			return out
		}

		function readCache () {
			try {
				const raw = localStorage.getItem(LOCAL_KEY)
				if (raw === null) return undefined
                const parsed = JSON.parse(raw), choice = normalize(parsed)
                if (parsed?.skin === 'ocean') writeCache(choice)
                return choice
			} catch (_error) {
				return undefined
			}
		}

		function writeCache (choice) {
			try {
				localStorage.setItem(LOCAL_KEY, JSON.stringify(choice))
			} catch (_error) {
				/* Private mode or a disabled store: the session keeps the live value. */
			}
		}

		/**
		 * The plugin's single source of truth for the choice: seeded from the
		 * first-paint cache, reconciled with the Host's accepted value, and written
		 * back to both.
		 * @param ctx - client plugin context.
		 * @returns the live store plus the request entry point.
		 */
		function createPreference (ctx) {
			const store = createStore(readCache() ?? DEFAULT_CHOICE)
			let form
			let pending
			let requested = null
			let requestedTimer
			const queued = new Map()
			let writing = false
			let disposed = false

			/**
			 * Remember the choice the Host has been asked to store.
			 *
			 * A write takes a round trip, and the form notifies its subscribers
			 * before the new value is in — with the PREVIOUS one. Adopting that echo
			 * reverts the optimistic update and the control visibly bounces
			 * (new → old → new). Until the Host agrees, its echoes are stale by
			 * definition, so they are ignored; the deadline keeps a refused write from
			 * blocking other windows' changes forever.
			 */
			const expect = (choice) => {
				requested = choice
				clearTimeout(requestedTimer)
				const expire = () => {
					if (requested === null) return
					if (writing || pending !== undefined) {
						requestedTimer = setTimeout(expire, 2500)
						return
					}
					requested = null
				}
				requestedTimer = setTimeout(expire, 2500)
			}
			const same = (a, b) => a !== null && b !== null &&
				Object.keys(DEFAULT_CHOICE).every((key) => a[key] === b[key])

			/* One writer per form. A newer click replaces queued values for that key;
			 * unchanged fields never trigger extra profile rewrites or remounts. */
			const flush = async () => {
				if (writing || disposed || form === undefined) return
				writing = true
				try {
					while (queued.size > 0 && !disposed && form !== undefined) {
						const [key, value] = queued.entries().next().value
						queued.delete(key)
						await form.set(key, value)
					}
				} catch (error) {
					console.warn('[dsh-plugin-skins] Could not persist the skin preference', error)
				} finally {
					writing = false
				}
			}

			ctx.inject(['configForms'], (scope) => {
				form = scope.configForms.get(ENTRY_ID)
				const adopt = () => {
					const accepted = form.getSnapshot().value
					if (accepted === undefined) return
					const next = normalize({ ...store.getSnapshot(), ...definedOnly(accepted) })
					if (requested !== null) {
						if (!same(next, requested)) return
						clearTimeout(requestedTimer)
						requested = null
					}
					if (same(next, store.getSnapshot())) return
					store.set(next)
					writeCache(next)
				}
				const off = form.subscribe(adopt)
				adopt()
				if (queued.size > 0 && pending === undefined) void flush()
				return () => {
					off()
					form = undefined
				}
			})
			/** Paint now, persist after the user stops clicking. */
			const request = (patch) => {
				const previous = store.getSnapshot()
				const next = normalize({ ...previous, ...patch })
				if (same(previous, next)) return
				store.set(next)
				writeCache(next)
				expect(next)
				for (const key of Object.keys(next)) {
					if (previous[key] !== next[key]) queued.set(key, next[key])
				}
				if (pending !== undefined) clearTimeout(pending)
				pending = setTimeout(() => {
					pending = undefined
					void flush()
				}, WRITE_DELAY_MS)
			}
			ctx.effect(() => () => {
				disposed = true
				queued.clear()
				if (pending !== undefined) clearTimeout(pending)
				clearTimeout(requestedTimer)
			}, 'skins: pending write')
			return { store, request }
		}

