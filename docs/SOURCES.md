# 研究资料索引 / Research reference index

- [Google: Optimize Interaction to Next Paint / 优化交互到下一次绘制](https://web.dev/articles/optimize-inp)

[贡献与致谢 / Credits](../CREDITS.md)

以下是开发过程中查阅的设计资料、技术文档和开源实现，部分方案仅用于研究。随包依赖及许可证见 NOTICE.md。

Design resources, technical documentation and open-source implementations consulted during development are listed below. Some approaches were explored but not adopted. Bundled dependencies and licenses are listed in NOTICE.md.

Apple/Fluent 用于设计层次与动效原则；开源玻璃/渐变项目用于实现对照；W3C/MDN/Skia/PBRT 用于采样、轮廓和光学语义；Google 用于真实性能；Harness/npm 用于插件与发布契约。Nintendo 和用户提供文章是历史视觉/研究入口，不分发其素材。

Design principles: Apple/Fluent. Implementation studies: open-source glass/gradient projects. Sampling and optical semantics: W3C/MDN/Skia/PBRT. Performance: Google. Plugin and release contracts: Harness/npm. Nintendo and the user-provided article are historical visual/research references; their assets are not distributed.

- [Apple Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [W3C Filter Effects](https://www.w3.org/TR/filter-effects-1/#feDisplacementMapElement)
- [shuding/liquid-glass.js](https://github.com/shuding/liquid-glass/blob/main/liquid-glass.js)
- [rdev/index.tsx](https://github.com/rdev/liquid-glass-react/blob/master/src/index.tsx)
- [web.dev 动画指南](https://web.dev/articles/animations-guide)
- [项目](https://github.com/shuding/liquid-glass)
- [Skia 官方位移滤镜源码](https://github.com/google/skia/blob/main/src/effects/imagefilters/SkDisplacementMapImageFilter.cpp)
- [W3C Filter Effects §9.4](https://www.w3.org/TR/filter-effects-1/#FilterPrimitiveSubRegion)
- [Google避免布局抖动](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [MDN replaceSync](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync)
- [MDN减少动画](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [Apple材质设计入口](https://developer.apple.com/design/human-interface-guidelines/materials)
- [web.dev渲染性能](https://web.dev/articles/rendering-performance)
- [MDN contain](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain)
- [Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Alex Harri流动渐变解析](https://alexharri.com/blog/webgl-gradients)
- [其实际shader源码](https://github.com/alexharri/website/blob/eb9551dd73126857045035b378b194dbf923c675/src/components/WebGLShader/shaders/fragment/final.ts)
- [Apple noiseField](https://developer.apple.com/documentation/spritekit/skfieldnode/noisefield%28withsmoothness%3Aanimationspeed%3A%29)
- [Apple Agents/Goals](https://developer.apple.com/library/archive/documentation/General/Conceptual/GameplayKit_Guide/Agent.html)
- [Apple Immersive experiences](https://developer.apple.com/design/human-interface-guidelines/immersive-experiences/)
- [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Fluent 2 Layout](https://fluent2.microsoft.design/layout)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [MDN updatePlaybackRate](https://developer.mozilla.org/en-US/docs/Web/API/Animation/updatePlaybackRate)
- [MDN feImage](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feImage)
- [superellipse](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/superellipse)
- [CSS Borders 4](https://drafts.csswg.org/css-borders-4/)
- [wave-gradient真实开源顶点着色器](https://github.com/sa3dany/wave-gradient/blob/main/packages/wave-gradient/src/shaders/.vert)
- [W3C Filter Effects](https://www.w3.org/TR/filter-effects-1/)
- [Adobe Color Wheel](https://www.adobe.com/express/learn/blog/color-wheel-explained)
- [Nintendo官方探险手册](https://play.nintendo.com/applications/3040/downloads/zelda-totk-explorers-journal-link.pdf)
- [官方实现说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)
- [npm bundleDependencies](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bundledependencies)
- [W3C SVG坐标规范](https://www.w3.org/TR/SVG2/coords.html)
- [绘制规范](https://www.w3.org/TR/SVG2/painting.html)
- [feImage规范](https://www.w3.org/TR/filter-effects-1/#feImageElement)
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react)
- [用户提供的掘金文章](https://juejin.cn/post/7514618352829448244)
- [MoonGlassKitty/liquid-glass-html](https://github.com/MoonGlassKitty/liquid-glass-html)
- [PBRT Specular Reflection and Transmission](https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission)
- [MDN WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Harness localized plugin metadata / 插件本地化元数据](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-package.md)
- [Harness plugin manager UI / 插件管理界面](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plugin-manager/README.md)
- [Harness locale API / 本地化接口](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/locale/README.md)
- [Standard Schema](https://github.com/standard-schema/standard-schema)

随包库的版权和许可保留在各依赖目录，版本由 DEPENDENCIES.json 记录。链接仅用于致谢和研究追溯，不下载素材、不自动联网；参考作者或机构没有为本插件背书。

Bundled libraries retain their copyright/license notices and are versioned in DEPENDENCIES.json. These links are acknowledgements and research provenance, not automatic downloads or network requests; reference authors and organizations do not endorse this plugin.
