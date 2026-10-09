		/**
		 * Paint the chosen skin, keep it in step with the preference, and register
		 * the Settings → Skins section.
		 * @param ctx - client plugin context.
		 */
		function apply (ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skins: dictionaries')
			ctx.effect(() => installStyle(PAGE_TAG, PAGE_CSS), 'skins: page stylesheet')
            createSettingsGlyph(ctx)
			createWorkWatcher(ctx)

            const updateSkinSheet = createSkinSheetUpdater()
            ctx.effect(() => () => updateSkinSheet.clear(), 'skins: stylesheet templates')
            const nudgeWindowChrome = createWindowChromeNotifier(ctx)

			const skinTag = document.createElement('style')
			skinTag.dataset.plugin = 'dsh-plugin-skins'
			skinTag.dataset.pluginCss = SKIN_TAG
			document.head.append(skinTag)
			ctx.effect(() => () => skinTag.remove(), 'skins: skin stylesheet')

			/* Host appearance changes repaint native tokens without changing the
             * plugin selection. Unload preserves the host appearance attribute. */
			const themeStore = createStore(document.body.hasAttribute('data-ds-dark-theme'))
			const observer = new MutationObserver(() => {
				themeStore.set(document.body.hasAttribute('data-ds-dark-theme'))
			})
			observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
			ctx.effect(() => () => observer.disconnect(), 'skins: theme observer')

			const { store, request } = createPreference(ctx)
			const surfaceGeometry = createSurfaceGeometry(ctx)
			const liquidGlass = createLiquidGlass(ctx, surfaceGeometry.refresh)
			surfaceGeometry.afterSync(() => liquidGlass.fit?.())

			/* The independent circles need real elements, so the plugin owns one
			 * container of its own. Hidden from assistive tech and inert to the
			 * pointer: it is scenery. */
			const bokehHost = document.createElement('div')
			bokehHost.setAttribute('data-sk-bokeh', '')
			bokehHost.setAttribute('aria-hidden', 'true')
			document.body.append(bokehHost)
			ctx.effect(() => () => bokehHost.remove(), 'skins: bokeh layer')

			const updateAmbientPlayback = createAmbientPlayback(ctx, bokehHost)
            let previousChoice, previousRecipe, previousCss, previousOn, previousOptical, previousScatter, previousBokeh, chromeTimer=0
			ctx.effect(()=>()=>clearTimeout(chromeTimer),'skins: caption settle')
			const paint = () => {
				const choice = store.getSnapshot()
                const recipe=choice===previousChoice ? previousRecipe : skinCssRecipe(choice)
				const css=recipe===previousRecipe ? previousCss : buildSkinCss(choice),on=isOn(choice)
                previousChoice=choice
                previousRecipe=recipe
                document.body.toggleAttribute('data-sk-active',on)
				const changed=css!==previousCss
				const stateChange=on!==previousOn
				if(changed){updateSkinSheet(skinTag,css);previousCss=css}
				if(stateChange){surfaceGeometry(on);previousOn=on}
				liquidGlass.setThickness?.(choice.thickness)
                liquidGlass.setRim?.(choice.rim)
                const optical=[on,choice.glass].join('/')
				if(optical!==previousOptical){liquidGlass(on&&choice.glass==='on');previousOptical=optical}
				else if(choice.intensity!==previousScatter&&on&&choice.glass==='on')liquidGlass.refresh?.()
				previousScatter=choice.intensity
				for (const module of MODULES) {
					/* The switch is the attribute itself, so a module can be turned off
					 * without regenerating the stylesheet. */
					document.body.toggleAttribute(module.attr, choice.skin !== 'off' && choice[module.id] === 'on')
				}
				const skin = skinById(choice.skin)
				const light = VIVIDS.find((v) => v.id === choice.vivid) ?? VIVIDS[1]
				const bokeh=[skin.id,light.id,choice.drift,ambientCssRate(choice.orbSpeed)].join('/')
				if(bokeh!==previousBokeh){mountBokeh(bokehHost, skin.id === 'off' ? [] : parseBlobs(skin.near, light.gain), choice.drift === 'on', choice.orbSpeed);previousBokeh=bokeh}
				updateAmbientPlayback(choice)
                if(changed){clearTimeout(chromeTimer);if(stateChange)nudgeWindowChrome();else chromeTimer=setTimeout(nudgeWindowChrome,300)}
			}
			paint()
			ctx.effect(() => store.subscribe(paint), 'skins: repaint')
			ctx.effect(() => themeStore.subscribe(paint), 'skins: repaint on theme')

			/* Take the switches back off when this plugin goes away.
			 *
			 * Measured with this entry set to `disabled: true` on the live window: the two
			 * stylesheets and the bokeh host go with their own effects, but the three
			 * data-sk-* attributes stayed on <body> after the plugin was gone. They are
			 * inert once the sheet is removed - nothing matches them - but "turned off"
			 * has to mean the page is back to exactly what the host painted, with nothing
			 * of ours left behind in the DOM. That is a claim the handover makes, so it is
			 * checked rather than assumed. */
			ctx.effect(() => () => {
				for (const module of MODULES) document.body.toggleAttribute(module.attr, false)
                document.body.toggleAttribute('data-sk-active',false)
			}, 'skins: body switches')

			ctx.slots.inject('settings.section', () => ctx.slots.register({
				name: 'settings.section',
				id: ENTRY_ID,
				order: 25,
				label: () => ctx.locale.bind(NS)('nav'),
				locale: NS,
				inject: () => ({ skinStore: store, themeStore, choose: request }),
			}, SkinsSection))
		}

