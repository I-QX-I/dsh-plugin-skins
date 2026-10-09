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
