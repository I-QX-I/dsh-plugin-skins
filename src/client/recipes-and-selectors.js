		// Broad text surfaces use native glass instead of full-area SVG work.
		const SK_READING_SURFACE_HEIGHT = 240
		/**
		 * Transparency presets. `alpha*` drive every translucent token; `blur` and
		 * `bright` shape how much of the wallpaper survives behind a reading pane.
		 */
		/* NOTE on `float`: everything that floats is a CONTENT surface — menus,
		 * dialogs, tooltips, the slash-command list — so it carries text that has to
		 * be read. At the old values (0.34-0.56) the slash menu's rows bled into each
		 * other and were illegible. The guidance is explicit that thicker, more opaque
		 * materials are what provide contrast for text, so floating surfaces sit near
		 * the top of the range and keep only a hint of the backdrop. */
		/* The user's own statement of the rule, which is better than mine was:
		 *
		 *   "The background is not afraid of transparency — it holds no text, only
		 *    colour and light. What it is afraid of is text overlapping."
		 *
		 * So there are two independent decisions, and I had been treating them as one.
		 * The BACKDROP stays bright and vivid at every preset (bright is near 1): it is
		 * picture, and dimming it to win legibility is paying with the wrong currency.
		 * The SURFACES THAT CARRY TEXT stay solid: cards, menus, tooltips, code.
		 * The panes in between — the ones holding prose — sit at a moderate tint, dark
		 * enough that text has contrast and thin enough that the lights still read.
		 *
		 * Earlier revisions collapsed all three of those into one number and then
		 * dragged it up and down, which is why the picture got dark. */
		/* float is the surface for anything that FLOATS — menus, overlays, the task
		 * panel. It used to sit BELOW the card alpha, which is backwards: a floating
		 * surface has to be the most solid thing on screen, because it is the one
		 * carrying text over an unknown backdrop. Measured from the live DOM, the task
		 * panel was coming out at hsl(tint / 0.74), so 26% of a bright wallpaper bled
		 * through and turned a violet panel into a grey slab — which is exactly what
		 * the user pointed at. It now sits above the card at every intensity. */
		/* `side` is back to its original ladder. Raising it was an attempt to shrink the
		 * band the user reports at the bottom-left, and measured across four values it
		 * does nothing for it: +3 at 0.30, +3 at 0.36, +3 at 0.62, +3 at 0.82. An
		 * earlier reading of "+5 at 0.30, +3 at 0.62" was measurement noise, and the
		 * band is independent of the tint — as it must be, since it is still there with
		 * the skin switched off entirely. It belongs to the app's own sidebar.
		 *
		 * So the skin has no lever on it, and the higher alphas were only costing the
		 * sidebar its glass for nothing. */
		const INTENSITIES = [
            { id: 'pure', bar: 0, side: 0, center: 0, card: 0, float: 0, frame: 0, blur: 0, sat: 100, bright: 1 },
            {
                id: 'bare',
                bar: .045, side: .08, center: .06, card: .66, float: .80, frame: .065,
                blur: 5, sat: 138, bright: 1.04,
            },
			{
				id: 'crystal',
				bar: .12, side: .18, center: .14, card: .78, float: .86, frame: .17,
				blur: 12, sat: 140, bright: 1.04,
			},
			{
				id: 'clear',
				bar: 0.20, side: 0.30, center: 0.26, card: 0.86, float: 0.90, frame: 0.28,
				blur: 28, sat: 132, bright: 1.02,
			},
			{
				id: 'standard',
				bar: 0.34, side: 0.46, center: 0.42, card: 0.90, float: 0.93, frame: 0.44,
				blur: 26, sat: 124, bright: 0.98,
			},
			{
				id: 'deep',
				bar: 0.52, side: 0.64, center: 0.70, card: 0.95, float: 0.96, frame: 0.72,
				blur: 24, sat: 116, bright: 0.92,
			},
		]

        // Preset materials have one source. Both render paths consume these
        // values; a zero blur is intentional and must never become a fallback.
        const MATERIAL_PRESETS = {
            pure:     {settings:0, row:0, scatter:0, tint:0, liquid:[0,0,0,0,0], frosted:[0,0,0,0,0]},
            bare:     {settings:.18, row:.035, scatter:.10, tint:.26, liquid:[1.5,2,4,4,.10], frosted:[1.5,2,6,6,.24]},
            crystal:  {settings:.30, row:.08, scatter:.28, tint:.62, liquid:[3,3,6,6,.18], frosted:[4,6,10,10,.48]},
            clear:    {settings:.46, row:.12, scatter:1, tint:1, liquid:[6,5,10,6,.24], frosted:[12,18,22,10,.62]},
            standard: {settings:.60, row:.12, scatter:1, tint:1, liquid:[6,5,10,6,.24], frosted:[12,18,22,10,.62]},
            deep:     {settings:.74, row:.12, scatter:1, tint:1, liquid:[6,5,10,6,.24], frosted:[12,18,22,10,.62]},
        }

		const AMBIENT_SPEEDS = [{ id: 'slow', rate: .5 }, { id: 'standard', rate: 1 }, { id: 'fast', rate: 1.5 }, { id: 'faster', rate: 2 }]
        const GLASS_THICKNESSES = [{ id: 'thin', shoulder: .8, bend: .7 }, { id: 'standard', shoulder: 1, bend: 1 }, { id: 'thick', shoulder: 1.15, bend: 1.18 }]
        const glassThickness = id => GLASS_THICKNESSES.find(p => p.id === id) ?? GLASS_THICKNESSES[1]
        const GLASS_RIMS = [{ id: 'off', width: 1, gain: 0 }, { id: 'thin', width: 1, gain: 1 }, { id: 'standard', width: 1.5, gain: 1.65 }, { id: 'thick', width: 2, gain: 2.5 }]
        const glassRim = id => GLASS_RIMS.find(p => p.id === id) ?? GLASS_RIMS[1]
        const COLOR_SEPARATIONS = ['soft', 'standard', 'bold']
        const ambientRate = id => AMBIENT_SPEEDS.find(p => p.id === id)?.rate ?? 1
        const ambientPlaybackSupported = () => typeof window.Animation?.prototype?.updatePlaybackRate === 'function' && typeof document.getAnimations === 'function'
        const ambientCssRate = id => ambientPlaybackSupported() ? 1 : ambientRate(id)
        const DEFAULT_CHOICE = { skin: 'aero', intensity: 'bare', effect: 'strong', drift: 'on', pointer: 'on', vivid: 'standard', glass: 'on', flowSpeed: 'faster', orbSpeed: 'standard', colorSeparation: 'bold', rim: 'thin', thickness: 'standard' }

		/* Light, surface lightness and transmission move together; opacity itself
		 * stays bounded. Reading surfaces retain their denser background. */
		const VIVIDS = [
			{ id: 'soft', gain: 0.80, sceneLift: 2, surfaceLift: 3, materialAlpha: 0.30 },
			{ id: 'standard', gain: 1.08, sceneLift: 5, surfaceLift: 7, materialAlpha: 0.26 },
			{ id: 'vivid', gain: 1.65, sceneLift: 9, surfaceLift: 13, materialAlpha: 0.22 },
			{ id: 'radiant', gain: 2.15, sceneLift: 14, surfaceLift: 18, materialAlpha: .20 },
		]
		/** Remembered so the master switch can restore the last chosen skin. */
		let lastOnSkin = 'aero'

		/**
		 * Module switches. Each capability of this plugin can be turned off on its
		 * own, and the switch is a `data-sk-*` attribute on body rather than a
		 * regenerated stylesheet: the sheet is versioned by the paint, so toggling one
		 * module repaints nothing and needs no reload.
		 */
		const MODULES = [
			{ id: 'drift', attr: 'data-sk-drift' },
			{ id: 'pointer', attr: 'data-sk-pointer' },
			/* Liquid material is independently switchable. */
			{ id: 'glass', attr: 'data-sk-glass' },
		]

		/**
		 * Everything the pointer can act on. The roles cover semantic controls; the
		 * class list covers the ones the shell renders as plain elements — the
		 * sidebar's nav and session rows, and a role-only selector would leave the
		 * busiest surface in the app inert.
		 */
		const INTERACTIVE = ":is(button, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [role='switch'], [role='checkbox'], [role='radio'], summary, a[href], [class*='_panelRow'], [class*='_iconButton'], [class*='_fileLink'], [class*='_cardWorkspaceTrigger'], [class$='_sessionRow'], [class*='_sessionRow '], [class$='_projectRow'], [class*='_projectRow '], [class$='_searchResultRow'], [class*='_searchResultRow '])"
		/* CSS modules use both prefix and suffix hashes. Match the complete card
		 * token, including multi-class elements, without painting cardTitle,
		 * cardPreview or cardContent. Hover previews have their own floating material. */
		const CONTENT_CARDS = ":is([class$='_card'], [class*='_card '], [class^='_card_'], [class*=' _card_']):not([data-composer-card]):not(.sk-card):not(.md-code-block):not(:has(> [class*='_hoverContent']))"

		/* The sidebar's panel switcher — 插件 / 自动化任务 and any further rows the host
		 * adds to that list. The host marks the open panel with a `_panelActive` class
		 * plus `aria-current='page'`, and paints it with the SAME flat fill it gives
		 * `:hover`: `_panelRow._panelActive { background: var(--dsw-alias-interactive-bg-hover) }`.
		 * So the row a user is actually standing on looked exactly like the row the
		 * pointer happened to be over, and neither of them was glass. That is the flat
		 * colour block in the sidebar.
		 *
		 * Selection is a resting state, not a passing one, so it gets a material layer
		 * of its own instead of the shared wash.
		 *
		 * The element type is required, not decoration: `_panelRow` is a CSS-module
		 * family name, so the bare substring also matches wrappers. The host renders
		 * these rows as BUTTONs (`button._2H3hWW_panelRow` inside
		 * `nav._2H3hWW_panelList`), and only a real button may be pressed. Selection is
		 * carried by both the class and `aria-current='page'`; either arm is enough.
		 *
		 * These three are declared BEFORE FILLED_INTERACTIVE because the generic wash
		 * family below has to name NOT_PANEL_CONTROLS. */
		const PANEL_CONTROLS = "button[class*='_panelRow']"
		const PANEL_ACTIVE = ":is(" + PANEL_CONTROLS + "[class*='_panelActive'], " + PANEL_CONTROLS + "[aria-current='page'])"
		/* Exclude every panel navigation target from generic pointer plates. The
		 * selected target owns one glass layer; unselected targets remain clear.
		 * :where keeps this exclusion from raising the generic rule's specificity. */
		const NOT_PANEL_CONTROLS = `:not(:where(${PANEL_CONTROLS}))`
		/* Disclosure labels and plugin text links answer with native text/focus
		 * feedback, not the filled-control hover plate. */
		const TEXT_CONTROLS = ":is(button[data-turn-process], button[data-process-activity], button[class*='_cardTitle'], button[class*='_rowOpen'], button[class*='_groupInfo'], button[class*='_guideToggle'], button[class*='_registryToggle'], button[class*='_crumb'])"
		/* Text links, underline tabs and invisible card click targets are not
		 * filled controls. Their own underline/focus states remain available. */
		const FILLED_INTERACTIVE = INTERACTIVE + ":not([class$='_brand']):not([class*='_brand ']):not(.sk-segBtn):not(a[href]):not([class*='_fileLink']):not([class*='_fileMention']):not([class*='_cardTitle']):not([role='tab']):not([role='switch']):not([role='checkbox']):not([role='radio']):not([class*='_cardPreview']):not([data-composer-card] button[class*='_primary']):not(:has(> [class*='_hoverContent'])):not([class*='_sessionRow'][aria-selected='true']):not([class*='_sessionRow'][class*='_selected'])" + `:not(${CONTENT_CARDS})` + NOT_PANEL_CONTROLS + `:not(${TEXT_CONTROLS})`
		const PLUGIN_CARDS = CONTENT_CARDS + ":has(> [class*='_cardHead'] [class*='_cardOpen'])"
		const COMPOSER_DOCK = ":is([class$='_dock'], [class*='_dock ']):has(> [data-slot='conversation.composer.dock'] > [data-composer-stats])"
		const CONNECTED_COMPOSER = "[data-composer-card]:has(~ :is([class$='_dock'], [class*='_dock ']) > [data-slot='conversation.composer.dock'] > [data-composer-stats])"
		const COMPOSER_SURFACE = ":is([class$='_root'], [class*='_root ']):has(> [data-composer-card]:first-child):has(> :is([class$='_dock'], [class*='_dock ']) > [data-slot='conversation.composer.dock'] > [data-composer-stats])"
		const GLASS_CONTROLS = `:is([class*='_tabs'] > button[role='tab'])`
		const SESSION_SELECTED = "[class*='_sessionRow']:is([aria-selected='true'],[class*='_selected']):not([class*='_dropBefore']):not([class*='_dropAfter'])"
		const NAV_SELECTED = `:is(${SESSION_SELECTED},${PANEL_ACTIVE},${GLASS_CONTROLS}[aria-selected='true'])`
		const HOVER_PREVIEW = "body > :has(> [class*='_hoverContent'])"
		const DOCK_TABS = "[data-dockkit-tab][role='tab']"
		const SETTINGS_PANEL = "[role='dialog']:has([class*='_options'])"
		/* The statistics tray is deliberately absent from both families.
		 *
		 * The user asked for the glass to come off the metrics row and for it to go
		 * back to its original place. It is also the one surface that is on screen
		 * for every scroll of the transcript and spans almost the full card width, so
		 * its backdrop-filter was being re-sampled continuously over the moving
		 * wallpaper. Dropping it removes a full-width blur AND the union geometry that
		 * fused it to the card. */
		const GLASS_SURFACES = `:is([class*='_tabs'] > button[role='tab'], ${DOCK_TABS})`

		/**
		 * Working-state motion presets. `strong` is the halo: a light ring leaves
		 * the bead on every breath and the bloom spills onto the sheet around it.
		 * `soft` keeps only the light that moves inside the glass.
		 */
		const EFFECTS = [
			{ id: 'off' },
			{ id: 'soft' },
			{ id: 'strong' },
		]

		const skinById = (id) => SKINS.find((s) => s.id === id) ?? SKINS[0]
		const intensityById = (id) => INTENSITIES.find((i) => i.id === id) ?? INTENSITIES.find(i => i.id === DEFAULT_CHOICE.intensity)
		const isOn = (choice) => choice.skin !== 'off'

