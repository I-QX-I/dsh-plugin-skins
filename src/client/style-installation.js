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
