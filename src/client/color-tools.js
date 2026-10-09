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
