		const React = require('react')
		const h = React.createElement

		/** Locale namespace owned by this plugin. */
		const NS = 'plugin.skins'
		/** Loader entry id; also the `configForms` namespace. */
		const ENTRY_ID = 'skins'
		/** localStorage key for the first-paint cache. */
		const LOCAL_KEY = 'dsh-plugin-skins.choice'
		/** Style-tag identity, so re-activation replaces rather than stacks. */
		const SKIN_TAG = 'dsh-plugin-skins/skin.css'
		/** The settings page's own stylesheet, installed independently of the skin. */
		const PAGE_TAG = 'dsh-plugin-skins/page.css'
		/** Distance between the input card's lower edge and the statistics row.
		 *  Read by the sheet, its rim, the lens viewport and the row's top padding, so
		 *  the glass and the content it sits above cannot disagree about the boundary.
		 *  Declared here rather than next to the rules it feeds: a declaration inside
		 *  the stylesheet literal would be emitted as CSS text, and the rules would
		 *  silently receive the un-interpolated placeholder instead of this value. */
		const SK_TRAY_GAP = '12px'
		/** Debounce for the durable write behind a rapid series of clicks. */
		const WRITE_DELAY_MS = 350

        /** One cleanup contract for modern and legacy MediaQueryList APIs. */
        function listenMediaQuery (media, listener) {
            if (typeof media?.addEventListener === 'function') {
                media.addEventListener('change', listener)
                return () => media.removeEventListener('change', listener)
            }
            if (typeof media?.addListener === 'function') {
                media.addListener(listener)
                return () => media.removeListener(listener)
            }
            return () => {}
        }

