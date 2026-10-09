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

