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
/* @client-source */		return { inject, apply }
	},
})
