/*
 * Created by 爱伦提卡 / Made by 爱伦提卡 	
 * Glass Skins for DeepSeek Harness	 
 * Attribution-ID: glass-skins.ailuntika.2026 	
 * Copyright (c) 2026 爱伦提卡 	
 * SPDX-License-Identifier: MIT		
 * Static attribution only; no tracking or device/user identifiers.		
 */
/**
 * Glass skins for the Web UI, with a picker page in Settings.  
 *		
 * The whole appearance is one stylesheet. It is generated from two choices — 	
 * a skin (wallpaper + tint) and a transparency preset — and installed on the  
 * document while the plugin is active. Turning the skin off removes the	 
 * stylesheet and everything the host ships returns unchanged. 	
 * 	
 * How the glass is built 	
 * ----------------------  
 * 1. `body` paints the skin's wallpaper, fixed to the viewport, and defines the 	
 *    glass recipe as custom properties. Every sheet below reads those, so a		
 *    skin only has to supply a tint and a wallpaper.	 
 * 2. The shell's surface tokens (`--dsw-alias-bg-*`, `--dsw-specific-*`,	 
 *    `--dsw-alias-button-elevated-fill`, `--dsw-specific-bubble`, …) are  
 *    redefined as translucent tints. Panels, cards, pills and message bubbles 	
 *    therefore become glass without naming component classes.  
 * 3. `backdrop-filter` is applied only to surfaces large enough for the blur to  
 *    read, and never to the composer card itself: the title-bar strip, the sidebar 	
 *    column and the centre column stay filter-free so their children can still	 
 *    sample the wallpaper, and the composer's blur — when the user turns it on —  
 *    lives on a pseudo-element rather than on the card. See the composer's glass		
 *    rule for why that distinction is the whole fix. A `backdrop-filter` element  
 *    becomes a backdrop root, so the		
 *    filter deliberately stops at those frame children; the frame itself stays 	
 *    filter-free and merely carries a light tint, which is also what fills the		
 *    rounded notch where the centre column meets the sidebar.		
 * 4. Specular gloss: a 1px lit top edge, a hairline inner stroke and a short
 *    sheen gradient on every sheet — the "lit glass" edge.
 *
 * Windows caption buttons
 * -----------------------
 * The desktop preload writes a hidden probe's computed `background-color` and
 * `color` into `mainWindow.setTitleBarOverlay()`, keeping the native caption
 * strip in step with the page. The probe's inline style names
 * `--dsw-specific-sidebar-fill`, so it is addressable from CSS: this skin makes
 * it transparent, which removes the opaque-looking band the stock colour put
 * over the glass. The preload only re-measures when an observed attribute
 * changes, so after painting we nudge `document.body.style` to force a fresh
 * reading.
 *
 * Preference
 * ----------
 * `localStorage` is the first-paint cache (so a reload shows the right skin
 * immediately) and `ctx.configForms.get('skins')` is the durable store, written
 * through the Host's settings service. The write is debounced: each one
 * rewrites the profile patch and reconciles this Loader entry.
 *
 * @see @deepseek-ai/dsh-client-ui-theme — the `--dsw-*` design tokens this skin redefines
 * @see @deepseek-ai/dsh-client-ui-layout — `BynINW_frame` / `sidebarCol` / `centerCol`
 * @see @deepseek-ai/dsh-client-ui-settings — the `configForms` service and `settings.section`
 */
window.__ModuleLoader__.load({
	id: 'dsh-plugin-skins',
	factory(require) {
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

		const zh = {
            acknowledgements: "贡献致谢与参考资料",
            contributorsTitle: "制作与贡献",
            contributorsText: "爱伦提卡负责制作与设计。OpenAI Codex 和 DeepSeek Harness 中的 AI 助手参与代码实现、优化与测试。感谢 DeepSeek AI 及 Harness 开源贡献者提供宿主与插件接口。",
            dependenciesText: "随包依赖：@deepseek-ai/schemastery、@deepseek-ai/cosmokit、@standard-schema/spec；作者、版权与许可证保留在各依赖的 package.json / LICENSE。",
            referencesTitle: "设计与技术参考",
            referencesText: "感谢 Apple、W3C、Google、Microsoft、Adobe、Nintendo，以及 shuding、rdev、MoonGlassKitty、Alex Harri、sa3dany 等参考项目作者。相关项目与资料列于下方。",
            creditsFiles: "完整致谢见 CREDITS.md，第三方许可见 NOTICE.md，参考资料见 docs/SOURCES.md。",

			nav: '皮肤',
			title: '皮肤',
			credit: '由爱伦提卡制作',
			description: '模糊玻璃柔和通透，液体玻璃具有弯曲折射边缘。选择即时生效，并会记住到下次启动。',
			enabled: '启用玻璃皮肤',
			enabledHint: '关闭后立即恢复 DeepSeek Harness 的默认外观。',
			choose: '外观',
			transparency: '透明度',
			transparencyHint: '晶透减少遮色与散射；极透进一步透出背景，适合简洁场景。',
			pureWarning: '全透是实验档：不加遮色和模糊，背景文字可能重叠，阅读可能困难。适合玩视觉效果；阅读时请切回其他档位。',
			transparencyWarning: '极透非常透明，复杂或明亮的背景可能影响阅读；需要时切回晶透或通透。',
			off: '关闭',
			aero: 'Aero',
			aeroHint: 'Windows 7 经典蓝',
			aurora: '极光',
			auroraHint: '青紫渐变',
            phoenix: '凤凰', phoenixHint: '鲜明朱红与纯净金黄',
            flame: '火焰', flameHint: '鲜亮朱红、橙红与炽热火焰黄',
            jade: '翠岚', jadeHint: '草木翠绿，明净清润',
            teal: '青境', tealHint: '深青底色、松石光与克制古金',
            rose: '玫瑰石英', roseHint: '深莓底色、鲜亮玫瑰与暖桃光',
            amber: '琥珀', amberHint: '深铜底色与饱满金光',
			graphite: '石墨',
			graphiteHint: '低饱和，适合长时间阅读',
			pure: '全透',
			bare: '极透',
			crystal: '晶透',
			clear: '通透',
			standard: '标准',
			deep: '沉稳',
			motion: '工作动效',
			motionHint: '输入框右下角的按钮在你工作时会亮起光圈并呼吸，停止后收回。',
			vivid: '光感与鲜艳度',
			vividHint: '绚丽比鲜艳有更强的色彩与光感；石墨保持低饱和，阅读文字保持清晰。',
			vivid_soft: '柔和',
			vivid_standard: '标准',
			vivid_vivid: '鲜艳',
			vivid_radiant: '绚丽',
			module_drift: '背景光斑漂移',
			thickness: '玻璃厚度（折射）', thicknessHint: '改变液体玻璃的折射宽度与弯折量；大段文字保留轻量材质。',
            thickness_thin: '轻薄', thickness_standard: '标准', thickness_thick: '厚实',
            rim: '玻璃边缘高光', rimHint: '调整亮边的强弱；玻璃的实际折射由下面的厚度选项控制。',
            rim_off: '关闭', rim_thin: '轻薄', rim_standard: '标准', rim_thick: '厚实',
            flowSpeed: '渐变流动速度', flowSpeedHint: '调整背景色彩交汇的节奏。',
            orbSpeed: '光球漂移速度', orbSpeedHint: '只调整平面移动，呼吸保持柔和。',
            colorSeparation: '渐变色彩区分度', colorSeparationHint: '柔和融合或鲜明交汇，保留主题配色。',
            speed_slow: '舒缓', speed_standard: '标准', speed_fast: '轻快', speed_faster: '快速',
            separation_soft: '柔和', separation_standard: '标准', separation_bold: '鲜明',
            module_driftHint: '渐变色彩连续流动，固定大小的光球在平面漂移并柔和呼吸。',
			module_pointer: '指针交互反馈',
			module_pointerHint: '鼠标移上去有状态层，按下去有更快的按压反馈。',
			module_glass: '玻璃材质',
			module_glassHint: '液体玻璃带有柔和边缘折射；模糊玻璃保留原来的磨砂质感。两种模式使用相同的布局与交互。',
			glass_liquid: '液体玻璃',
			glass_frosted: '模糊玻璃',
			effect_off: '关闭',
			effect_soft: '轻微',
			effect_strong: '光圈',
			
		}
		const en = {
            acknowledgements: "Credits and references",
            contributorsTitle: "Creation and contributions",
            contributorsText: "Created and designed by 爱伦提卡, with development and testing assistance from OpenAI Codex and the AI assistant in DeepSeek Harness. Thanks to DeepSeek AI and the Harness contributors for the host and plugin APIs.",
            dependenciesText: "Bundled dependencies: @deepseek-ai/schemastery, @deepseek-ai/cosmokit and @standard-schema/spec. Original author, copyright and licence notices remain in each package.json / LICENSE.",
            referencesTitle: "Design and technical references",
            referencesText: "Thanks to Apple, W3C, Google, Microsoft, Adobe, Nintendo, and reference authors including shuding, rdev, MoonGlassKitty, Alex Harri and sa3dany. Related projects and resources are listed below.",
            creditsFiles: "Full credits: CREDITS.md. Third-party licenses: NOTICE.md. Reference links: docs/SOURCES.md.",

			nav: 'Skins',
			title: 'Skins',
			credit: 'Made by 爱伦提卡',
			description: 'Frosted glass softly diffuses the background; liquid glass adds curved refractive edges. Changes apply immediately and are remembered.',
			enabled: 'Enable glass skin',
			enabledHint: 'Turn off to restore the stock DeepSeek Harness appearance.',
			choose: 'Appearance',
			transparency: 'Transparency',
			transparencyHint: 'Crystal clear reduces tint and scattering. Ultra reveals more background and suits quieter scenes.',
			pureWarning: 'Pure is experimental: no tint or blur. Background text may overlap and become difficult to read. Enjoy the visual effect; use another preset for reading.',
			transparencyWarning: 'Ultra is very transparent. Busy or bright backgrounds can affect reading; switch to Crystal clear or Clear when needed.',
			off: 'Off',
			aero: 'Aero',
			aeroHint: 'Classic Windows 7 blue',
			aurora: 'Aurora',
			auroraHint: 'Teal and violet',
            phoenix: 'Phoenix', phoenixHint: 'Vermilion and gold',
            jade: 'Jade Mist', jadeHint: 'Lush emerald and fresh leaf green',
            teal: 'Verdigris', tealHint: 'Deep teal, turquoise and restrained antique gold',
            flame: 'Flame', flameHint: 'Bright vermilion, fiery orange and luminous yellow',
            rose: 'Rose Quartz', roseHint: 'Berry violet and luminous rose',
            amber: 'Amber', amberHint: 'Deep bronze and warm gold',
			graphite: 'Graphite',
			graphiteHint: 'Low saturation, easy on long reads',
			pure: 'Pure',
			bare: 'Ultra',
			crystal: 'Crystal clear',
			clear: 'Clear',
			standard: 'Standard',
			deep: 'Deep',
			motion: 'Working motion',
			motionHint: 'While you work, the button at the composer edge lights up a halo and breathes; it retracts when the run ends.',
			vivid: 'Light and vividness',
			vividHint: 'Radiant adds stronger colour and light than Vivid. Graphite stays neutral and text stays legible.',
			vivid_soft: 'Soft',
			vivid_standard: 'Standard',
			vivid_vivid: 'Vivid',
			vivid_radiant: 'Radiant',
			module_drift: 'Drifting background lights',
			thickness: 'Glass thickness (refraction)', thicknessHint: 'Adjust liquid refraction width and bend; long text keeps its lightweight material.',
            thickness_thin: 'Thin', thickness_standard: 'Standard', thickness_thick: 'Thick',
            rim: 'Glass edge highlights', rimHint: 'Adjust the rim emphasis; optical thickness below controls actual refraction.',
            rim_off: 'Off', rim_thin: 'Thin', rim_standard: 'Standard', rim_thick: 'Thick',
            flowSpeed: 'Gradient flow speed', flowSpeedHint: 'Set the pace of the background color flow.',
            orbSpeed: 'Light drift speed', orbSpeedHint: 'Adjust planar movement; breathing stays gentle.',
            colorSeparation: 'Gradient color separation', colorSeparationHint: 'Soft blends or distinct intersections within your theme.',
            speed_slow: 'Slow', speed_standard: 'Standard', speed_fast: 'Brisk', speed_faster: 'Fast',
            separation_soft: 'Soft', separation_standard: 'Standard', separation_bold: 'Distinct',
            module_driftHint: 'Flowing gradients and fixed-size drifting lights with gentle breathing.',
			module_pointer: 'Pointer feedback',
			module_pointerHint: 'Hovering shows a state layer; pressing answers faster than releasing.',
			module_glass: 'Glass material',
			module_glassHint: 'Liquid glass adds gentle edge refraction. Frosted glass keeps the previous blurred finish. Both share layout and interactions.',
			glass_liquid: 'Liquid glass',
			glass_frosted: 'Frosted glass',
			effect_off: 'Off',
			effect_soft: 'Subtle',
			effect_strong: 'Halo',
			
		}

		/* ------------------------------------------------------------------ *
		 * Skins                                                              *
		 * ------------------------------------------------------------------ */

        /** Ground stays stationary. Two broad compositor color fields and five
         * fixed-size lights share the scene budget. Near anchors feed the light
         * planner; their legacy dimensions are not additional rendered circles.
         * Rich wallpapers and readable glass surfaces have separate roles.
         */
        // Shared scene data is allocated once, independent of theme selection.
        const SCENE_LIGHT_ANCHORS = [
            [272, 90, 86, .36], [232, 6, 44, .24], [190, 12, 16, .48],
            [164, 82, 12, .42], [150, 57, 66, .28], [132, 34, 83, .32],
            [108, 46, 8, .40], [96, 25, 47, .34], [88, 71, 41, .36],
            [76, 93, 58, .32], [68, 64, 92, .36], [58, 8, 74, .34],
        ]
        const SCENE_FIELD_ANCHORS = [
            [880, 640, 6, -6, .34], [760, 560, 96, 30, .30],
            [680, 520, 44, 106, .26],
        ]
        const chromaticScene = (tint, base, stops, colors) => ({
            tint, base,
            swatch: `linear-gradient(140deg, rgb(${colors[1]}), ${stops[1]} 52%, ${base})`,
            ground: `linear-gradient(118deg,transparent 8%,rgba(${colors[1]},.13) 24%,transparent 36%),radial-gradient(126% 108% at 50% 44%,transparent 48%,rgba(0,0,0,.52) 100%),linear-gradient(160deg,${stops[0]} 0%,${stops[1]} 26%,${stops[2]} 54%,${stops[3]} 78%,${base} 100%)`,
            far: SCENE_FIELD_ANCHORS.map(([w, h, x, y, a], i) =>
                `radial-gradient(${w}px ${h}px at ${x}% ${y}%,rgba(${colors[i % colors.length]},${a}),rgba(${colors[i % colors.length]},0) 64%)`
            ).join(','),
            near: SCENE_LIGHT_ANCHORS.map(([r, x, y, a], i) =>
                `radial-gradient(circle ${r}px at ${x}% ${y}%,rgba(${colors[i % colors.length]},${a}) 0 40%,rgba(${colors[i % colors.length]},0) 76%)`
            ).join(','),
        })
		const SKINS = [
			{
				id: 'off',
				swatch: 'linear-gradient(140deg, #1b1b1c, #101012)',
			},
			{
				id: 'aero',
				tint: '212 60% 11%',
				swatch: 'linear-gradient(140deg, #2f8fe0, #0a2b52 55%, #061423)',
				ground: [
					'linear-gradient(112deg, rgba(255,255,255,0) 6%, rgba(198,238,255,.15) 21%, rgba(255,255,255,0) 33%)',
					'linear-gradient(112deg, rgba(255,255,255,0) 51%, rgba(198,238,255,.11) 63%, rgba(255,255,255,0) 75%)',
					'radial-gradient(128% 110% at 48% 42%, rgba(0,0,0,0) 46%, rgba(0,0,0,.50) 100%)',
					'linear-gradient(158deg, #15518b 0%, #104474 24%, #092e53 52%, #061d35 76%, #04192e 100%)',
				].join(','),
				far: [
					'radial-gradient(940px 680px at 2% -8%, rgba(54,120,192,.52), rgba(54,120,192,0) 62%)',
					'radial-gradient(640px 480px at 104% 30%, rgba(34,150,180,.20), rgba(34,150,180,0) 66%)',
					'radial-gradient(720px 560px at 58% 108%, rgba(48,109,208,.30), rgba(48,109,208,0) 64%)',
					'radial-gradient(520px 420px at 76% -6%, rgba(64,132,208,.24), rgba(64,132,208,0) 62%)',
				].join(','),
				near: [
					'radial-gradient(circle 268px at 88% 88%, rgba(96,150,255,.34) 0 42%, rgba(96,150,255,0) 78%)',
					'radial-gradient(circle 224px at 7% 47%, rgba(120,200,255,.26) 0 40%, rgba(120,200,255,0) 76%)',
					'radial-gradient(circle 176px at 16% 21%, rgba(150,226,255,.52) 0 40%, rgba(150,226,255,0) 76%)',
					'radial-gradient(circle 168px at 93% 23%, rgba(78,240,222,.34) 0 40%, rgba(78,240,222,0) 76%)',
					'radial-gradient(circle 158px at 62% 11%, rgba(120,205,255,.32) 0 40%, rgba(120,205,255,0) 76%)',
					'radial-gradient(circle 142px at 43% 73%, rgba(150,190,255,.28) 0 42%, rgba(150,190,255,0) 78%)',
					'radial-gradient(circle 104px at 30% 9%, rgba(216,248,255,.56) 0 38%, rgba(216,248,255,0) 74%)',
					'radial-gradient(circle 96px at 78% 76%, rgba(116,216,250,.36) 0 40%, rgba(116,216,250,0) 76%)',
					'radial-gradient(circle 92px at 5% 66%, rgba(130,215,255,.48) 0 40%, rgba(130,215,255,0) 76%)',
					'radial-gradient(circle 84px at 34% 35%, rgba(190,235,255,.38) 0 38%, rgba(190,235,255,0) 74%)',
					'radial-gradient(circle 72px at 69% 51%, rgba(170,220,255,.34) 0 38%, rgba(170,220,255,0) 74%)',
					'radial-gradient(circle 64px at 52% 89%, rgba(140,225,255,.42) 0 36%, rgba(140,225,255,0) 72%)',
				].join(','),
				base: '#04101d',
			},
			{
				id: 'aurora',
				tint: '258 42% 12%',
				swatch: 'linear-gradient(140deg, #57e6d2, #3b3f9e 52%, #150f2e)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(214,240,255,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #1b4f6e 0%, #23407a 26%, #26265c 54%, #151238 78%, #0a0a1c 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(96,214,255,.34), rgba(96,214,255,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(170,120,255,.30), rgba(170,120,255,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(110,120,255,.26), rgba(110,120,255,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(108,132,255,.36) 0 42%, rgba(108,132,255,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(120,140,255,.24) 0 40%, rgba(120,140,255,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(94,240,214,.48) 0 40%, rgba(94,240,214,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(178,150,255,.42) 0 40%, rgba(178,150,255,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(140,160,255,.28) 0 42%, rgba(140,160,255,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(120,236,255,.32) 0 42%, rgba(120,236,255,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(180,225,255,.40) 0 38%, rgba(180,225,255,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(150,240,225,.34) 0 38%, rgba(150,240,225,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(196,170,255,.36) 0 38%, rgba(196,170,255,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(150,190,255,.32) 0 38%, rgba(150,190,255,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(120,225,245,.36) 0 36%, rgba(120,225,245,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(190,215,255,.34) 0 36%, rgba(190,215,255,0) 72%)',
				].join(','),
				base: '#0a0a1c',
			},
			{
				id: 'graphite',
				tint: '220 9% 10%',
				swatch: 'linear-gradient(140deg, #616b78, #262b32 55%, #14161a)',
				ground: [
					'linear-gradient(114deg, rgba(255,255,255,0) 8%, rgba(226,238,252,.09) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 46%, rgba(0,0,0,.54) 100%)',
					'linear-gradient(160deg, #292f38 0%, #1e242c 28%, #151a21 56%, #14171c 80%, #0b0d10 100%)',
				].join(','),
				far: [
					'radial-gradient(900px 660px at 4% -8%, rgba(108,124,146,.20), rgba(108,124,146,0) 64%)',
					'radial-gradient(640px 500px at 72% 104%, rgba(90,109,135,.15), rgba(90,109,135,0) 62%)',
				].join(','),
				near: [
					'radial-gradient(circle 268px at 88% 88%, rgba(150,168,190,.18) 0 42%, rgba(150,168,190,0) 78%)',
					'radial-gradient(circle 214px at 8% 50%, rgba(170,190,214,.15) 0 40%, rgba(170,190,214,0) 76%)',
					'radial-gradient(circle 196px at 14% 18%, rgba(196,214,232,.26) 0 40%, rgba(196,214,232,0) 78%)',
					'radial-gradient(circle 158px at 86% 20%, rgba(150,168,190,.20) 0 42%, rgba(150,168,190,0) 78%)',
					'radial-gradient(circle 132px at 58% 62%, rgba(186,202,222,.16) 0 42%, rgba(186,202,222,0) 78%)',
					'radial-gradient(circle 104px at 36% 78%, rgba(206,222,240,.20) 0 38%, rgba(206,222,240,0) 74%)',
					'radial-gradient(circle 88px at 44% 10%, rgba(224,236,250,.24) 0 38%, rgba(224,236,250,0) 74%)',
					'radial-gradient(circle 74px at 70% 46%, rgba(198,214,234,.20) 0 38%, rgba(198,214,234,0) 74%)',
					'radial-gradient(circle 60px at 92% 60%, rgba(214,228,244,.20) 0 36%, rgba(214,228,244,0) 72%)',
					'radial-gradient(circle 52px at 22% 40%, rgba(226,238,252,.20) 0 36%, rgba(226,238,252,0) 72%)',
				].join(','),
				base: '#0b0d10',
			},
			{
				id: 'phoenix',
				tint: '4 76% 12%',
				swatch: 'linear-gradient(140deg, #ffe15c, #ed2534 54%, #641126)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(255,205,48,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #b81228 0%, #a20d35 26%, #8c1232 54%, #5a1230 78%, #320c22 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(255,54,48,.34), rgba(255,54,48,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(255,223,80,.30), rgba(255,223,80,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(248,62,63,.26), rgba(248,62,63,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(255,108,48,.36) 0 42%, rgba(255,108,48,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(255,229,108,.24) 0 40%, rgba(255,229,108,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(255,66,51,.48) 0 40%, rgba(255,66,51,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(255,205,48,.42) 0 40%, rgba(255,205,48,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(255,54,48,.28) 0 42%, rgba(255,54,48,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(255,223,80,.32) 0 42%, rgba(255,223,80,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(248,62,63,.40) 0 38%, rgba(248,62,63,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(255,108,48,.34) 0 38%, rgba(255,108,48,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(255,229,108,.36) 0 38%, rgba(255,229,108,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(255,66,51,.32) 0 38%, rgba(255,66,51,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(255,205,48,.36) 0 36%, rgba(255,205,48,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(255,54,48,.34) 0 36%, rgba(255,54,48,0) 72%)',
				].join(','),
				base: '#320c22',
			},
			{
				id: 'jade',
				tint: '136 64% 11%',
				swatch: 'linear-gradient(140deg, #b0ed85, #329f45 52%, #104326)',
				ground: [
					'linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(107,232,113,.13) 24%, rgba(255,255,255,0) 36%)',
					'radial-gradient(126% 108% at 50% 44%, rgba(0,0,0,0) 48%, rgba(0,0,0,.52) 100%)',
					'linear-gradient(160deg, #16471f 0%, #124b25 26%, #104128 54%, #0a2f1d 78%, #08291a 100%)',
				].join(','),
				far: [
					'radial-gradient(880px 640px at 6% -6%, rgba(54,204,87,.34), rgba(54,204,87,0) 62%)',
					'radial-gradient(760px 560px at 96% 30%, rgba(82,207,108,.30), rgba(82,207,108,0) 66%)',
					'radial-gradient(680px 520px at 44% 106%, rgba(49,184,85,.26), rgba(49,184,85,0) 64%)',
				].join(','),
				near: [
					'radial-gradient(circle 272px at 90% 86%, rgba(127,234,96,.36) 0 42%, rgba(127,234,96,0) 78%)',
					'radial-gradient(circle 232px at 6% 44%, rgba(75,213,108,.24) 0 40%, rgba(75,213,108,0) 76%)',
					'radial-gradient(circle 190px at 12% 16%, rgba(153,240,135,.48) 0 40%, rgba(153,240,135,0) 76%)',
					'radial-gradient(circle 164px at 82% 12%, rgba(107,232,113,.42) 0 40%, rgba(107,232,113,0) 76%)',
					'radial-gradient(circle 150px at 57% 66%, rgba(54,204,87,.28) 0 42%, rgba(54,204,87,0) 78%)',
					'radial-gradient(circle 132px at 34% 83%, rgba(138,236,156,.32) 0 42%, rgba(138,236,156,0) 78%)',
					'radial-gradient(circle 108px at 46% 8%, rgba(88,224,116,.40) 0 38%, rgba(88,224,116,0) 74%)',
					'radial-gradient(circle 96px at 25% 47%, rgba(127,234,96,.34) 0 38%, rgba(127,234,96,0) 74%)',
					'radial-gradient(circle 88px at 71% 41%, rgba(75,213,108,.36) 0 38%, rgba(75,213,108,0) 74%)',
					'radial-gradient(circle 76px at 93% 58%, rgba(153,240,135,.32) 0 38%, rgba(153,240,135,0) 74%)',
					'radial-gradient(circle 68px at 64% 92%, rgba(107,232,113,.36) 0 36%, rgba(107,232,113,0) 72%)',
					'radial-gradient(circle 58px at 8% 74%, rgba(54,204,87,.34) 0 36%, rgba(54,204,87,0) 72%)',
				].join(','),
				base: '#08291a',
			},
            {id: 'flame', ...chromaticScene(
                '12 76% 12%', '#541608',
                ['#c94312', '#ae3210', '#91280d', '#721f0a'],
                ['255,77,38', '255,224,75', '255,143,36'],
            )},
			{id: 'teal', ...chromaticScene(
                '174 58% 10%', '#07252a',
                ['#146779', '#176353', '#104952', '#0a323c'],
                ['48,215,193', '230,193,103', '86,181,238'],
            )},
			{id: 'rose', ...chromaticScene(
                '337 46% 12%', '#2d1024',
                ['#853758', '#6b3053', '#502642', '#381c32'],
                ['249,117,164', '255,192,174', '184,122,190'],
            )},
			{id: 'amber', ...chromaticScene(
                '28 62% 10%', '#2a1308',
                ['#8a481c', '#703819', '#582c17', '#3b2112'],
                ['255,174,56', '255,223,155', '233,116,55'],
            )},
		]

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

        // Pure color calculations. The caller supplies the skin and light recipe;
        // this scope has no preference store, DOM, theme registry or timers.
        const skinColors = (() => {
            const accentChannels = (rawHue, rawSat, shift) => {
                const hue = ((rawHue + shift) % 360 + 360) % 360
                // Neutral skins keep neutral light; a saturation floor would
                // incorrectly pull blue out of Graphite's tint.
                const sat = rawSat < 15 ? 0 : Math.min(72, rawSat * 1.6)
                const light = shift === 0 ? 0.72 : 0.80
                const c = (1 - Math.abs(2 * light - 1)) * (sat / 100)
                const hp = hue / 60
                const x = c * (1 - Math.abs((hp % 2) - 1))
                const m = light - c / 2
                const rgb = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0]
                    : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c]
                    : hp < 5 ? [x, 0, c] : [c, 0, x]
                return rgb.map(value => Math.round((value + m) * 255)).join(',')
            }

            const accent = (tint, shift) => {
                const [hue, saturation] = tint.split(/\s+/).map(part => parseFloat(part))
                return accentChannels(hue, saturation, shift)
            }

            const chromaChannels = (channels, gain) => {
                const mean = (channels[0] + channels[1] + channels[2]) / 3
                return channels.map(channel => Math.round(Math.min(255,
                    Math.max(0, mean + (channel - mean) * gain))))
            }

            const liftGroundColor = (color, skin, light) => {
                const rgb = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255)
                const high = Math.max(...rgb), low = Math.min(...rgb)
                const difference = high - low, lightness = (high + low) / 2
                let hue = 0
                if (difference) {
                    const sector = high === rgb[0] ? (rgb[1] - rgb[2]) / difference
                        : high === rgb[1] ? (rgb[2] - rgb[0]) / difference + 2
                        : (rgb[0] - rgb[1]) / difference + 4
                    hue = sector * 60
                }
                const saturation = difference ? difference / (1 - Math.abs(2 * lightness - 1)) : 0
                return `hsl(${(hue + 360) % 360} ${Math.min(90, saturation * 100 + (skin.id === 'graphite' ? 0 : light.sceneLift))}% ${Math.min(46, lightness * 100 + 3 + light.sceneLift * .6)}%)`
            }

            const resolve = (skin, light) => {
                const n = value => String(Math.round(value * 1000) / 1000)
                const tintParts = String(skin.tint).trim().split(/\s+/)
                const tintLight = parseFloat(tintParts[2]) || 12
                const rawHue = parseFloat(tintParts[0]), rawSat = parseFloat(tintParts[1])
                const radiant = light.id === 'radiant', neutral = skin.id === 'graphite'
                const chroma = Math.min(radiant ? 82 : 64,
                    rawSat * (neutral ? 1 : radiant ? 1.32 : .78) + (neutral ? 0 : light.sceneLift * .3))
                const sceneTint = `${tintParts[0]} ${chroma}% ${tintLight + light.sceneLift}%`
                const liftedTint = `${tintParts[0]} ${chroma}% ${Math.min(tintLight + 9 + light.surfaceLift, 36)}%`
                const materialTint = `${tintParts[0]} ${chroma}% ${Math.min(tintLight + light.sceneLift + 14 + light.surfaceLift * .5, radiant ? 49 : 46)}%`

                const ground = skin.ground.replace(/#[\da-f]{6}/gi, color => liftGroundColor(color, skin, light))
                    .replace(/rgba\(0,0,0,\.(\d+)\)/g, (_, digits) => `rgba(0,0,0,${n(Number('.' + digits) * .60)})`)
                const far = skin.far.replace(/rgba\((\d+,\d+,\d+),([.\d]+)\)/g,
                    (_match, rgb, alpha) => `rgba(${rgb},${n(Math.min(Number(alpha) * light.gain, 1))})`)
                const primary = accentChannels(rawHue, rawSat, 0)
                return {
                    hue: tintParts[0], sceneTint, liftedTint, materialTint, ground, far,
                    accent: primary, secondaryAccent: accentChannels(rawHue, rawSat, 26),
                    fillAccent: chromaChannels(primary.split(',').map(Number), 1.45).join(','),
                }
            }

            // Expand differences BETWEEN the theme's color anchors rather than
            // globally saturating the UI. Neutral themes retain neutral channels.
            const scenePalette = (colors, separation = 'standard') => {
                                const rgb = colors.map(color => color.split(',').map(Number))
                const mean = [0, 1, 2].map(axis => rgb.reduce((sum, c) => sum + c[axis], 0) / rgb.length)
                const spread = separation === 'bold' ? 1.8 : separation === 'soft' ? .55 : 1.25
                return rgb.map((c, index) => c.map((channel, axis) => Math.round(Math.max(0, Math.min(255,
                    mean[axis] + (channel - mean[axis]) * spread + ([12, -12, 0][index % 3] * (separation === 'bold' ? 1 : separation === 'soft' ? 0 : .5))
                )))).join(','))
            }
            const sceneGradient = (css, separation) => {
                separation ??= 'standard'
                const colors = [...new Set([...css.matchAll(/rgba\((\d+,\d+,\d+),([.\d]+)\)/g)]
                    .filter(m => Number(m[2]) > 0).map(m => m[1]))]
                if (!colors.length) return css
                const palette = scenePalette(colors, separation)
                return css.replace(/rgba\((\d+,\d+,\d+),([.\d]+)\)/g, (match, rgb, alpha) => {
                    const index = colors.indexOf(rgb)
                    return index < 0 ? match : `rgba(${palette[index]},${alpha})`
                })
            }
            const rimShadow = (shadow, preset) => {
                if (preset.id === 'thin') return shadow
                return shadow.replace(/inset [^,]*?(?:rgba\(255,\s*255,\s*255,\s*([.\d]+)\)|var\(--sk-rim(?:-soft)?\))/g, segment => {
                    // Scale contour width/exposure only. Outer cast shadows and
                    // optical displacement geometry are unchanged.
                    return segment.replace(/(-?[.\d]+)px/g, (_, value) => `${Number(value) * preset.width}px`)
                        .replace(/rgba\(255,\s*255,\s*255,\s*([.\d]+)\)/g,
                            (_, alpha) => `rgba(255,255,255,${Math.min(.65, Number(alpha) * preset.gain)})`)
                })
            }
            return {rimShadow, accent, chromaChannels, resolve, scenePalette, sceneGradient}
        })()
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

        /** Identity of values that actually change generated CSS. Thickness and
         * switch-only preferences are handled by their own runtime controllers.
         * Playback-rate capable browsers keep speed changes out of CSS too. */
        function skinCssRecipe (choice) {
            return [choice.skin, choice.intensity, choice.glass, choice.vivid,
                choice.rim, choice.effect, choice.colorSeparation,
                ambientCssRate(choice.flowSpeed)].join('/')
        }
		/**
		 * Build the complete skin stylesheet for one choice.
		 * @param choice - selected skin and transparency preset.
		 * @returns CSS text, or an empty string when the skin is off.
		 */
		function buildSkinCss (choice) {
			if (!isOn(choice)) return ''
			const skin = skinById(choice.skin)
			const it = intensityById(choice.intensity)
            const material = MATERIAL_PRESETS[it.id]
            const [controlBlur, readingBlur, settingsBlur, settingsMinBlur, cardAlpha] = material[choice.glass === 'on' ? 'liquid' : 'frosted']
            // A reading dialog needs separation from text underneath. Preserve
            // the pure experiment and native frosted recipe; tint, not extra blur.
            const settingsAlpha = choice.glass === 'on' && it.id !== 'pure' ? 1 - (1 - material.settings) * .42 : material.settings
            const pure = it.id === 'pure'
			const light = VIVIDS.find((v) => v.id === choice.vivid) ?? VIVIDS[1]
			const a = (v) => String(v)
			/* Alphas are resolved here rather than with calc(): a `calc()` in the
			 * alpha slot of a space-separated `hsl()` is not reliably parsed, and a
			 * dropped declaration would silently fall back to the stock token. */
			const n = (v) => String(Math.round(v * 1000) / 1000)
			const aLayer2 = n(pure ? 0 : Math.min(it.card + .07, 1))
			const aLayer3 = n(pure ? 0 : Math.min(it.card + .13, 1))
			/* aModule is the surface behind the settings and plugin rows, and it had the
			 * same inversion float had: card MINUS 0.06, so the panel behind the text
			 * was thinner than the cards sitting on it. Measured through the live DOM
			 * that is hsl(tint / 0.80), and 20% of the bright wallpaper coming through
			 * is what turned the plugin list into a separate grey-white block — the
			 * thing the user pointed at. A surface that carries text has to be the more
			 * solid of the two, so the offset is positive now. */
			const aModule = n(pure ? 0 : Math.min(it.card + .04, .98))
			const aComposer = n(pure ? 0 : it.card + 0.06)
			const aBubble = n(pure ? 0 : it.card + 0.05)
			/* The raised-surface tint, described where it is emitted. Skin tints are
			 * written as "H S% L%", so the lightness can be lifted without touching hue
			 * or saturation. */
			const {hue, sceneTint, liftedTint, materialTint, ground, far: originalFar, accent, secondaryAccent, fillAccent} = skinColors.resolve(skin, light)
			const far = skinColors.sceneGradient(originalFar, choice.colorSeparation)
            const rim = glassRim(choice.rim)
            const working = buildWorkingCss(choice.effect)

			return `
/* ${skin.id} / ${it.id} */
body {
	color-scheme: dark;
	--sk-tint: ${sceneTint};
	/* Historical rationale: see docs/CSS-HISTORY.md, note 1. */
	--sk-tint-lift: ${liftedTint};
	--sk-ink: hsl(${hue} ${choice.glass === 'on' ? 6 : 12}% 98%);
	--sk-ink-secondary: hsl(${hue} ${choice.glass === 'on' ? 8 : 14}% 90%);
	--sk-ink-muted: hsl(${hue} ${choice.glass === 'on' ? 8 : 12}% 82%);
	--dsw-alias-label-primary: var(--sk-ink) !important;
	--dsw-alias-label-secondary: var(--sk-ink-secondary) !important;
	--dsw-alias-label-tertiary: var(--sk-ink-muted) !important;
	--dsw-alias-label-quaternary: var(--sk-ink-muted) !important;
	--dsw-alias-label-caption: var(--sk-ink-muted) !important;
	--dsw-alias-label-dimmed: var(--sk-ink-muted) !important;
	/* Protect glyphs over bright moving light without tinting the glass. */
	--sk-text-guard: 0 .5px 1px rgba(0,0,0,${pure || it.id === 'bare' ? .22 : it.id === 'crystal' ? .18 : .12});
	--sk-link-ink: color-mix(in srgb, rgb(var(--sk-glow)) 35%, var(--sk-ink) 65%);
	/* The host otherwise switches syntax ink back to its light-page palette. */
	--shiki-foreground: var(--sk-ink) !important;
	--shiki-token-constant: #4dabf7 !important;
	--shiki-token-string: #69db7c !important;
	--shiki-token-comment: var(--sk-ink-muted) !important;
	--shiki-token-keyword: #faa2c1 !important;
	--shiki-token-parameter: #ffa94d !important;
	--shiki-token-function: #b197fc !important;
	--shiki-token-string-expression: #8ce99a !important;
	--shiki-token-punctuation: var(--sk-ink-secondary) !important;
	--shiki-token-link: var(--sk-link-ink) !important;
	color: var(--sk-ink) !important;
	text-shadow: var(--sk-text-guard);
	--sk-settings-bg: hsl(${choice.glass === 'on' ? sceneTint : materialTint} / ${n(settingsAlpha)});
	--sk-settings-row: hsl(${materialTint} / ${material.row});
	--sk-scatter: ${material.scatter};
	--sk-readability-floor: ${pure ? 0 : 1};
	--sk-control-blur: ${controlBlur}px;
	--sk-reading-blur: ${readingBlur}px;
	--sk-reading-sat: min(var(--sk-sat),112%);
	--sk-settings-blur: ${settingsBlur}px;
	--sk-settings-min-blur: ${settingsMinBlur}px;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 2. */
	--sk-glow: ${accent};
	--sk-glow-2: ${secondaryAccent};
	/* The fill accent is a SEPARATE value from the halo's, and that separation is the
	 * point. A glow is light added around an edge; a fill IS the surface, and the
	 * surface has to carry the theme's colour at a chroma the glow never needed.
	 * Sharing one value between the two is why pouring more of it into the composer
	 * only made the composer paler. */
	--sk-glow-fill: ${fillAccent};
	/* The same light profile drives the emitted washes and discrete circles. */
	--sk-glow-gain: ${light.gain};
	--sk-control-tint: ${pure ? 0 : .13};
	--sk-chip-tint: ${pure ? 0 : .14};
	--sk-state-hover: rgba(var(--sk-glow), 0.10);
	--sk-state-press: rgba(var(--sk-glow), 0.16);
	--sk-motion-hover: 140ms;
	--sk-motion-press: 70ms;
	--sk-ease-settle: cubic-bezier(0.16, 1, 0.3, 1);
	--sk-ease-release: cubic-bezier(0.22, 1, 0.36, 1);
	/* The shell's own accent is a fixed blue, so every selected tab, indicator and
	 * highlighted control stayed blue on every skin — including the one whose whole
	 * identity is being grey. The accent is a token, so it can simply be repointed
	 * at the skin's derived colour.
	 *
	 * Three more tokens carry the same blue and each one showed up as a separate
	 * complaint: file links in the transcript, and the status line while a run is in
	 * progress ("深度求索中..."). They are separate names, so overriding the accent
	 * alone left both of them blue. */
	--dsw-alias-state-business-primary: rgb(var(--sk-glow)) !important;
	--dsw-alias-state-info-primary: rgb(var(--sk-glow)) !important;
	--dsw-alias-label-link: var(--sk-link-ink) !important;
	--dsw-alias-menu-icon: var(--sk-ink-secondary) !important;
	--dsw-alias-text-link: var(--sk-link-ink) !important;
	--dsw-alias-link: var(--sk-link-ink) !important;
	--sk-a-bar: ${a(it.bar)};
	--sk-a-side: ${a(it.side)};
	--sk-a-center: ${a(it.center)};
	--sk-a-card: ${a(it.card)};
	--sk-a-float: ${a(it.float)};
	--sk-a-frame: ${a(it.frame)};
	--sk-sat: ${a(it.sat)}%;
	--sk-bright: ${a(it.bright)};
	--sk-glass: blur(${a(it.blur)}px) saturate(var(--sk-sat));
	--sk-glass-read: blur(${a(it.blur)}px) saturate(var(--sk-sat)) brightness(var(--sk-bright));
	--sk-rim: rgba(255, 255, 255, ${n(.28 * rim.gain)});
	--sk-rim-soft: rgba(255, 255, 255, ${n(.10 * rim.gain)});
	--sk-rim-hair: rgba(255, 255, 255, ${n(.16 * rim.gain)});
	/* Historical rationale: see docs/CSS-HISTORY.md, note 3. */
	--sk-sheen: ${pure ? 'none' : 'linear-gradient(180deg, hsl(var(--sk-tint-lift) / 0.30), hsl(var(--sk-tint-lift) / 0.05) 36%, hsl(var(--sk-tint-lift) / 0) 64%, hsl(var(--sk-tint-lift) / 0.09))'};
	/* Historical rationale: see docs/CSS-HISTORY.md, note 4. */
	--sk-sheen-tint: ${pure ? 'none' : 'linear-gradient(180deg, rgba(var(--sk-glow-fill), 0.15), rgba(var(--sk-glow-fill), 0.03) 36%, rgba(var(--sk-glow-fill), 0) 64%, rgba(var(--sk-glow-fill), 0.05))'};

	/* Shared liquid material: a thin tint, directional specular edge and
	 * a geometry-specific backdrop lens. Larger input surfaces scatter more
	 * light; reading content keeps its dense fill. Foreground text is never
	 * passed through the displacement map. */
	--sk-material-tint: ${materialTint};
	--sk-mat-bg: hsl(var(--sk-material-tint) / ${n(light.materialAlpha * (choice.glass === 'on' ? 1.08 : 1) * material.tint)});
	--sk-card-bg: hsl(var(--sk-tint-lift) / ${cardAlpha});
	--sk-code-banner: hsl(var(--sk-tint-lift) / .45);
	--sk-quiet-control: hsl(var(--sk-material-tint) / ${pure ? 0 : .20});
	--sk-inline-code: hsl(var(--sk-material-tint) / ${pure ? 0 : .26});
	--sk-work-label: var(--sk-ink-secondary);
	--dsw-alias-label-deep-diving: var(--sk-work-label) !important;
	--dsw-alias-label-deep-diving-shimmer: color-mix(in srgb, rgb(var(--sk-glow)) 30%, white 70%) !important;
	--dsw-alias-label-shimmer: color-mix(in srgb, rgb(var(--sk-glow)) 30%, white 70%) !important;
	--sk-mat-blur: var(--sk-liquid-filter, blur(var(--sk-control-blur))) saturate(var(--sk-sat));
	--sk-liquid-sheen: ${choice.glass === 'on' && !pure ? 'linear-gradient(160deg,rgba(255,255,255,.04),transparent 35%,transparent 66%,rgba(255,255,255,.015))' : 'none'};
	--sk-edge-width: ${n(.5 * rim.width)}px;
    --sk-edge-top: ${n(rim.width)}px;
    --sk-edge-strong: ${n(.28 * rim.gain)};
    --sk-edge-soft: ${n(.16 * rim.gain)};
    --sk-mat-rim: ${skinColors.rimShadow(choice.glass === 'on' ? 'inset 0 .75px .5px rgba(255,255,255,.18), inset .75px 0 .5px rgba(255,255,255,.10), inset -.75px 0 .5px rgba(255,255,255,.055), inset 0 -.75px .5px rgba(255,255,255,.08), inset 0 0 0 .5px rgba(255,255,255,.04), 0 3px 6px rgba(0,0,0,.04), 0 14px 28px -4px rgba(0,0,0,.13)' : 'inset 0 1px 0 var(--sk-rim), inset 0 0 0 .5px var(--sk-rim-soft)', rim)};
	--sk-session-cast-shadow: 0 5px 14px rgba(0,0,0,.18);
	--sk-reading-rim: ${skinColors.rimShadow('inset 0 .5px .5px rgba(255,255,255,.08), inset 0 0 0 .5px rgba(255,255,255,.035), 0 3px 6px rgba(0,0,0,.04), 0 14px 28px -4px rgba(0,0,0,.13)', rim)};

	background-color: ${skin.base} !important;
	background-image: ${ground} !important;
	background-attachment: fixed !important;
	background-repeat: no-repeat !important;
	background-size: cover !important;
	/* Without this the drift layers are invisible. In the root stacking context a
	 * negative-z child paints before in-flow descendants' backgrounds, and body's
	 * own background is one of those — so the pseudo-elements ended up behind the
	 * wallpaper they are supposed to float on. Making body a stacking context puts
	 * things back in the intuitive order: body's background, then the negative-z
	 * layers, then the app. */
	isolation: isolate;
}

${buildAmbientCss(skin, far, choice)}

/* Accessibility escape hatches.
 *
 * The system switches exist so that nobody has to fight a skin. Reduced
 * transparency and increased contrast both drop every blur and push the surfaces
 * to opaque: legibility beats the effect, and the user asked for it at the OS
 * level, not in here. Motion is handled just above — and the individual lights
 * are named explicitly there, because their animation is set inline by the client
 * half and a rule that only covered the layers would leave a dozen of them moving
 * for exactly the people who asked for stillness. */
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
	body[data-sk-active] {
		--sk-a-bar: 0.98;
		--sk-a-side: 0.99;
		--sk-a-center: 0.99;
		--sk-a-card: 0.99;
		--sk-a-float: 1;
		--sk-a-frame: 0.99;
	}
	body[data-sk-active] *,
	body[data-sk-active]::before,
	body[data-sk-active]::after {
		-webkit-backdrop-filter: none !important;
		backdrop-filter: none !important;
	}
}

/* The opaque shell surfaces, turned into tinted glass.
 *
 * One caveat found the hard way: bg-base is not only the shell's own surface, it
 * is also what the transcript sits on AND what the file-change card paints itself
 * with. Turning it into a near-opaque surface fixed the card but flattened the
 * whole conversation, so it stays on the preset alpha and the content cards get
 * their own rule further down instead. markdown-code-block is a bounded box that
 * only ever holds code, so it can be honest here. */
body[data-sk-active] {
	/* bg-base is the page itself and keeps the base tint; everything from layer-1 up
	 * is a RAISED surface and takes the lifted one. That split is the whole fix for
	 * the "too black" boxes: the panels were never too opaque, they were painted in
	 * the page's own near-black violet. */
	--dsw-alias-bg-base: hsl(var(--sk-tint) / var(--sk-a-center)) !important;
	--dsw-alias-bg-layer-1: hsl(var(--sk-tint-lift) / var(--sk-a-card)) !important;
	--dsw-alias-bg-layer-2: hsl(var(--sk-tint-lift) / ${aLayer2}) !important;
	--dsw-alias-bg-layer-3: hsl(var(--sk-tint-lift) / ${aLayer3}) !important;
	--dsw-alias-bg-module-platform: hsl(var(--sk-tint-lift) / ${aModule}) !important;
	--dsw-alias-bg-overlay: hsl(var(--sk-tint-lift) / var(--sk-a-float)) !important;
	--dsw-alias-bg-multi-select: hsl(var(--sk-tint-lift) / var(--sk-a-float)) !important;
	--dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.08) !important;

	--dsw-specific-input-major: hsl(var(--sk-tint-lift) / var(--sk-a-card)) !important;
	--dsw-specific-sidebar-fill: hsl(var(--sk-tint) / var(--sk-a-side)) !important;
	--dsw-specific-selector: hsl(var(--sk-tint-lift) / 0.9) !important;
	--dsw-specific-menu: hsl(var(--sk-tint-lift) / var(--sk-a-float)) !important;
	--dsw-menu-surface-fill: hsl(var(--sk-tint-lift) / var(--sk-a-float)) !important;
	/* The tip/notice surface was the last thing in this skin still built out of raw
	 * white, and it showed. Measured on screen it renders as a light band under the
	 * text — RGB(48,46,79) against RGB(31,28,64) around it, which is a uniform +17
	 * on all three channels and nothing else: exactly a white 8% overlay. Every
	 * other surface here is built from the skin's own tint; this one was a hole in
	 * that rule, and white is the thing this project has had to remove four times.
	 *
	 * It now takes the same tint as the surfaces around it, one step thinner than a
	 * card so a notice still reads as a notice rather than as another card. */
	--dsw-specific-tip: hsl(var(--sk-tint-lift) / ${aModule}) !important;
	--dsw-specific-bubble: hsl(var(--sk-tint) / ${aBubble}) !important;

	/* The new-session pill and the changed-files card both ride this token. */
	--dsw-alias-button-elevated-fill: rgba(255, 255, 255, 0.13) !important;
	--dsw-alias-button-floating-fill: rgba(255, 255, 255, 0.12) !important;
	--dsw-alias-button-contrast-fill: rgba(255, 255, 255, 0.20) !important;

	--dsw-specific-sidebar-nav-item-hover: var(--sk-state-hover) !important;
	--dsw-specific-sidebar-nav-item-active: var(--sk-state-press) !important;
	--dsw-specific-sidebar-nav-item-active-accent: rgba(var(--sk-glow), 0.42) !important;

	--dsw-alias-tooltip-bg: hsl(var(--sk-tint) / 0.96) !important;
	--dsw-alias-toast-bg: hsl(var(--sk-tint) / 0.76) !important;
	--dsw-alias-border-l1: rgba(255, 255, 255, 0.10) !important;
	--dsw-alias-border-l2: rgba(255, 255, 255, 0.14) !important;
	--dsw-alias-border-l3: rgba(255, 255, 255, 0.18) !important;
	--dsw-alias-border-l4: rgba(255, 255, 255, 0.26) !important;
	--dsw-alias-interactive-bg-hover: var(--sk-state-hover) !important;
	--dsw-alias-interactive-bg-hover-solid: color-mix(in srgb, hsl(var(--sk-tint-lift)) 90%, rgb(var(--sk-glow)) 10%) !important;
	--dsw-alias-interactive-bg-active: var(--sk-state-press) !important;

	--dsw-alias-markdown-code-block: hsl(var(--sk-tint) / 0.44) !important;
	--dsw-alias-markdown-code-block-banner: hsl(var(--sk-tint) / 0.56) !important;
	/* Inline code, citations and tags were the last three white washes. They are small,
	 * which is why they survived this long, but they are the same defect: a neutral
	 * grey chip behind text that belongs to no surface. The inline-code one was clearly
	 * visible in a transcript line right after the hover fix, which is what prompted
	 * taking them too. */
	--dsw-alias-markdown-inline-code: hsl(var(--sk-tint-lift) / 0.9) !important;
	--dsw-alias-markdown-citation: hsl(var(--sk-tint-lift) / 0.82) !important;
	--dsw-alias-markdown-tag: hsl(var(--sk-tint-lift) / 0.86) !important;
}

/* --- frame sheets -------------------------------------------------
 * No backdrop-filter on the two big columns: an element with one becomes a
 * backdrop root, and a nested filter inside it would then only ever sample the
 * column's own flat tint — which is why the composer carries no blur of its
 * transcript scrolling under it. Blurring a smooth wallpaper buys nothing, so
 * the columns keep the tint and the rim, and the filters live only where
 * something with detail actually passes behind: the composer and floating
 * sheets. */
[data-windows-titlebar] .BynINW_frame:before {
	background: var(--sk-sheen), hsl(var(--sk-tint) / var(--sk-a-bar)) !important;
	box-shadow: inset 0 1px 0 var(--sk-rim), inset 0 -1px 0 var(--sk-rim-soft) !important;
}
.BynINW_sidebarCol,
[class*='_sidebarCol'] {
	background: var(--sk-sheen), hsl(var(--sk-tint) / var(--sk-a-side)) !important;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 6. */
	box-shadow: inset 0 1px 0 var(--sk-rim) !important;
	/* Square on purpose now, not by omission. The whole story is written out on
	 * .BynINW_frame below; the short version is that a 10px radius here is a SECOND
	 * corner drawn inside the window's own corner, and the gap between the two arcs
	 * is the raw wallpaper. */
	border-bottom-left-radius: 0;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 7. */
}
.BynINW_centerCol,
[class*='_centerCol'] {
	background: hsl(var(--sk-tint) / var(--sk-a-center)) !important;
	box-shadow: inset 0 0 0 0.5px var(--sk-rim-hair), inset 0 1px 0 var(--sk-rim) !important;
	/* !important because the shell sets a radius on this element itself (it is the
	 * one that rounds the reading pane), so a plain declaration here loses. The
	 * bottom corner is squared rather than rounded: same measurement as
	 * .BynINW_frame below, and this is the element whose arc the user was seeing. */
	border-bottom-right-radius: 0 !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 8. */
/* Frosted, not darker.
 *
 * Legibility on these surfaces comes from BLUR, not from opacity. A heavily blurred
 * backdrop is a uniform wash, so text reads against it at almost any alpha; an
 * opaque dark fill does the same job by dimming the picture, which is the wrong
 * currency. Every earlier revision of this rule raised the alpha, which is why the
 * interface kept getting darker each time the text was made easier to read.
 *
 * So the fill comes down and the backdrop filter goes up. The rule applies to the
 * surfaces whose job is holding text: change cards, code blocks, deliverables. */
${CONTENT_CARDS},
[class*='_ioCard'],
[class*='_deliverable'] {
	background: hsl(var(--sk-tint) / 0.42) !important;
	-webkit-backdrop-filter: blur(var(--sk-reading-blur)) saturate(var(--sk-reading-sat)) !important;
	backdrop-filter: blur(var(--sk-reading-blur)) saturate(var(--sk-reading-sat)) !important;
}
/* Historical rationale: see docs/CSS-HISTORY.md, note 9. */
::-webkit-scrollbar {
	/* Keep the host gutter width: changing it shifts the centred composer. */
	width: var(--dsh-scrollbar-width, 5px);
	height: var(--dsh-scrollbar-width, 5px);
}
::-webkit-scrollbar-track,
::-webkit-scrollbar-track-piece,
::-webkit-scrollbar-corner {
	background: transparent !important;
	box-shadow: none !important;
	border: 0 !important;
}
/* The native sticky composer fades the transcript only up to the scrollbar
 * gutter, exposing a brighter rail beside its lower half. The glass card and
 * tray already carry their own material, so this extra veil is unnecessary. */
body[data-sk-active] [class*='_composerSeat'] {
	background: transparent !important;
}
::-webkit-scrollbar-thumb {
	/* Historical rationale: see docs/CSS-HISTORY.md, note 10. */
	background: rgba(255, 255, 255, 0.08) !important;
	border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
	background: var(--sk-rim) !important;
}

/* The window sheet fills the seam and the rounded notch; it must stay
 * filter-free, or it would become a backdrop root and its children would blur
 * this flat tint instead of the wallpaper. */
.BynINW_frame {
	background: hsl(var(--sk-tint) / var(--sk-a-frame)) !important;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 11. */
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 12. */
	transition: grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out);
}
/* The host clamps the push panel to available space, but its grid target still
 * contains the requested width. Interpolating that larger target makes the grid
 * overrun the panel. Mirror only the host's resolved width; its original inline
 * grid and resizing logic remain untouched. Closed and open tracks have identical
 * minmax structure, and use the same clock as the panel's native slide. */
.BynINW_frame[data-sk-push] {
	grid-template-columns: var(--dsh-windows-sidebar-width, 0px) minmax(0px, 1fr) minmax(0px, var(--sk-right-width, 0px)) !important;
}
.BynINW_frame[data-rightbar-collapsed][data-sk-push] {
	grid-template-columns: var(--dsh-windows-sidebar-width, 0px) minmax(0px, 1fr) minmax(0px, 0px) !important;
}
.BynINW_frame:is([data-dragging], [data-rightbar-instant], [data-rightbar-fullscreen]) {
	transition: none !important;
}
/* Remove the short extra tint that ends abruptly above the account control. */
[class*='_sidebarCol'] [class*='_regionArea'] [class$='_fade'] {
	background: transparent !important;
}
[class*='_sidebarCol'] > [data-slot='sidebar'] > [class*='_root'] {
	background: transparent !important;
}
/* Slide the full-width content into its grid track. This keeps each
 * glass control inside the sampling boundary rather than clipping its lens. */
.BynINW_sidebarCol { z-index: 2; }
.BynINW_sidebarCol > [data-slot='sidebar'] > [class*='_root'] {
 position: relative;
 left: calc(100% - var(--sk-sidebar-native-width, 280px));
}
[data-sk-live-static] { position: relative; }
[data-sk-liquid] > svg[data-sk-liquid-viewport] {
 position: absolute !important;
 inset: 0;
 width: 100%;
 height: 100%;
 max-width: none;
 margin: 0;
 pointer-events: none;
 overflow: visible;
}
/* Keep the session's soft cast shadow. Enlarge the scroll/region paint gutter
 * without moving the rows, rather than cutting the shadow four pixels away. */
[class*='_sidebarCol'] [class*='_regionArea'] {
	margin-left: calc(-1 * var(--dsh-sidebar-inline-padding, 12px));
	padding-left: var(--dsh-sidebar-inline-padding, 12px);
}
[class*='_sidebarCol'] [class*='_treeBody'] > :is([class$='_list'], [class*='_list ']) {
	margin-left: calc(-1 * var(--dsh-sidebar-inline-padding, 12px));
	padding-left: var(--dsh-sidebar-inline-padding, 12px);
}

/* --- the sidebar's selected panel row ---------------------------------
 * The host marks the open panel with a _panelActive class (plus aria-current='page')
 * and gives it a flat background from --dsw-alias-interactive-bg-hover — the SAME
 * flat fill it gives the pointer hover state. So the row a user is actually standing on looked
 * exactly like the row the pointer happened to be over, and neither of them was
 * glass: that is the flat colour block in the sidebar.
 *
 * Selection is a resting state, not a passing one, so it does not answer
 * :hover. It gets a real material layer on ::before, built from the same
 * tokens as the selected document tab next to it — one shared surface token
 * (--sk-mat-bg), one shared rim (--sk-mat-rim), one shared filter
 * (--sk-mat-blur), so both materials and all six intensities arrive for free
 * and liquid glass keeps its per-size SVG lens instead of a CSS blur.
 *
 * Two things are deliberately NOT done here. The native fill is cleared rather
 * than stacked under the material, because painting host wash plus glass is the
 * double background this plugin keeps having to remove; and the row is not given
 * a transform, because inside a backdrop root that promotes a compositing layer.
 * The pointer's hover/press answers below MIX the wash INTO the same surface
 * instead of replacing it, so a hovered selected row does not flicker from glass
 * to flat and back.
 *
 * WHY THESE SELECTORS CARRY body[data-sk-active] AND THE POINTER GUARD.
 *
 * No specificity padding is used anywhere below, and that is deliberate. The
 * competing writer is this plugin's own generic wash rule, whose selector is about
 * twenty class-level points wide, so buying a win with repeated attributes would be
 * an arms race that a host rename restarts. Panel navigation is instead taken OUT of
 * that family by NOT_PANEL_CONTROLS (declared with the other selectors above, wrapped
 * in :where() so it costs no specificity), which leaves this block free to be short
 * and readable. */
body[data-sk-active] :where(${PANEL_ACTIVE}) {
	position: relative;
	z-index: 0;
	background-color: transparent !important;
	background-image: none !important;
	box-shadow: none !important;
}
body[data-sk-active] :where(${PANEL_ACTIVE})::before {
	content: '';
	position: absolute;
	inset: 0;
	z-index: -1;
	border-radius: inherit;
	pointer-events: none;
	background: var(--sk-mat-bg);
	box-shadow: var(--sk-mat-rim);
	-webkit-backdrop-filter: var(--sk-mat-blur);
	backdrop-filter: var(--sk-mat-blur);
	transition: background-color var(--sk-motion-hover) var(--sk-ease-settle);
}
/* The pointer answer is a wash on the material, not a second surface. */
body[data-sk-pointer][data-sk-active] :where(${PANEL_ACTIVE}):hover::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 90%, rgb(var(--sk-glow)) 10%);
}
body[data-sk-pointer][data-sk-active] :where(${PANEL_ACTIVE}):active::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 84%, rgb(var(--sk-glow)) 16%);
	transition-duration: var(--sk-motion-press);
}
/* Native navigation labels remain clear in every pointer state. A hover wash
 * would persist during its background transition underneath travelling glass. */
body[data-sk-active] ${PANEL_CONTROLS} {
	background:transparent!important;
	box-shadow:none!important;
}

/* A trace is a reading canvas, not a pile of opaque elevated cards.
 * Keep the virtual ledger filter-free; only its small fixed controls carry a
 * tint. Semantic anchors survive generated class-prefix changes. */
[data-conversation-composer-overlay]:has([data-timeline-domain]),
[data-conversation-composer-overlay]:has([data-timeline-domain]) :is([class$='_split'],[class$='_table']) {
 background: transparent !important;
 backdrop-filter: none !important;
}
[data-conversation-composer-overlay]:has([data-timeline-domain]) :is([role='toolbar'],[class$='_plot'],[class$='_search']) {
 background: var(--sk-mat-bg) !important;
 border-color: var(--sk-rim-soft) !important;
}
[data-conversation-composer-overlay]:has([data-timeline-domain]) :is([class$='_searchInput'],[class$='_contentText'],[class$='_resultRequest']) {
 color: var(--sk-ink) !important;
}
[data-conversation-composer-overlay]:has([data-timeline-domain]) :is([class$='_inlineResult'],[class$='_inlineResultText']) {
 color: var(--sk-ink-secondary) !important;
}
[data-conversation-composer-overlay]:has([data-timeline-domain]) [class$='_searchInput']::placeholder {
 color: var(--sk-ink-muted) !important;
 opacity: 1;
}
[data-conversation-composer-overlay]:has([data-timeline-domain]) [class$='_detailPane'] {
 background: var(--sk-card-bg) !important;
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
 [data-conversation-composer-overlay]:has([data-timeline-domain]) { background: hsl(var(--sk-tint)) !important; }
}

/* --- composer -----------------------------------------------------
 * The transcript scrolls underneath this sheet, so its blur does the real work
 * of a floating bar; the tint only tops it up enough to keep the placeholder
 * and the controls legible. */
/* Historical rationale: see docs/CSS-HISTORY.md, note 13. */
[data-composer-card] {
	/* Historical rationale: see docs/CSS-HISTORY.md, note 14. */
	background: var(--sk-mat-bg) !important;
	box-shadow: var(--sk-mat-rim), 0 10px 28px rgba(0, 0, 0, 0.20) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 15. */
body[data-sk-glass] [data-composer-card] {
	position: relative !important;
	/* z-index 0 makes the card a STACKING CONTEXT, which is what lets the
	 * pseudo-element below sit at -1 without escaping behind the page.
	 *
	 * It has to be a stacking context, and it has to be this one: position plus
	 * z-index creates one, while isolation: isolate would also work but is a
	 * backdrop-root trigger — and a backdrop root here would make the blur sample
	 * nothing but the card itself, which is the trap this file warns about twice. */
	z-index: 0 !important;
	background: none !important;
	box-shadow: none !important;
}
/* Historical rationale: see docs/CSS-HISTORY.md, note 16. */
body[data-sk-glass] [data-composer-card]::before {
	content: '';
	position: absolute;
	inset: 0;
	z-index: -1;
	border-radius: inherit;
	pointer-events: none;
	background: var(--sk-mat-bg);
	box-shadow: var(--sk-mat-rim), 0 10px 28px rgba(0, 0, 0, 0.20);
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 17. */
[data-composer-stats] {
	font-variant-numeric: tabular-nums;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 18. */
[class*='_backdrop_'] > [class*='_close_'] {
	top: 64px !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 19. */
[data-composer-card] button[class$='_primary'],
[data-composer-card] button[class*='_primary '] {
	position: relative !important;
	overflow: hidden !important;
	/* Historical rationale: see docs/CSS-HISTORY.md, note 20. */
	/* Historical rationale: see docs/CSS-HISTORY.md, note 21. */
	/* Historical rationale: see docs/CSS-HISTORY.md, note 22. */
	background: rgba(var(--sk-glow), var(--sk-control-tint)) !important;
	/* The shadow list is not free-form: it is the same set of layers the working
	 * animation's frame() emits, so that the retract can land on the resting state
	 * without a pop. Change one and the seam test fails — correctly. The crystal
	 * character therefore lives in the background gradients above, which the
	 * animation does not touch, and the shadow keeps its layer set.
	 *
	 * (Do not put a backtick in any comment in this file. The stylesheet is one
	 * template literal, so a single one ends it early. That happened here.) */
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.52),
		inset 0 -1px 0 rgba(255, 255, 255, 0.12),
		inset 0 0 0 1px rgba(255, 255, 255, 0.30),
		inset 0 0 13px rgba(var(--sk-glow), 0.07),
		inset 0 0 0 rgba(var(--sk-glow-2), 0),
		inset 0 0 0 rgba(var(--sk-glow), 0),
		0 0 0 0 rgba(255, 255, 255, 0),
		0 0 14px rgba(var(--sk-glow), 0.16),
		0 6px 16px rgba(0, 0, 0, 0.42),
		0 1px 3px rgba(0, 0, 0, 0.30);
	color: #fff !important;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.42) !important;
	/* background-color only. This list used to carry box-shadow and transform, and
	 * that was the last flicker source on this control: animating a ten-layer shadow
	 * — including a 16px and a 22px blur — interpolates it frame by frame, which is a
	 * large repaint every frame inside a backdrop root. background-color is a plain
	 * paint and has never flickered. */
	transition: background-color 0.15s ease !important;
}
/* The specular: the image of the light source on the glass, and the only one.
 *
 * A soft white cloud is what a matte surface does with light; glass shows a small,
 * hard-edged reflection of the source itself. So this is a short narrow oval with a
 * crisp edge and no blur, which reads as a reflection rather than a smudge. The
 * broad gradient that used to sit behind it in the background is gone: two
 * highlights on one surface is what made the button look painted, and it is the
 * same fault as two light sources anywhere else. */
/* Historical rationale: see docs/CSS-HISTORY.md, note 23. */
[data-composer-card] button[class$='_primary']::before,
[data-composer-card] button[class*='_primary ']::before {
	content: '';
	position: absolute;
	inset: -20% -40%;
	pointer-events: none;
	background: radial-gradient(closest-side circle at 50% 50%, rgba(var(--sk-glow-fill), 0.50), rgba(var(--sk-glow-fill), 0) 70%);
	opacity: 0;
	transform: translate3d(-130%, 0, 0) scale(0.55);
}
[data-composer-card] button[class$='_primary']:hover::before,
[data-composer-card] button[class*='_primary ']:hover::before {
	animation: sk-glint 420ms cubic-bezier(0.2, 0, 0.8, 1);
}
@keyframes sk-glint {
	0% { opacity: 0; transform: translate3d(-130%, 0, 0) scale(0.55); }
	38% { opacity: 0.8; }
	100% { opacity: 0; transform: translate3d(130%, 0, 0) scale(1.15); }
}
@media (prefers-reduced-motion: reduce) {
	[data-composer-card] button[class$='_primary']:hover::before,
	[data-composer-card] button[class*='_primary ']:hover::before { animation: none !important; opacity: 0 !important; }
}
/* Idle: nothing here. The working state lights a rim light into this layer, so
 * the same element crossfades between "a bead at rest" and "a bead with light
 * running around it" without any second element appearing. */
/* The bead's halo EXISTS only while a run is active.
 *
 * It used to be present at rest with opacity 0, which is the last flicker source on
 * this control: opacity below 1 promotes the element to its own compositing layer,
 * and a composited layer inside the composer's backdrop root makes the backdrop be
 * re-rendered — so merely hovering, which repaints the button, dragged the whole
 * window into a re-filter. Nothing was animating; the element simply existed.
 *
 * content: none removes it from rendering entirely when idle. The watcher writes
 * the work/ending state on the BUTTON, so the internal light uses that same node. */
[data-composer-card] button[class$='_primary']::after,
[data-composer-card] button[class*='_primary ']::after {
	content: none;
}
[data-composer-card] button[class$='_primary']:is([data-sk='work'], [data-sk='ending'])::after,
[data-composer-card] button[class*='_primary ']:is([data-sk='work'], [data-sk='ending'])::after {
	content: ${choice.effect === 'off' ? 'none' : "''"};
	position: absolute;
	inset: -25%;
	border-radius: 50%;
	opacity: 0;
	transition: opacity 0.6s ease-out;
	pointer-events: none;
	background: conic-gradient(from 0deg,
		rgba(255, 255, 255, 0) 0deg,
		rgba(255, 255, 255, 0.34) 34deg,
		rgba(var(--sk-glow), 0.12) 78deg,
		rgba(255, 255, 255, 0) 132deg,
		rgba(255, 255, 255, 0) 196deg,
		rgba(var(--sk-glow), 0.26) 238deg,
		rgba(255, 255, 255, 0) 300deg);
	-webkit-mask: radial-gradient(closest-side, rgba(0, 0, 0, 0) 58%, #000 76%, #000 93%, rgba(0, 0, 0, 0) 100%);
	mask: radial-gradient(closest-side, rgba(0, 0, 0, 0) 58%, #000 76%, #000 93%, rgba(0, 0, 0, 0) 100%);
}
/* Both selectors require BUTTON, and that is not decoration.
 *
 * The [class*='_primary '] form is a substring match, and a CSS-module name is a
 * family: it reaches any ancestor or wrapper whose class happens to contain that
 * fragment. Without the element type, hovering the send button lifted the ENTIRE
 * composer card by 3px, because a wrapper matched too. This is the fourth time a
 * substring class match has hit more than intended in this file; the guard is the
 * cheap structural fix, since only a real button should ever be pressed. */
[data-composer-card] button[class$='_primary']:hover:not(:disabled),
[data-composer-card] button[class*='_primary ']:hover:not(:disabled) {
	/* No transform. Inside a backdrop root a transform promotes a compositing layer,
	 * which is the same mechanism that made this control flicker the window. The
	 * hover answer is paint only: a lifted shadow and a brighter fill. */
	background-color: rgba(var(--sk-glow), 0.20) !important;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.62),
		inset 0 -1px 0 rgba(255, 255, 255, 0.16),
		inset 0 0 0 1px rgba(255, 255, 255, 0.38),
		inset 0 0 15px rgba(var(--sk-glow), 0.10),
		inset 0 0 0 rgba(var(--sk-glow-2), 0),
		inset 0 0 0 rgba(var(--sk-glow), 0),
		0 0 0 0 rgba(255, 255, 255, 0),
		0 0 18px rgba(var(--sk-glow), 0.22),
		0 10px 22px rgba(0, 0, 0, 0.48),
		0 2px 6px rgba(0, 0, 0, 0.32) !important;
}
[data-composer-card] button[class$='_primary']:active:not(:disabled),
[data-composer-card] button[class*='_primary ']:active:not(:disabled) {
	background-color: rgba(var(--sk-glow), 0.25) !important;
}
/* Disabled means dimmer, not colourless.
 *
 * This used to be saturate(0.45), which threw away more than half the button's
 * chroma — so the one control that carries the skin's accent turned grey the moment
 * it went inactive, and the whole composer read as unthemed. Brightness is what
 * signals "not available"; desaturating it just makes the control look broken. */
[data-composer-card] button[class$='_primary']:disabled,
[data-composer-card] button[class*='_primary ']:disabled {
	filter: brightness(0.76);
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 24. */
${working}

/* Historical rationale: see docs/CSS-HISTORY.md, note 25. */
[data-menu-material],
[role='dialog'],
[role='menu'],
[role='listbox'] {
	-webkit-backdrop-filter: blur(${a(it.blur + 24)}px) saturate(var(--sk-sat)) !important;
	backdrop-filter: blur(${a(it.blur + 24)}px) saturate(var(--sk-sat)) !important;
}

/* --- small glass pieces: bubbles, pills, window-chrome buttons -----
 * The new-session pill and, once the sidebar is collapsed, the two 28px
 * window-chrome buttons the sidebar moves into the title bar.
 *
 * The class match is anchored: newSession also prefixes the newSessionContent,
 * newSessionLabel, newSessionLabelMask and newSessionShortcut classes, and a
 * plain substring match painted those inner wrappers too — which is what put a
 * stray lighter block inside the pill. */
/* Historical rationale: see docs/CSS-HISTORY.md, note 26. */
[class*='_bubble']:not([class*='_bubble_']) {
	background: var(--sk-mat-bg) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	box-shadow: var(--sk-mat-rim) !important;
}

/* The task panel takes the CONTENT material, not the lens.
 *
 * It was on the lens for one build and the user moved it back: a panel that holds a
 * list of items is content, and content in this skin is the bubble/composer material
 * — a flat tint with the backdrop sampled behind it. The lens (the send button's
 * structure) belongs to controls, which is why the two are now separate rules rather
 * than one list someone will later merge.
 *
 * Located by shape rather than by hash: a section that owns a collapsible header. */
section:has(> [class*='_body'] > button[aria-expanded][class*='_header']) {
	background: var(--sk-mat-bg) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	box-shadow: var(--sk-mat-rim) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 27. */
[data-queue-dock] ul > li {
	background: var(--sk-mat-bg) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	box-shadow: var(--sk-mat-rim) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 28. */
[class*='_toBottom']:not([class*='_toBottomSlot']) {
	background: var(--sk-mat-bg) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	box-shadow: var(--sk-mat-rim) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 29. */
.md-code-block [class*='_bannerWrap'] {
	/* The existing code-content clip keeps scrolled glyphs out of this glass. */
	background: var(--sk-code-banner) !important;
	background-image: linear-gradient(110deg,rgba(255,255,255,.035),transparent 45%) !important;
	backdrop-filter:blur(24px) saturate(1.08)!important;
	-webkit-backdrop-filter:blur(24px) saturate(1.08)!important;
	border-bottom: .5px solid var(--sk-rim-soft);
	border-top-left-radius: var(--dsl-code-block-border-radius, var(--dsw-radius-lg)) !important;
	border-top-right-radius: var(--dsl-code-block-border-radius, var(--dsw-radius-lg)) !important;
}
/* The inner banner must not add another tint over the reading glass. */
.md-code-block [class*='_bannerWrap'] > [class*='_banner_'] {
	background:transparent!important;color:var(--sk-ink)!important;
}
.md-code-block [class*='_bannerWrap'] :is(button,[class*='_infostring']) {
	color:var(--sk-ink)!important;
}
.md-code-block [class*='_bannerWrap'] button svg { color:inherit; }
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))) {
	.md-code-block [class*='_bannerWrap'] { background:hsl(var(--sk-tint-lift))!important; }
}

/* One surface per code block, not a tint on both the wrapper and every pre.
 * The sticky banner uses its own stronger reading blur. */
.md-code-block {
	background: var(--sk-card-bg) !important;
	background-image: var(--sk-liquid-sheen) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	box-shadow: var(--sk-mat-rim);
	/* overflow:hidden would break the sticky header. Clip the complete surface
	 * at its current sticky edge, including the fill underneath the rounded header. */
	clip-path: inset(var(--sk-code-clip-top, 0px) 0 0 round var(--dsl-code-block-border-radius, var(--dsw-radius-lg)));
}
.md-code-block pre {
	background: transparent !important;
}
/* Long code/log surfaces can span many screens. Keep their clear reading
 * material and curved outline without allocating a full-height refraction
 * texture; navigation and compact cards retain the optical lens. */
body[data-sk-glass] .md-code-block {
 --sk-mat-blur: blur(min(var(--sk-reading-blur), 4px)) saturate(1.12);
}
/* The host's shimmer animates a separate text copy. Theme its existing
 * highlight token and active label without filtering or replacing the text. */
[data-slot='conversation.chat.node'] :is(button[aria-expanded], [data-turn-process]):has([data-shimmer-text]) {
	color: var(--sk-work-label) !important;
}

/* A portal preview is one reading surface, using its existing native box. */
${HOVER_PREVIEW} {
	background: var(--sk-settings-bg) !important;
	-webkit-backdrop-filter: var(--sk-liquid-filter,blur(max(var(--sk-reading-blur),calc(3.5px * var(--sk-readability-floor))))) saturate(1.12) !important;
	backdrop-filter: var(--sk-liquid-filter,blur(max(var(--sk-reading-blur),calc(3.5px * var(--sk-readability-floor))))) saturate(1.12) !important;
	box-shadow: var(--sk-mat-rim), 0 12px 32px rgba(0,0,0,.20) !important;
}
${HOVER_PREVIEW} [class*='_hoverTitle'] { color:var(--sk-ink)!important; }
${HOVER_PREVIEW} :is([class*='_hoverTime'],[class*='_hoverStatus']) { color:var(--sk-ink-secondary)!important; }

/* These controls share the bubble/composer material. Blur belongs to the
 * pseudo-element so anchored dialogs retain their viewport positioning. */
${GLASS_CONTROLS} {
	position: relative;
	z-index: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	min-height: 28px;
	padding: 4px 10px;
	gap: 6px;
	border-radius: var(--dsw-radius-md);
	background: transparent !important;
	text-align: center;
}
/* Document tabs keep their native drag geometry and close-button hit area. */
${DOCK_TABS} {
	position: relative;
	z-index: 0;
	background: transparent !important;
	--sk-liquid-filter: initial;
}
${DOCK_TABS}[aria-selected='true']::before {
	box-shadow: var(--sk-mat-rim), inset 0 1px 0 rgba(var(--sk-glow), .55);
}
body[data-sk-pointer] ${DOCK_TABS}:hover::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 90%, rgb(var(--sk-glow)) 10%);
}
body[data-sk-pointer] ${DOCK_TABS}:active::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 84%, rgb(var(--sk-glow)) 16%);
}
${GLASS_SURFACES}::before {
	transition: background-color var(--sk-motion-hover) var(--sk-ease-settle);
	content: '';
	position: absolute;
	inset: 0;
	z-index: -1;
	border-radius: inherit;
	pointer-events: none;
	background: var(--sk-mat-bg);
	box-shadow: var(--sk-mat-rim);
	-webkit-backdrop-filter: var(--sk-mat-blur);
	backdrop-filter: var(--sk-mat-blur);
}
/* The dock's material layer is explicitly retired. It must be cleared by name:
 * the pseudo-element is created by the skin itself, so dropping the dock from
 * GLASS_SURFACES is not enough — the layer would simply keep painting whatever the
 * host's own dock background happens to be underneath the tray. */
[data-sk-glass] ${COMPOSER_DOCK}::before,
[data-sk-glass] ${COMPOSER_DOCK} {
	background: none !important;
	background-image: none !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	box-shadow: none !important;
}
/* The dock begins exactly at the composer's lower edge. Its square upper
 * corners attach to that edge; only the outside and lower rim are painted. */
${COMPOSER_DOCK}::before {
	box-shadow:
		inset 0.5px 0 0 var(--sk-rim-soft),
		inset -0.5px 0 0 var(--sk-rim-soft),
		inset 0 -0.5px 0 var(--sk-rim-soft);
}
/* One empty backdrop layer covers the input card.
 * Separate blurs sample different pixels and leave a colour seam even when the
 * edges align. Native padding/max-width keep this sheet exactly on both edges.
 * Work animations remain outside the blurring pseudo-element's subtree. */
${COMPOSER_SURFACE}[data-sk-composer-surface] {
 position: relative;
 z-index: 0;
 --sk-mat-blur: var(--sk-liquid-filter,blur(var(--sk-control-blur))) saturate(var(--sk-reading-sat));
}
/* Expanded input keeps the native glass recipe without a full-area SVG pass.
 * Geometry owns the marker; shrinking restores refraction and unload restores
 * the original host. No preference, text, caret or input handler is changed. */
body[data-sk-glass] ${COMPOSER_SURFACE}[data-sk-composer-reading] {
 --sk-mat-blur: blur(var(--sk-control-blur)) saturate(var(--sk-reading-sat));
 --sk-mat-rim: var(--sk-reading-rim);
}
/* Native long-message glass keeps a quiet contour without SVG reflection. */
body[data-sk-glass] [class*='_bubble']:not([class*='_bubble_']):not([data-sk-liquid]) {
 --sk-mat-rim: var(--sk-reading-rim);
}
/* A local SVG viewport follows the same native CSS sizing as the glass layer.
 * Its percentage image bounds resolve during paint, including the final frame
 * of a sidebar transition; no JavaScript pixel snapshot controls those bounds. */
${COMPOSER_SURFACE}[data-sk-composer-surface] > svg[data-sk-liquid-viewport] {
 position: absolute;
 inset: 0 var(--dsh-composer-side-clearance, 16px) auto;
 width: calc(100% - 2 * var(--dsh-composer-side-clearance, 16px));
 height: var(--sk-composer-height, 120px);
 max-width: var(--dsh-composer-card-max-width);
 margin-inline: auto;
 pointer-events: none;
 overflow: visible;
}
/* Keep native nodes and event handlers in place. Removing this stylesheet
 * immediately restores the host's original card-then-dock layout. */
/* Historical rationale: see docs/CSS-HISTORY.md, note 30. */
[data-composer-placeholder] { color: var(--sk-ink-muted) !important; }
[data-composer-stats] {
	font-variant-numeric: tabular-nums;
}
${COMPOSER_DOCK} {
	/* The context ring is a sibling of stats. Space the entire dock so its
	   controls keep one baseline and the native SVG keeps its own geometry. */
	padding-top: ${SK_TRAY_GAP};
}
${COMPOSER_SURFACE}[data-sk-composer-surface]::before {
 content: '';
 position: absolute;
 inset: 0 var(--dsh-composer-side-clearance, 16px) auto;
 height: var(--sk-composer-height, 120px);
 max-width: var(--dsh-composer-card-max-width);
 margin-inline: auto;
 z-index: -1;
 pointer-events: none;
 background: var(--sk-liquid-sheen), var(--sk-mat-bg);
 /* One rounded rectangle, the card's own shape. The union path existed only to
  * fuse the tray into the sheet; with the tray back in its own row the card's
  * native corner radius is the whole silhouette. */
 border-radius: var(--dsw-radius-panel, 28px);
}
${COMPOSER_SURFACE}[data-sk-composer-surface]::before {
 -webkit-backdrop-filter: var(--sk-mat-blur);
 backdrop-filter: var(--sk-mat-blur);
}
${COMPOSER_SURFACE}[data-sk-composer-surface]::after {
 content: '';
 position: absolute;
 inset: 0 var(--dsh-composer-side-clearance, 16px) auto;
 height: var(--sk-composer-height, 120px);
 max-width: var(--dsh-composer-card-max-width);
 margin-inline: auto;
 z-index: -1;
 pointer-events: none;
 background: transparent;
 box-shadow: var(--sk-mat-rim);
 border-radius: var(--dsw-radius-panel, 28px);
 /* Cast shadow is part of the shared rim, without an extra filter pass. */
 filter: none;
}
/* Frosted glass keeps its original soft material and continuous thin rim.
 * The restored rim follows the card only, leaving the statistics separate. */
body:not([data-sk-glass]) ${COMPOSER_SURFACE}[data-sk-composer-surface]::after {
 box-sizing: border-box;
 padding: 1px;
 background: linear-gradient(135deg,rgba(255,255,255,.30),rgba(255,255,255,.12) 30%,rgba(255,255,255,.06) 68%,rgba(255,255,255,.20));
 box-shadow: none;
 mask: linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
 mask-composite: exclude;
 filter: none;
}
/* The @supports (clip-path: shape(...)) block that used to swap in a responsive
 * union path is gone with the union itself. The card's own border-radius above is
 * already responsive: it is one fixed corner radius, not a fitted contour, so
 * there is nothing to re-fit when the sheet resizes. */
${COMPOSER_SURFACE}[data-sk-composer-surface] > [data-composer-card] {
 background: transparent !important;
 box-shadow: none !important;
}
${COMPOSER_SURFACE}[data-sk-composer-surface] > :is([data-composer-card], [class$='_dock'], [class*='_dock '])::before {
 content: none !important;
}
/* Filter coordinates are local to their owning surface. Unmapped children
 * must use their blur fallback instead of inheriting a large pane's map. */
:is(${CONTENT_CARDS},.md-code-block,[data-presented-file],[class*='_bubble']:not([class*='_bubble_']),[role='dialog'],[role='menu'],[role='listbox'],[data-testid='todo-panel'],[data-turn-trigger],[data-goal-bar] > [class$='_bar'],[data-sk-composer-surface],.sk-card,.sk-seg,.sk-tile,${GLASS_SURFACES}) {
 --sk-liquid-filter: initial;
 --sk-mat-blur: var(--sk-liquid-filter,blur(var(--sk-control-blur))) saturate(var(--sk-sat));
}
${CONTENT_CARDS} > [class*='_header'] {
 background: transparent !important;
}
/* A task panel is one floating surface; its native zero-radius header made
 * the hover fill a rectangle inside the rounded shell. Keep nested curves. */
:is([data-testid='todo-panel'], [data-turn-trigger]) {
 background: var(--sk-mat-bg) !important;
 -webkit-backdrop-filter: var(--sk-mat-blur) !important;
 backdrop-filter: var(--sk-mat-blur) !important;
 box-shadow: var(--sk-mat-rim),0 8px 22px rgba(0,0,0,.16) !important;
}
[data-goal-bar] > [class$='_bar']::before {
 background: var(--sk-mat-bg) !important;
 backdrop-filter: var(--sk-mat-blur) !important;
 -webkit-backdrop-filter: var(--sk-mat-blur) !important;
 box-shadow: var(--sk-mat-rim);
}
[data-testid='todo-panel'] > div > button[aria-expanded] {
 border-radius: calc(var(--dsw-radius-lg) - 6px);
 padding: 2px 6px;
 margin-inline: -6px;
 width: calc(100% + 12px);
}
/* Sibling deliverables and change summaries are the same elevation. Native
 * attachment and diff-card recipes had different tints/alphas (.72 vs .42).
 * One reading material prevents the larger summary from looking darker. */
:is(${CONTENT_CARDS},[data-presented-file]) {
 background-color: var(--sk-card-bg) !important;
 -webkit-backdrop-filter: var(--sk-liquid-filter, blur(var(--sk-reading-blur))) saturate(1.12) !important;
 backdrop-filter: var(--sk-liquid-filter, blur(var(--sk-reading-blur))) saturate(1.12) !important;
 box-shadow: var(--sk-mat-rim), 0 8px 22px rgba(0,0,0,.16) !important;
}
/* Refraction belongs to the empty material layer, never the foreground text.
 * The size-specific filter is inherited by the existing surface pseudo-element. */
/* One optical contour. The host can use superellipse corners even when
 * border-radius is unchanged; circular atlases must not sit over that shape.
 * Scope normalization to active mapped glass, restoring native corners on off. */
body[data-sk-active][data-sk-glass] [data-sk-liquid],
body[data-sk-active][data-sk-glass] [data-sk-liquid]::before,
body[data-sk-active][data-sk-glass] [data-sk-liquid]::after,
body[data-sk-active][data-sk-glass] [data-sk-composer-surface][data-sk-liquid] > [data-composer-card] {
 corner-shape: round !important;
}
[data-sk-liquid] {
 --sk-mat-blur: var(--sk-liquid-filter, blur(var(--sk-control-blur))) saturate(var(--sk-sat));
 --sk-glass: var(--sk-liquid-filter, blur(var(--sk-control-blur))) saturate(var(--sk-sat));
 --sk-glass-read: var(--sk-liquid-filter, blur(var(--sk-control-blur))) saturate(var(--sk-sat));
}
/* A mapped lens owns its contour in the normal-field reflection texture.
 * Keep only elevation here; inset CSS rings would create another displaced
 * arc at the corners. Unmapped renderers retain the thin fallback rim. */
[data-sk-liquid]:not(${SETTINGS_PANEL}) {
 --sk-mat-rim: 0 3px 6px rgba(0,0,0,.04), 0 14px 28px -4px rgba(0,0,0,.13);
}
body[data-sk-glass] :is(.BynINW_sidebarCol,.BynINW_centerCol,.BynINW_rightbarCol)::before {
 content: '';
 position: absolute;
 inset: 0;
 z-index: -1;
 pointer-events: none;
 border-radius: inherit;
 background: linear-gradient(125deg,rgba(var(--sk-glow),.045),transparent 20%,transparent 75%,rgba(var(--sk-glow),.025));
	/* The authored ambient scene is already soft. Broad flush panes transmit
	 * its color without resampling a full-window texture every frame. */
	backdrop-filter: none;
}
/* Menus and cards use their established reading fill with the same polished
 * bevel; pills/bubbles/composer let more of the scene through. */
[data-sk-liquid]:is(${CONTENT_CARDS},[data-presented-file],[role='dialog'],[role='menu'],[role='listbox']):not(${SETTINGS_PANEL}) {
 box-shadow: var(--sk-mat-rim), 0 12px 30px rgba(0,0,0,.20) !important;
 -webkit-backdrop-filter: var(--sk-mat-blur) !important;
 backdrop-filter: var(--sk-mat-blur) !important;
}
[data-sk-liquid]:is(.sk-card,.sk-seg,.sk-tile) {
 box-shadow: var(--sk-mat-rim) !important;
 backdrop-filter: var(--sk-mat-blur);
}
body[data-sk-pointer][data-sk-active] [class*='_tabs'] > button[role='tab']:hover::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 90%, rgb(var(--sk-glow)) 10%);
	box-shadow: inset 1px 0 0 rgba(var(--sk-glow), 0.30), inset -1px 0 0 rgba(var(--sk-glow), 0.30), inset 0 1px 0 rgba(var(--sk-glow), 0.30);
}
body[data-sk-pointer][data-sk-active] [class*='_tabs'] > button[role='tab']:active::before {
	background: color-mix(in srgb, var(--sk-mat-bg) 84%, rgb(var(--sk-glow)) 16%);
}
/* A quiet local wash identifies the hovered metric within the shared glass. */
body[data-sk-pointer][data-sk-active] ${GLASS_CONTROLS}:not([role='tab']):hover {
	background: var(--sk-state-hover) !important;
}
body[data-sk-pointer][data-sk-active] ${GLASS_CONTROLS}:not([role='tab']):active {
	background: var(--sk-state-press) !important;
}
[class*='_tabs'] {
	gap: 10px;
	margin-top: 7px;
	padding-bottom: 0;
	align-items: stretch;
}
${GLASS_CONTROLS}[role='tab'] {
	min-width: 58px;
	padding: 6px 14px;
	border-radius: var(--dsw-radius-sm) var(--dsw-radius-sm) 0 0;
	--sk-tab-rim: inset 0.5px 0 0 var(--sk-rim-soft), inset -0.5px 0 0 var(--sk-rim-soft), inset 0 1px 0 var(--sk-rim);
}
/* Open lower rims let the tabs meet the header's existing separator. */
${GLASS_CONTROLS}[role='tab']::before {
	box-shadow: none;
	clip-path: inset(0 round var(--dsw-radius-sm) var(--dsw-radius-sm) 0 0);
}
[class*='_tabs'] > button[role='tab'][aria-selected='true'] {
	color: var(--dsw-alias-label-primary);
}
body[data-sk-active] ${GLASS_CONTROLS}[role='tab'][aria-selected='true']::before {
	box-shadow: var(--sk-tab-rim), inset 1px 0 0 rgba(var(--sk-glow), 0.55), inset -1px 0 0 rgba(var(--sk-glow), 0.55), inset 0 1px 0 rgba(var(--sk-glow), 0.55);
}
body[data-sk-active] ${GLASS_CONTROLS}:not([aria-selected='true'])::before { content:none!important; }
/* The glass rim carries selection; symmetric padding centers the label. */
[class*='_tabs'] > button[role='tab']::after {
	content: none;
}

/* Inline links answer with an underline, never a rectangular surface.
 * Do not touch box-shadow or outline: the host uses them for keyboard focus. */
body[data-sk-active] :is(a[href], [class*='_fileLink'], [class*='_fileMention']) {
	color: var(--sk-link-ink) !important;
}
body[data-sk-pointer][data-sk-active] :is(a[href], [class*='_fileLink'], [class*='_fileMention']):is(:hover, :active) {
	background-color: transparent !important;
	text-decoration-line: underline;
	text-underline-offset: 3px;
}
body[data-sk-pointer][data-sk-active] button[class*='_cardPreview']:is(:hover, :active) {
	background-color: transparent !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 31. */
[data-composer-card] button[class*='_add'] {
	background: rgba(var(--sk-glow), var(--sk-control-tint)) !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.57),
		inset 0 -1px 0 rgba(255, 255, 255, 0.13),
		inset 0 0 0 1px rgba(255, 255, 255, 0.333),
		inset 0 0 13px rgba(255, 255, 255, 0.075),
		inset 0.5px 0.5px 0 rgba(220, 170, 238, 0.1),
		inset -0.5px -0.5px 0 rgba(var(--sk-glow), 0.22),
		0 0 0 0.5px rgba(255, 255, 255, 0.314),
		0 6px 16px rgba(0, 0, 0, 0.42),
		0 1px 3px rgba(0, 0, 0, 0.3) !important;
}
/* Which session you are in has to survive a glance, so the selected row carries the
 * content material now, like the task panel. */
${SESSION_SELECTED} {
	position: relative;
	z-index: 0;
	background: transparent !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	box-shadow: none !important;
}
${SESSION_SELECTED}::before {
	content: '';
	position: absolute;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	border-radius: inherit;
	background: var(--sk-mat-bg);
	-webkit-backdrop-filter: var(--sk-mat-blur);
	backdrop-filter: var(--sk-mat-blur);
	box-shadow: var(--sk-mat-rim), var(--sk-session-cast-shadow);
}
body[data-sk-pointer] ${SESSION_SELECTED}:hover::before { background: color-mix(in srgb,var(--sk-mat-bg) 90%,rgb(var(--sk-glow)) 10%); }
body[data-sk-pointer] ${SESSION_SELECTED}:active::before { background: color-mix(in srgb,var(--sk-mat-bg) 84%,rgb(var(--sk-glow)) 16%); }
/* Selection motion belongs only to the material; labels and hit areas stay put. */
${NAV_SELECTED}::before { transform-origin: 0 0; }
/* One directional reflection layer is shared in flight and at rest. The pure
 * preset keeps the centre tint-free; its silhouette still reflects light. */
${NAV_SELECTED}::before,${GLASS_SURFACES}::before,[data-sk-nav-lens]::before,.sk-seg::before {
	background-image:var(--sk-liquid-sheen)!important;
}
/* One travelling lens paints above unselected labels. Its selected label
 * stays above the lens; native row geometry and hit targets never move. */
[data-sk-nav-lens] { position:absolute;z-index:2;pointer-events:none;overflow:visible;--sk-liquid-filter:initial; }
[data-sk-nav-lens]::before { content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;clip-path:var(--sk-nav-clip,none);transform-origin:0 0;background:var(--sk-nav-fill,var(--sk-mat-bg));box-shadow:var(--sk-nav-rim,var(--sk-mat-rim));backdrop-filter:var(--sk-mat-blur);-webkit-backdrop-filter:var(--sk-mat-blur); }
/* Frosted navigation samples the scene below labels; liquid lenses pass above
 * unselected labels so their optical refraction remains visible. */
body:not([data-sk-glass]) [data-sk-nav-lens] { z-index:-1; }
[data-sk-nav-lens][hidden] { display:none!important; }
/* Pointer state is live, never a frozen press tint captured at selection. */
body[data-sk-active] [data-sk-nav-lens] { --sk-nav-fill:var(--sk-mat-bg); }
body[data-sk-pointer][data-sk-active] [data-sk-nav-flight]:has(${NAV_SELECTED}:hover) > [data-sk-nav-lens] { --sk-nav-fill:color-mix(in srgb,var(--sk-mat-bg) 90%,rgb(var(--sk-glow)) 10%); }
body[data-sk-pointer][data-sk-active] [data-sk-nav-flight]:has(${NAV_SELECTED}:active) > [data-sk-nav-lens] { --sk-nav-fill:color-mix(in srgb,var(--sk-mat-bg) 84%,rgb(var(--sk-glow)) 16%); }
body[data-sk-active] [data-sk-nav-flight] :is([class*='_sessionRow'],${PANEL_CONTROLS},${GLASS_CONTROLS}) { background:transparent!important;box-shadow:none!important; }
body[data-sk-pointer][data-sk-active] [data-sk-nav-flight] ${FILLED_INTERACTIVE}:is(:hover,:active):not(:disabled):not([aria-disabled='true']) { background:transparent!important;box-shadow:none!important; }
body[data-sk-active] [data-sk-nav-flight] :is(${SESSION_SELECTED},${PANEL_ACTIVE},${GLASS_CONTROLS})::before { content:none!important; }
body[data-sk-active] [data-sk-nav-foreground] { position:relative;z-index:3; }
/* Quiet, theme-matched nested controls do not create another blur root. */
${SETTINGS_PANEL} button[class*='_selector'][aria-haspopup] {
	color: var(--sk-ink) !important;
	background: var(--sk-quiet-control) !important;
	box-shadow: inset 0 0 0 .5px var(--sk-rim-hair);
}
${SETTINGS_PANEL} button[class*='_selector'][aria-haspopup] > svg,
${SETTINGS_PANEL} button[class*='_selector'][aria-haspopup] [class*='_chevron'] {
	color: var(--sk-ink-secondary) !important;
}
.md-code-block [class*='_infostring'] { color: var(--sk-ink-secondary) !important; }
:is([class*='_markdown'],[data-markdown]) :not(pre) > code {
	color: var(--sk-ink) !important;
	background: var(--sk-inline-code) !important;
	box-shadow: inset 0 0 0 .5px var(--sk-rim-soft);
}
/* Theme the tile, preserving each file type's own coloured artwork. */
[data-presented-file] > [class*='_fileIcon'] {
	background: var(--sk-quiet-control) !important;
	box-shadow: inset 0 0 0 .5px var(--sk-rim-hair);
}
/* Historical rationale: see docs/CSS-HISTORY.md, note 32. */
[class$='_newSession'],
[class*='_newSession '] {
	background: var(--sk-mat-bg) !important;
	-webkit-backdrop-filter: var(--sk-mat-blur) !important;
	backdrop-filter: var(--sk-mat-blur) !important;
	/* The optical image already paints the curved specular edge. A native
	 * border plus inset highlights made the lower lip look like two shells. */
	box-shadow: ${choice.glass === 'on' ? skinColors.rimShadow('inset 0 0 0 .5px rgba(255,255,255,.18)', rim) : 'var(--sk-mat-rim)'} !important;
	border-color: ${choice.glass === 'on' ? 'transparent' : 'var(--sk-rim-soft)'} !important;
}
/* Historical rationale: see docs/CSS-HISTORY.md, note 33. */
[class*='previewBadge'] {
	background: rgba(var(--sk-glow), var(--sk-chip-tint)) !important;
	border-color: rgba(var(--sk-glow), 0.30) !important;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.24),
		inset 0 0 0 0.5px rgba(255, 255, 255, 0.13) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 34. */
[class*='_iconButton'][class$='_toggle'] {
	background: transparent !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	box-shadow: none !important;
}
/* Historical rationale: see docs/CSS-HISTORY.md, note 35. */
[data-windows-titlebar] [class*='_root'][class*='_collapsed'] [class$='_newSession'],
[data-windows-titlebar] [class*='_root'][class*='_collapsed'] [class*='_newSession '] {
	background: transparent !important;
	border: 0 !important;
	border-radius: var(--dsw-radius-sm) !important;
	box-shadow: none !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	color: var(--dsw-alias-label-secondary) !important;
}
/* The sidebar toggle is window chrome in both sidebar states — the host fixes it
 * into the drag strip at --dsh-windows-titlebar-height — so it takes the pill and
 * the compact silhouette unconditionally. */
[class*='_iconButton'][class*='_toggle'] {
	background: transparent !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	box-shadow: none !important;
}
[data-windows-titlebar] [class*='_iconButton'][class*='_toggle'] {
	border-radius: var(--dsw-radius-sm) !important;
}
[data-windows-titlebar] [class*='_root'][class*='_collapsed'] [class*='_iconButton'] {
	background: transparent !important;
	border: 0 !important;
	border-radius: var(--dsw-radius-sm) !important;
	box-shadow: none !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	color: var(--dsw-alias-label-secondary) !important;
}
body[data-sk-pointer][data-sk-active] [data-windows-titlebar] [class*='_root'][class*='_collapsed'] :is([class*='_iconButton'],[class$='_newSession'],[class*='_newSession ']):hover {
	background: var(--sk-state-hover) !important;
}
body[data-sk-pointer][data-sk-active] [data-windows-titlebar] [class*='_root'][class*='_collapsed'] :is([class*='_iconButton'],[class$='_newSession'],[class*='_newSession ']):active {
	background: var(--sk-state-press) !important;
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 36. */
body[data-sk-active] :is(div, span, button, a, li, ul, ol, section, article, aside, header, footer, nav, form) {
	--changes-fill: hsl(var(--sk-tint) / 0.44) !important;
	--changes-hover: var(--sk-state-hover) !important;
	--deliverable-fill: hsl(var(--sk-tint-lift) / 0.72) !important;
	--deliverable-hover: var(--sk-state-hover) !important;
	--plan-card-hover: var(--sk-state-hover) !important;
	--card-hover: var(--sk-state-hover) !important;
}

/* --- shared interaction language ----------------------------------
 * A bounded accent wash, the same one as the metrics tray, answers hover.
 * Press is stronger and faster. No blur, filter or large shadow is animated.
 * Outline remains the host's focus indicator; no transform re-anchors popups. */
body[data-sk-pointer][data-sk-active] ${INTERACTIVE} {
	transition:
		background-color var(--sk-motion-hover) var(--sk-ease-settle),
		border-color var(--sk-motion-hover) var(--sk-ease-settle),
		color var(--sk-motion-hover) var(--sk-ease-settle),
		opacity var(--sk-motion-hover) var(--sk-ease-settle);
}
/* Motion stays inside stable hit areas. Popup entrances preserve native anchors. */
body[data-sk-pointer][data-sk-active] button[aria-label]:not([data-sk]):not([class*='_primary']) > svg {
	transition: scale 250ms var(--sk-ease-release), opacity var(--sk-motion-hover) var(--sk-ease-settle);
}
body[data-sk-pointer][data-sk-active] button[aria-label]:not([data-sk]):not([class*='_primary']):active:not(:disabled) > svg { scale: .94; transition-duration: var(--sk-motion-press); transition-timing-function: var(--sk-ease-settle); }
:is([role='menu'],[role='listbox']) { animation: sk-popup-appear 167ms var(--sk-ease-settle) both; }
[role='dialog'] { animation: sk-popup-appear 220ms var(--sk-ease-settle) both; }
[class*='_cards']:has(> [class*='_cardLink']) > [class*='_cardLink'] {
	animation: sk-card-appear 220ms var(--sk-ease-settle) backwards;
	animation-delay: calc(min(sibling-index(),8) * 8ms);
}
@keyframes sk-popup-appear { from { opacity: 0; } to { opacity: 1; } }
@keyframes sk-card-appear { from { opacity: .65; translate: 0 3px; } to { opacity: 1; translate: 0 0; } }
@media (prefers-reduced-motion: reduce) {
	:is([role='menu'],[role='listbox'],[role='dialog']),
	[class*='_cards']:has(> [class*='_cardLink']) > [class*='_cardLink'] { animation: none !important; }
	body[data-sk-pointer][data-sk-active] button[aria-label]:not([data-sk]):not([class*='_primary']) > svg { transition: none !important; scale: 1 !important; }
}
body[data-sk-pointer][data-sk-active] ${FILLED_INTERACTIVE}:hover:not(:disabled):not([aria-disabled='true']) {
	background-color: var(--sk-state-hover) !important;
}
body[data-sk-pointer][data-sk-active] ${FILLED_INTERACTIVE}:active:not(:disabled):not([aria-disabled='true']) {
	background-color: var(--sk-state-press) !important;
	transition-duration: var(--sk-motion-press);
}
/* Session labels and native action affordances provide hover feedback. A
 * second flat plate would compete with the travelling selection glass. */
body[data-sk-active] [class*='_sessionRow']:is(:hover,:active,[class*='_menuOpen']),
body[data-sk-pointer][data-sk-active] ${FILLED_INTERACTIVE}[class*='_sessionRow']:is(:hover,:active):not(:disabled):not([aria-disabled='true']) {
	background: transparent !important;
}
/* The brand mark is a logo control, not a rectangular raised surface. */
body [data-slot='sidebar'] button:is([class$='_brand'],[class*='_brand ']):is(:hover,:active) {
 background: transparent !important;
 box-shadow: none !important;
}
/* The logo badge is an inverted mark on a light plate, not body text. */
body[data-sk-active] [data-slot='sidebar'] [class*='_brandName'] svg {
	--dsw-alias-label-primary-inverted:#17202b;
}
/* Native contrast buttons start white with dark text. Their hovered glass
 * uses the normal light label so the text stays readable during the fade. */
body[data-sk-active] button:is([class^='_primary_'], [class*=' _primary_']) {
	text-shadow: none;
}
body[data-sk-pointer][data-sk-active] button:is([class^='_primary_'], [class*=' _primary_']):is(:hover, :active):not(:disabled) {
	color: var(--dsw-alias-label-primary) !important;
	text-shadow: var(--sk-text-guard);
}
/* Glass controls keep their surface. The wash is mixed into that surface,
 * rather than replacing it with the deep page tint or a white film. */
body[data-sk-pointer][data-sk-active] :is([data-composer-card] button[class*='_add'], [class$='_newSession'], [class*='_newSession ']):hover:not(:disabled) {
	background: color-mix(in srgb, var(--sk-mat-bg) 90%, rgb(var(--sk-glow)) 10%) !important;
}
body[data-sk-pointer][data-sk-active] :is([data-composer-card] button[class*='_add'], [class$='_newSession'], [class*='_newSession ']):active:not(:disabled) {
	background: color-mix(in srgb, var(--sk-mat-bg) 84%, rgb(var(--sk-glow)) 16%) !important;
	transition-duration: var(--sk-motion-press);
}
/* New-session controls compress; navigation targets retain fixed dimensions so
 * a held press cannot shrink the geometry sampled by the moving glass. */
body[data-sk-pointer][data-sk-active] :is(button[class$='_newSession'],button[class*='_newSession '],${PANEL_CONTROLS}) {
	transition: background-color var(--sk-motion-hover) var(--sk-ease-settle), color var(--sk-motion-hover) var(--sk-ease-settle), scale 250ms var(--sk-ease-release);
}
body[data-sk-pointer][data-sk-active] :is(button[class$='_newSession'],button[class*='_newSession ']):active:not(:disabled):not([aria-disabled='true']) {
	scale: .985;
	transition-duration: var(--sk-motion-press);
	transition-timing-function: var(--sk-ease-settle);
}
@media(prefers-reduced-motion:reduce) {
	body[data-sk-pointer][data-sk-active] :is(button[class$='_newSession'],button[class*='_newSession '],${PANEL_CONTROLS}) { scale:1!important;transition:none!important; }
}
body[data-sk-pointer][data-sk-active] [class*='_root'][class*='_collapsed'] :is([class$='_newSession'], [class*='_newSession ']):hover {
	background-color: var(--sk-state-hover) !important;
}
body[data-sk-pointer][data-sk-active] [class*='_root'][class*='_collapsed'] :is([class$='_newSession'], [class*='_newSession ']):active {
	background-color: var(--sk-state-press) !important;
}
/* Plugin titles already have a native full-card click/focus target. Keep it,
 * remove the small title fill and paint one translucent layer behind all text. */
/* Repeated directory rows use native glass rather than full SVG sampling. */
${PLUGIN_CARDS} {
 -webkit-backdrop-filter: blur(var(--sk-reading-blur)) saturate(var(--sk-reading-sat)) !important;
 backdrop-filter: blur(var(--sk-reading-blur)) saturate(var(--sk-reading-sat)) !important;
 position: relative;
	z-index: 0;
	margin: 0;
	box-shadow: inset 0 0 0 0.5px var(--sk-rim-soft), 0 3px 10px rgba(0,0,0,.14) !important;
}
[class*='_cards']:has(> [class*='_cardLink']) {
	gap: 8px;
}
${PLUGIN_CARDS} > [class*='_cardHead'] {
	padding: 12px;
}
${PLUGIN_CARDS} [class*='_cardDesc'] {
	-webkit-line-clamp: 2;
}
${PLUGIN_CARDS}::after {
	content: '';
	position: absolute;
	inset: 0;
	z-index: -1;
	border-radius: inherit;
	pointer-events: none;
	background: var(--sk-state-hover);
	box-shadow: inset 0 0 0 0.5px rgba(var(--sk-glow), 0.22);
	opacity: 0;
	transition: opacity var(--sk-motion-hover) var(--sk-ease-settle);
}
body[data-sk-pointer][data-sk-active] ${PLUGIN_CARDS}:is(:hover, :has([class*='_cardOpen']:focus-visible))::after {
	opacity: 1;
}
body[data-sk-pointer][data-sk-active] ${PLUGIN_CARDS}:has([class*='_cardOpen']:active)::after {
	background: var(--sk-state-press);
	transition-duration: var(--sk-motion-press);
}
body[data-sk-pointer][data-sk-active] ${TEXT_CONTROLS}:is(:hover, :active) {
	background: transparent !important;
}
/* Readable cards and copyable previews retain their backing on pointer enter. */
body[data-sk-pointer][data-sk-active] ${CONTENT_CARDS}:is(button, [role='button']):hover:not(:disabled) {
	background: color-mix(in srgb, hsl(var(--sk-tint) / 0.42) 90%, rgb(var(--sk-glow)) 10%) !important;
}
body[data-sk-pointer][data-sk-active] > :has(> [class*='_hoverContent']):hover {
	background: color-mix(in srgb, var(--sk-settings-bg) 95%, rgb(var(--sk-glow)) 5%) !important;
}
/* A file preview uses an invisible full-card hit target too. Highlight the
 * containing deliverable, preserving the title, body and preview as one card. */
body[data-sk-pointer][data-sk-active] :is(${CONTENT_CARDS}:not(${PLUGIN_CARDS}), [data-presented-file]):has(button[class*='_cardPreview']:hover) {
	background-color: color-mix(in srgb, hsl(var(--sk-tint-lift) / 0.72) 90%, rgb(var(--sk-glow)) 10%) !important;
}
/* Switches keep their on/off colors. A small bounded rim gives pointer feedback
 * without making an enabled switch look disabled. */
body[data-sk-pointer][data-sk-active] :is([role='switch'], [role='checkbox'], [role='radio']):hover:not(:disabled):not([aria-disabled='true']) {
	box-shadow: inset 0 0 0 1px rgba(var(--sk-glow), 0.40);
}
/* Color settles without the former one-pixel lifts and four-percent squish.
 * Static hit areas stay stable when the pointer crosses adjacent controls. */
body[data-sk-pointer][data-sk-active] ${INTERACTIVE}:disabled,
body[data-sk-pointer][data-sk-active] ${INTERACTIVE}[aria-disabled='true'] {
	transition: none;
	cursor: default;
}
@media (prefers-reduced-motion: reduce) {
	body[data-sk-pointer][data-sk-active] ${INTERACTIVE},
	${GLASS_SURFACES}::before,
	${PLUGIN_CARDS}::after {
		transition-duration: 1ms !important;
	}
	.BynINW_frame,
	.sk-knob {
		transition: none !important;
	}
}

/* Historical rationale: see docs/CSS-HISTORY.md, note 37. */
.BynINW_sidebarCol,
[class*='_sidebarCol'],
.BynINW_centerCol,
[class*='_centerCol'],
.BynINW_rightbarCol,
[class*='_rightbarCol'] {
	position: relative;
	z-index: 1;
}

.BynINW_sidebarCol { z-index: 2; }

/* Historical rationale: see docs/CSS-HISTORY.md, note 38. */
[data-windows-titlebar] .BynINW_centerCol,
[data-windows-titlebar] [class*='_centerCol'] {
	border-top-left-radius: 0 !important;
	border-top-right-radius: 0 !important;
}

/* --- native caption buttons ---------------------------------------
 * The desktop preload mirrors this probe's computed colours into
 * mainWindow.setTitleBarOverlay(). Clearing its fill removes the opaque band
 * the stock colour paints over the glass; the glyph colour stays light. */
span[style*='--dsw-specific-sidebar-fill'] {
	background-color: transparent !important;
	color: #ffffff !important;
}

/* One lens is the only painted selection surface. Native button hover and
 * selected fills must not appear underneath the moving material. */
body[data-sk-active] .sk-seg[data-sk-seg] .sk-segBtn,
body[data-sk-pointer][data-sk-active] .sk-seg[data-sk-seg] .sk-segBtn:is(:hover,:active) {
 background: transparent !important;
 box-shadow: none !important;
}
body[data-sk-pointer] .sk-seg[data-sk-seg]:has(.sk-segBtn:hover)::before { background-color: rgba(var(--sk-glow),.08); }
body[data-sk-pointer] .sk-seg[data-sk-seg]:has(.sk-segBtn:active)::before { background-color: rgba(var(--sk-glow),.13); }
/* Accessibility escape hatch: keep the tint, drop the transparency. */
/* Settings use one readable translucent material; no nested corner filters.
 * Nested controls remain overlays instead of stacking more backdrop roots. */
${SETTINGS_PANEL} {
 background: var(--sk-settings-bg) !important;
 -webkit-backdrop-filter: blur(var(--sk-settings-blur)) saturate(var(--sk-sat)) !important;
 backdrop-filter: blur(var(--sk-settings-blur)) saturate(var(--sk-sat)) !important;
 box-shadow: ${skinColors.rimShadow('inset 0 .75px .5px rgba(255,255,255,.18), inset 0 0 0 .5px rgba(255,255,255,.04)', rim)}, 0 24px 64px rgba(0,0,0,.24) !important;
}
${SETTINGS_PANEL} :is(.sk-card,.sk-seg,.sk-tile,${CONTENT_CARDS}) {
 background: var(--sk-settings-row) !important;
 background-image: none !important;
 -webkit-backdrop-filter: none !important;
 backdrop-filter: none !important;
 box-shadow: none !important;
}
body[data-sk-active][data-sk-glass] ${SETTINGS_PANEL} { corner-shape: round !important; }
${SETTINGS_PANEL} .sk-card { border-color: var(--sk-rim-hair); }
${SETTINGS_PANEL} .sk-rowTitle { font-weight: 500; }
${SETTINGS_PANEL} .sk-rowDesc { color: var(--sk-ink-muted); }
${SETTINGS_PANEL} .sk-switch { box-shadow: inset 0 0 0 .5px var(--sk-rim-hair); }
${SETTINGS_PANEL} .sk-knob { background: var(--sk-ink); }
${SETTINGS_PANEL} .sk-switch[data-on] { background: color-mix(in srgb, rgb(var(--sk-glow)) 58%, hsl(var(--sk-material-tint)) 42%); }
body[data-sk-pointer] ${SETTINGS_PANEL} .sk-switch:hover { filter: brightness(1.10); }
body[data-sk-pointer] ${SETTINGS_PANEL} .sk-switch:active .sk-knob { scale: 1.04 .94; transition-duration: var(--sk-motion-press); }
${SETTINGS_PANEL} .sk-knob { transition: transform 250ms var(--sk-ease-settle), scale 250ms var(--sk-ease-release); }
${SETTINGS_PANEL} .sk-tile[data-on] { outline: 1px solid rgba(var(--sk-glow),.70); outline-offset: -1px; }
@media (prefers-reduced-motion: reduce) { ${SETTINGS_PANEL} .sk-knob { transition: none !important; scale: 1 !important; } }

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
	body {
		background-image: none !important;
		background-color: ${skin.base} !important;
		--sk-mat-bg: hsl(var(--sk-tint));
		--sk-settings-bg: hsl(var(--sk-tint-lift));
		--sk-settings-row: hsl(var(--sk-tint-lift));
	}
	body[data-sk-active]::before,
	body[data-sk-active]::after,
	[data-sk-bokeh] { display: none !important; }
	body[data-sk-active] *,
	body[data-sk-active] *::before,
	body[data-sk-active] *::after,
	${SETTINGS_PANEL} {
		-webkit-backdrop-filter: none !important;
		backdrop-filter: none !important;
	}
	body[data-sk-glass][data-sk-active] [data-composer-card]::before {
		-webkit-backdrop-filter: none !important;
		backdrop-filter: none !important;
	}
	${GLASS_SURFACES}::before {
		background: hsl(var(--sk-tint)) !important;
		-webkit-backdrop-filter: none !important;
		backdrop-filter: none !important;
	}
	${CONTENT_CARDS},
	.md-code-block,
	[data-presented-file],
	body > :has(> [class*='_hoverContent']) {
		background: hsl(var(--sk-tint-lift)) !important;
	}
	[data-windows-titlebar] .BynINW_frame:before,
	.BynINW_sidebarCol,
	[class*='_sidebarCol'],
	.BynINW_centerCol,
	[class*='_centerCol'],
	[data-composer-card] {
		-webkit-backdrop-filter: none !important;
		backdrop-filter: none !important;
		background: hsl(var(--sk-tint)) !important;
	}
}
`
		}

		/* ------------------------------------------------------------------ *
		 * Settings page stylesheet (installed even when the skin is off)      *
		 * ------------------------------------------------------------------ */

		const PAGE_CSS = `
.sk-page{box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:22px;max-width:820px;padding:28px 32px 72px;color:var(--dsw-alias-label-primary)}
.sk-head{display:flex;flex-direction:column;gap:6px}
.sk-h1{margin:0;font-size:var(--dsh-content-font-size-title,20px);font-weight:500;line-height:28px}
.sk-sub{margin:0;color:var(--dsw-alias-label-tertiary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:20px}
.sk-credit{margin:4px 0 0;padding-top:14px;border-top:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:var(--dsh-content-font-size-tertiary,12px);line-height:18px;letter-spacing:.04em}
.sk-note{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);padding:8px 12px;font-size:var(--dsh-content-font-size-tertiary,12px);line-height:18px}
.sk-card{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-layer-1);padding:0 16px}
.sk-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:56px;padding:12px 0}
.sk-rowText{display:flex;flex-direction:column;gap:2px;min-width:0;padding-right:32px}
.sk-rowTitle{font-size:var(--dsh-content-font-size-primary,14px);line-height:22px;color:var(--dsw-alias-label-primary)}
.sk-rowDesc{font-size:var(--dsh-content-font-size-tertiary,12px);line-height:18px;color:var(--dsw-alias-label-tertiary)}
.sk-switch{box-sizing:border-box;width:42px;height:24px;padding:0;border:none;border-radius:999px;cursor:pointer;flex:none;position:relative;background:var(--dsw-alias-interactive-bg-active);transition:background .15s}
.sk-switch[data-on]{background:var(--dsw-alias-state-business-primary)}
.sk-switch:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.sk-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-switch-thumb);box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .15s}
.sk-switch[data-on] .sk-knob{transform:translateX(18px)}
.sk-label{font-size:var(--dsh-content-font-size-secondary,13px);line-height:20px;color:var(--dsw-alias-label-tertiary);margin:0 0 8px}
.sk-hint{font-size:var(--dsh-content-font-size-tertiary,12px);line-height:18px;color:var(--dsw-alias-label-quaternary,var(--dsw-alias-label-tertiary));margin:8px 0 0}
.sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.sk-tile{position:relative;display:block;width:100%;padding:0;text-align:left;cursor:pointer;overflow:hidden;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);background:0 0;font:inherit;color:var(--dsw-alias-label-primary)}
.sk-tile:hover{border-color:var(--dsw-alias-border-l4)}
.sk-tile[data-on]{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}
.sk-tile:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.sk-tile[disabled]{opacity:.45;cursor:default}
.sk-swatch{display:block;height:66px;background-size:cover}
.sk-tileText{display:flex;flex-direction:column;gap:1px;padding:9px 11px}
.sk-tileName{font-size:var(--dsh-content-font-size-secondary,13px);line-height:20px}
.sk-tileHint{font-size:var(--dsh-content-font-size-tertiary,11px);line-height:16px;color:var(--dsw-alias-label-tertiary)}
.sk-seg,.sk-seg::before,.sk-segBtn,.sk-switch,.sk-knob{corner-shape:round}
.sk-seg{display:inline-flex;max-width:100%;flex-wrap:wrap;gap:2px;padding:2px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);position:relative;isolation:isolate}
.sk-seg[data-sk-seg]::before{content:'';position:absolute;left:0;top:2px;height:28px;width:var(--sk-seg-width);transform:translateX(var(--sk-seg-x));transform-origin:0 50%;border-radius:999px;z-index:-1;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.025) 52%,rgba(var(--sk-glow),.12)),var(--dsw-alias-button-elevated-fill);box-shadow:inset 0 var(--sk-edge-top,1px) 0 rgba(255,255,255,var(--sk-edge-strong,.28)),inset 0 0 0 var(--sk-edge-width,.5px) rgba(255,255,255,var(--sk-edge-soft,.16));transition:background-color 140ms cubic-bezier(.2,0,0,1)}
.sk-seg[data-sk-seg] .sk-segBtn[data-on]{background:transparent}
.sk-page{animation:sk-settings-appear 250ms cubic-bezier(.16,1,.3,1) both}
@keyframes sk-settings-appear{from{opacity:0;translate:0 3px}to{opacity:1;translate:0 0}}
@media(prefers-reduced-motion:reduce){.sk-page{animation:none!important}.sk-seg[data-sk-seg]::before,.sk-switch,.sk-knob{transition:none!important}}
.sk-material .sk-row{flex-wrap:wrap;gap:12px}
.sk-material .sk-rowText{flex:1 1 250px;padding-right:0}
.sk-material .sk-seg{flex:none}
.sk-segBtn{white-space:nowrap;flex-shrink:0;height:28px;padding:0 15px;border:none;border-radius:999px;cursor:pointer;background:0 0;font:inherit;font-size:var(--dsh-content-font-size-secondary,13px);line-height:28px;color:var(--dsw-alias-label-tertiary)}
.sk-segBtn:hover{color:var(--dsw-alias-label-primary)}
.sk-segBtn[data-on]{background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary)}
.sk-segBtn:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.sk-seg[data-off] .sk-segBtn{opacity:.45;cursor:default}
.sk-acknowledgements{overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:1.7}
.sk-acknowledgements summary{cursor:pointer;padding:6px 0;color:var(--dsw-alias-label-primary)}
.sk-acknowledgements h2{font-size:inherit;margin:16px 0 6px;color:var(--dsw-alias-label-primary)}
.sk-acknowledgements p{margin:6px 0}.sk-acknowledgements ul{padding-left:20px;columns:2;column-gap:24px}
.sk-acknowledgements li{break-inside:avoid;margin:4px 0}.sk-acknowledgements a{color:var(--sk-link-ink,var(--dsw-alias-label-link));text-decoration:underline;text-underline-offset:3px}
@media(max-width:650px){.sk-acknowledgements ul{columns:1}}
`

        /* Preserve matched rules while changing recipes. Each installation owns
         * its bounded template cache; unloading releases it explicitly. */
        function createSkinSheetUpdater () {
            const templates = new Map()
            const ruleKey = rule => [rule.type, rule.selectorText, rule.keyText, rule.name, rule.conditionText].join('|')
            const patchRules = (parent, next) => {
                for (let i = 0; i < next.length; i++) {
                    const desired = next[i], key = ruleKey(desired)
                    if (!parent.cssRules[i] || ruleKey(parent.cssRules[i]) !== key) {
                        // CSSRuleList is live. Search it directly, without copying
                        // the whole list for every inserted or reordered rule.
                        let found = -1
                        for (let j = i + 1; j < parent.cssRules.length; j++) {
                            if (ruleKey(parent.cssRules[j]) === key) { found = j; break }
                        }
                        if (found < 0) parent.insertRule(desired.cssText, i)
                        else for (let j = i; j < found; j++) parent.deleteRule(i)
                    }
                    const rule = parent.cssRules[i]
                    if (rule.style && rule.style.cssText !== desired.style.cssText) rule.style.cssText = desired.style.cssText
                    else if (rule.cssRules && typeof rule.insertRule === 'function') patchRules(rule, desired.cssRules)
                    else if (rule.cssText !== desired.cssText) { parent.deleteRule(i); parent.insertRule(desired.cssText, i) }
                }
                while (parent.cssRules.length > next.length) parent.deleteRule(next.length)
            }
            const update = (tag, css) => {
                if (!css || !tag.sheet?.cssRules?.length || typeof CSSStyleSheet === 'undefined' ||
                    typeof CSSStyleSheet.prototype.replaceSync !== 'function') { tag.textContent = css; return }
                try {
                    let template = templates.get(css)
                    if (!template) {
                        template = new CSSStyleSheet()
                        template.replaceSync(css)
                    } else templates.delete(css)
                    templates.set(css, template)
                    while (templates.size > 8) templates.delete(templates.keys().next().value)
                    patchRules(tag.sheet, template.cssRules)
                } catch (_) {
                    // Unsupported rule editing still installs the whole stylesheet,
                    // including after a partially applied patch.
                    tag.textContent = css
                }
            }
            update.clear = () => templates.clear()
            return update
        }

        /** Install one style tag and return its disposer. */
        function installStyle (tagId, css) {
            const tag = document.createElement('style')
            tag.dataset.plugin = 'dsh-plugin-skins'
            tag.dataset.pluginCss = tagId
            tag.textContent = css
            document.head.append(tag)
            return () => tag.remove()
        }

        /* The desktop preload observes body style to remeasure caption colours.
         * Own only this token; preserve an existing value and any later writer. */
        function createWindowChromeNotifier (ctx) {
            const name = '--dsh-skins-tick', style = document.body.style
            if (!style || typeof style.getPropertyValue !== 'function' ||
                typeof style.getPropertyPriority !== 'function' || typeof style.removeProperty !== 'function') return () => {}
            const previous = style.getPropertyValue(name), priority = style.getPropertyPriority(name)
            let tick = 0, written = null
            ctx.effect(() => () => {
                if (written === null || style.getPropertyValue(name) !== written) return
                if (previous) style.setProperty(name, previous, priority)
                else style.removeProperty(name)
            }, 'skins: caption token')
            return () => {
                try {
                    const value = String(++tick)
                    style.setProperty(name, value)
                    written = value
                } catch (_) { /* Native caption refresh is optional. */ }
            }
        }
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

// Settings reference links; canonical list: docs/SOURCES.md.
const SK_REFERENCES = [
    [
        "Google: Optimize Interaction to Next Paint / 优化交互到下一次绘制",
        "https://web.dev/articles/optimize-inp"
    ],
    [
        "Apple Meet Liquid Glass",
        "https://developer.apple.com/videos/play/wwdc2025/219/"
    ],
    [
        "W3C Filter Effects",
        "https://www.w3.org/TR/filter-effects-1/#feDisplacementMapElement"
    ],
    [
        "shuding/liquid-glass.js",
        "https://github.com/shuding/liquid-glass/blob/main/liquid-glass.js"
    ],
    [
        "rdev/index.tsx",
        "https://github.com/rdev/liquid-glass-react/blob/master/src/index.tsx"
    ],
    [
        "web.dev 动画指南",
        "https://web.dev/articles/animations-guide"
    ],
    [
        "项目",
        "https://github.com/shuding/liquid-glass"
    ],
    [
        "Skia 官方位移滤镜源码",
        "https://github.com/google/skia/blob/main/src/effects/imagefilters/SkDisplacementMapImageFilter.cpp"
    ],
    [
        "W3C Filter Effects §9.4",
        "https://www.w3.org/TR/filter-effects-1/#FilterPrimitiveSubRegion"
    ],
    [
        "Google避免布局抖动",
        "https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing"
    ],
    [
        "MDN replaceSync",
        "https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync"
    ],
    [
        "MDN减少动画",
        "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion"
    ],
    [
        "Apple材质设计入口",
        "https://developer.apple.com/design/human-interface-guidelines/materials"
    ],
    [
        "web.dev渲染性能",
        "https://web.dev/articles/rendering-performance"
    ],
    [
        "MDN contain",
        "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain"
    ],
    [
        "Apple Motion",
        "https://developer.apple.com/design/human-interface-guidelines/motion"
    ],
    [
        "Alex Harri流动渐变解析",
        "https://alexharri.com/blog/webgl-gradients"
    ],
    [
        "其实际shader源码",
        "https://github.com/alexharri/website/blob/eb9551dd73126857045035b378b194dbf923c675/src/components/WebGLShader/shaders/fragment/final.ts"
    ],
    [
        "Apple noiseField",
        "https://developer.apple.com/documentation/spritekit/skfieldnode/noisefield%28withsmoothness%3Aanimationspeed%3A%29"
    ],
    [
        "Apple Agents/Goals",
        "https://developer.apple.com/library/archive/documentation/General/Conceptual/GameplayKit_Guide/Agent.html"
    ],
    [
        "Apple Immersive experiences",
        "https://developer.apple.com/design/human-interface-guidelines/immersive-experiences/"
    ],
    [
        "Apple Layout",
        "https://developer.apple.com/design/human-interface-guidelines/layout"
    ],
    [
        "Fluent 2 Layout",
        "https://fluent2.microsoft.design/layout"
    ],
    [
        "Color",
        "https://developer.apple.com/design/human-interface-guidelines/color"
    ],
    [
        "MDN updatePlaybackRate",
        "https://developer.mozilla.org/en-US/docs/Web/API/Animation/updatePlaybackRate"
    ],
    [
        "MDN feImage",
        "https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feImage"
    ],
    [
        "superellipse",
        "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse"
    ],
    [
        "CSS Borders 4",
        "https://drafts.csswg.org/css-borders-4/"
    ],
    [
        "wave-gradient真实开源顶点着色器",
        "https://github.com/sa3dany/wave-gradient/blob/main/packages/wave-gradient/src/shaders/.vert"
    ],
    [
        "W3C Filter Effects",
        "https://www.w3.org/TR/filter-effects-1/"
    ],
    [
        "Adobe Color Wheel",
        "https://www.adobe.com/express/learn/blog/color-wheel-explained"
    ],
    [
        "Nintendo官方探险手册",
        "https://play.nintendo.com/applications/3040/downloads/zelda-totk-explorers-journal-link.pdf"
    ],
    [
        "官方实现说明",
        "https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md"
    ],
    [
        "npm bundleDependencies",
        "https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bundledependencies"
    ],
    [
        "W3C SVG坐标规范",
        "https://www.w3.org/TR/SVG2/coords.html"
    ],
    [
        "绘制规范",
        "https://www.w3.org/TR/SVG2/painting.html"
    ],
    [
        "feImage规范",
        "https://www.w3.org/TR/filter-effects-1/#feImageElement"
    ],
    [
        "rdev/liquid-glass-react",
        "https://github.com/rdev/liquid-glass-react"
    ],
    [
        "用户提供的掘金文章",
        "https://juejin.cn/post/7514618352829448244"
    ],
    [
        "MoonGlassKitty/liquid-glass-html",
        "https://github.com/MoonGlassKitty/liquid-glass-html"
    ],
    [
        "PBRT Specular Reflection and Transmission",
        "https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission"
    ],
    [
        "MDN WebGPU API",
        "https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API"
    ],
    [
        "Harness localized plugin metadata / 插件本地化元数据",
        "https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-package.md"
    ],
    [
        "Harness plugin manager UI / 插件管理界面",
        "https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plugin-manager/README.md"
    ],
    [
        "Harness locale API / 本地化接口",
        "https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/locale/README.md"
    ],
    [
        "Standard Schema",
        "https://github.com/standard-schema/standard-schema"
    ]
]
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
		/* These are geometry mirrors, not a second layout controller. The host
		 * owns panel widths, inline grids, scroll positions and sticky positioning.
		 * Store every property we add so off/unload returns the original DOM. */
        // The settings host has no custom-icon option; mark only our nav row.
        function createSettingsGlyph(ctx) {
            const marked=new Set(),label=()=>ctx.locale.bind(NS)('nav')
            let panel=null,queued=0
            const sync=()=>{
                queued=0
                const current=document.querySelector(SETTINGS_PANEL)
                if(current!==panel){navObserver.disconnect();panel=current;if(panel)navObserver.observe(panel.querySelector('nav')||panel,{childList:true,subtree:true,characterData:true})}
                for(const row of marked)if(!row.isConnected){marked.delete(row)}
                for(const row of panel?.querySelectorAll("button[class*='_navCell']")||[]){
                    const skin=row.textContent.trim()===label()
                    if(skin&&!row.hasAttribute('data-sk-settings-glyph')){row.setAttribute('data-sk-settings-glyph','');marked.add(row)}
                    if(!skin&&marked.has(row)){row.removeAttribute('data-sk-settings-glyph');marked.delete(row)}
                }
            }
            const schedule=()=>{if(!queued)queued=requestAnimationFrame(sync)}
            const navObserver=new MutationObserver(schedule),bodyObserver=new MutationObserver(schedule)
            bodyObserver.observe(document.body,{childList:true})
            const offLocale=ctx.locale.subscribe(schedule)
            const path='M12 3a9 9 0 1 0 0 18h1.4a2.2 2.2 0 0 0 1.5-3.8 1.6 1.6 0 0 1 1.1-2.8h1a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z'
            const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/><circle cx="7.5" cy="10" r=".9" fill="white" stroke="none"/><circle cx="11" cy="7" r=".9" fill="white" stroke="none"/><circle cx="15.5" cy="8" r=".9" fill="white" stroke="none"/></svg>`
            const style=document.createElement('style');style.dataset.pluginCss='dsh-plugin-skins/nav-icon.css'
            style.textContent=`[data-sk-settings-glyph]>svg{display:none!important}[data-sk-settings-glyph]::before{content:'';width:16px;height:16px;flex:none;background:currentColor;mask:url("data:image/svg+xml,${encodeURIComponent(svg)}") center/contain no-repeat}`
            document.head.append(style);sync()
            ctx.effect(()=>()=>{cancelAnimationFrame(queued);bodyObserver.disconnect();navObserver.disconnect();offLocale();style.remove();for(const row of marked)row.removeAttribute('data-sk-settings-glyph')},'skins: settings glyph')
        }
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

		return { inject, apply }
	},
})
