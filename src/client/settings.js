		/* ------------------------------------------------------------------ *
		 * Settings section                                                    *
		 * ------------------------------------------------------------------ */

		/** Subscribe to a plain observable store from a component. */
		function useStore (store) {
			/* The current host supports synchronous external-store snapshots.
			 * Keep the fallback for older host builds and offline rendering tools. */
			if (typeof React.useSyncExternalStore === 'function') {
				return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
			}
			const [value, setValue] = React.useState(store.getSnapshot())
			React.useEffect(() => {
				const update = () => setValue(store.getSnapshot())
				const off = store.subscribe(update)
				update()
				return off
			}, [store])
			return value
		}

		/**
		 * The Settings → Skins page: a master switch, one tile per skin, and the
		 * transparency preset.
		 * @param props - framework `t` seat, the choice hook, and the write action.
		 * @returns the section body.
		 */
		function SkinsSection (props) {
			const t = props.t
			const choice = useStore(props.skinStore)
			
			const on = isOn(choice)
			if (on) lastOnSkin = choice.skin

			const row = (title, hint, control) => h('div', { className: 'sk-row' }, [
				h('div', { className: 'sk-rowText' }, [
					h('div', { className: 'sk-rowTitle' }, title),
					hint === undefined ? null : h('div', { className: 'sk-rowDesc' }, hint),
				]),
				control,
			])

			const toggle = h('button', {
				type: 'button',
				role: 'switch',
				'aria-checked': on ? 'true' : 'false',
				'aria-label': t('enabled'),
				className: 'sk-switch',
				'data-on': on ? 'true' : undefined,
				onClick: () => props.choose({ skin: on ? 'off' : lastOnSkin }),
			}, h('span', { className: 'sk-knob' }))

			/* One row per module. The pattern is the same as the master switch, so the
			 * page reads as a list of capabilities rather than a pile of options. */
			const moduleRow = (id, title, hint) => {
				const value = choice[id] === 'on'
				return h('div', { className: 'sk-row' }, [
					h('div', { className: 'sk-rowText' }, [
						h('div', { className: 'sk-rowTitle' }, title),
						h('div', { className: 'sk-rowDesc' }, hint),
					]),
					h('button', {
						key: id,
						type: 'button',
						role: 'switch',
						'aria-checked': value ? 'true' : 'false',
						'aria-label': title,
						className: 'sk-switch',
						'data-on': value ? 'true' : undefined,
						disabled: on ? undefined : true,
						onClick: () => props.choose({ [id]: value ? 'off' : 'on' }),
					}, h('span', { className: 'sk-knob' })),
				])
			}

			const adjustmentControl = (key, presets, prefix) => {
                const enabled = on && (key !== 'thickness' || choice.glass === 'on') && (['rim', 'thickness'].includes(key) || choice.drift === 'on')
                return row(t(key), t(`${key}Hint`), h('div', {
                    className: 'sk-seg', role: 'group', 'aria-label': t(key),
                    'data-sk-adjustment': key, 'data-off': enabled ? undefined : 'true',
                }, presets.map(id => h('button', {
                    key: id, type: 'button', className: 'sk-segBtn',
                    'data-sk-value': id, 'data-on': choice[key] === id ? 'true' : undefined,
                    'aria-pressed': choice[key] === id ? 'true' : 'false', disabled: !enabled,
                    onClick: () => props.choose({ [key]: id }),
                }, t(`${prefix}_${id}`)))))
            }
            const tiles = h('div', { className: 'sk-grid' }, SKINS.filter(skin => skin.id !== 'off').map((skin) => h('button', {
				key: skin.id,
				type: 'button',
				className: 'sk-tile',
				'data-on': skin.id === choice.skin ? 'true' : undefined,
				'aria-pressed': skin.id === choice.skin ? 'true' : 'false',
				onClick: () => {
					if (skin.id !== 'off') lastOnSkin = skin.id
					props.choose({ skin: skin.id })
				},
			}, [
				h('span', { className: 'sk-swatch', style: { backgroundImage: skin.swatch } }),
				h('span', { className: 'sk-tileText' }, [
					h('span', { className: 'sk-tileName' }, t(skin.id)),
					skin.id === 'off' ? null : h('span', { className: 'sk-tileHint' }, t(`${skin.id}Hint`)),
				]),
			])))

			const seg = h('div', {
				className: 'sk-seg',
				'data-off': on ? undefined : 'true',
			}, INTENSITIES.map((preset) => h('button', {
				key: preset.id,
				type: 'button',
				className: 'sk-segBtn',
				'data-on': preset.id === choice.intensity ? 'true' : undefined,
				'aria-pressed': preset.id === choice.intensity ? 'true' : 'false',
				onClick: () => {
					if (!on) lastOnSkin = skinById(choice.skin).id === 'off' ? lastOnSkin : choice.skin
					props.choose({ skin: on ? choice.skin : lastOnSkin, intensity: preset.id })
				},
			}, t(preset.id))))

			const effectSeg = h('div', { className: 'sk-seg' }, EFFECTS.map((preset) => h('button', {
				key: preset.id,
				type: 'button',
				className: 'sk-segBtn',
				'data-on': preset.id === choice.effect ? 'true' : undefined,
				'aria-pressed': preset.id === choice.effect ? 'true' : 'false',
				onClick: () => props.choose({ effect: preset.id }),
			}, t(`effect_${preset.id}`))))

			const glassSeg = h('div', { className: 'sk-seg', role: 'group', 'aria-label': t('module_glass') }, ['off','on'].map(value => h('button', {
                key: value, type: 'button', className: 'sk-segBtn',
                'aria-pressed': choice.glass === value ? 'true' : 'false',
                'data-on': choice.glass === value ? 'true' : undefined,
                disabled: on ? undefined : true,
                onClick: () => props.choose({ glass: value }),
            }, t(value === 'on' ? 'glass_liquid' : 'glass_frosted'))))

			const vividSeg = h('div', { className: 'sk-seg' }, VIVIDS.map((preset) => h('button', {
				key: preset.id,
				type: 'button',
				className: 'sk-segBtn',
				'data-on': preset.id === choice.vivid ? 'true' : undefined,
				'aria-pressed': preset.id === choice.vivid ? 'true' : 'false',
				onClick: () => props.choose({ vivid: preset.id }),
			}, t(`vivid_${preset.id}`))))

			return h('div', { className: 'sk-page' }, [
				h('div', { className: 'sk-head' }, [
					h('h1', { className: 'sk-h1' }, t('title')),
					h('p', { className: 'sk-sub' }, t('description')),
				]),
				
				h('div', { className: 'sk-card' }, [row(t('enabled'), t('enabledHint'), toggle)]),
				h('div', { className: 'sk-card' }, [
					moduleRow('drift', t('module_drift'), t('module_driftHint')),
					moduleRow('pointer', t('module_pointer'), t('module_pointerHint')),
				]),
				h('div', {}, [
					h('p', { className: 'sk-label' }, t('choose')),
					tiles,
				]),
				h('div', {}, [
					h('p', { className: 'sk-label' }, t('transparency')),
					seg,
					h('p', { className: 'sk-hint' }, h('span', { 'aria-live': 'polite' }, choice.intensity === 'pure' ? t('pureWarning') : choice.intensity === 'bare' ? t('transparencyWarning') : t('transparencyHint'))),
				]),
				h('div', {}, [
					h('p', { className: 'sk-label' }, t('motion')),
					effectSeg,
					h('p', { className: 'sk-hint' }, t('motionHint')),
				]),
				h('div', {}, [
					h('p', { className: 'sk-label' }, t('vivid')),
					vividSeg,
					h('p', { className: 'sk-hint' }, t('vividHint')),
				]),
				h('div', { className: 'sk-card sk-material' }, [
                    adjustmentControl('flowSpeed', AMBIENT_SPEEDS.map(p => p.id), 'speed'),
                    adjustmentControl('orbSpeed', AMBIENT_SPEEDS.map(p => p.id), 'speed'),
                    adjustmentControl('colorSeparation', COLOR_SEPARATIONS, 'separation'),
                ]),
                h('div', { className: 'sk-card sk-material' }, [row(t('module_glass'), t('module_glassHint'), glassSeg), adjustmentControl('rim', GLASS_RIMS.map(p => p.id), 'rim'), adjustmentControl('thickness', GLASS_THICKNESSES.map(p => p.id), 'thickness')]),
				h('p', { className: 'sk-credit', 'data-sk-credit': '爱伦提卡' }, t('credit')),
                h('details', { className: 'sk-acknowledgements' }, [
                    h('summary', {}, t('acknowledgements')),
                    h('h2', {}, t('contributorsTitle')),
                    h('p', {}, t('contributorsText')),
                    h('p', {}, t('dependenciesText')),
                    h('h2', {}, t('referencesTitle')),
                    h('p', {}, t('referencesText')),
                    h('ul', {}, SK_REFERENCES.map(([label, href]) =>
                        h('li', { key: href + label }, h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label)))),
                    h('p', {}, t('creditsFiles')),
                ]),
			])
		}

		/* ------------------------------------------------------------------ *
		 * Plugin body                                                         *
		 * ------------------------------------------------------------------ */

		/** Services required for painting and the settings page. */
		const inject = ['slots', 'locale']

