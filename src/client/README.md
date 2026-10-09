# 客户端维护源码

编辑本目录，再执行 `npm run build`。宿主仍只加载根目录 `client.js`；它是生成文件，不直接维护。`npm run build:check` 和公开测试入口都会核对维护源码与生成文件，发现不同即失败。

`parts.json` 是唯一拼接顺序。`runtime.template.js` 保留宿主注册器与工厂边界，脚本在唯一的 `/* @client-source */` 标记处插入完整声明。脚本只使用 Node 内置模块，保留字节、声明顺序、工厂作用域和闭包生命周期。输出未变化时不写文件，避免触发宿主热加载；变化时先完成语法检查，再原子替换。构建输出提供源文件到生成行号的映射。

| 文件 | 维护职责 |
|---|---|
| setup.js | React、插件命名空间、样式身份、固定常量及媒体查询监听清理 |
| locales.js | 中英文设置文案 |
| themes.js | 九主题背景与光色配方 |
| recipes-and-selectors.js | 材质、透明度、开关与宿主表面选择器 |
| color-tools.js | 无外部依赖的颜色转换、场景配色及轮廓计算；六个纯函数接口 |
| work-styles.js | 工作状态动效 CSS |
| skin-styles.js | 材质与宿主适配 CSS 生成，以及对应的配方标识 |
| settings-styles.js | 皮肤设置页 CSS |
| style-installation.js | 样式增量更新、安装与原生标题栏通知 |
| preference.js | 状态存储、选择归一化、缓存与串行持久化 |
| settings.js | React 设置页与宿主注入声明 |
| work-state.js | 工作状态发现与退出计时 |
| background.js | 背景场 CSS 生成、光点解析、路径和元素复用 |
| settings-glyph.js | 设置导航图标与清理 |
| optics.js | 曲面 atlas、九宫格、分阶段测量/提交、滤镜安装、缓存与光学观察器 |
| geometry-and-motion.js | 阻尼轨迹、导航移动层、几何读取与代码裁切 |
| lifecycle.js | 启动连接、偏好快照复用、绘制与卸载 |

职责文件仍拼接到同一个宿主工厂，尚未成为隔离的 ES 模块。color-tools.js的内部计算闭合在独立作用域，公开rimShadow/accent/chromaChannels/resolve/scenePalette/sceneGradient六个纯函数；不读取偏好或主题注册表，样式与背景显式传参。不要增加运行时相对 import，也不要在多个文件重复定义配方或选择器。

目前的关键依赖：CSS 生成读取主题、材质、选择器及颜色工具；设置页和持久化共用选择归一化；光学和几何共用表面选择器，二者通过 `refresh` / `afterSync` 连接；生命周期负责创建各服务、订阅选择和清理。后续继续收窄其它共享依赖和样式区域；每步独立验证行为，避免同时改光学或动画。

可用 `node scripts/build-client.mjs --out=绝对文件路径` 生成离线候选，不覆盖当前安装。源文件必须是完整的声明，单片段与完整输出都会做语法检查。不要在片段顶层引入新的立即副作用。

样式更新器由 createSkinSheetUpdater 创建，规则匹配、递归更新和最多八份模板缓存封闭在每个安装实例内；生命周期明确释放缓存。原生标题栏通知同样按实例拥有 token，卸载恢复原值与优先级，并保留其他写入者的后续修改。兼容分支与宿主升级契约见 [兼容维护](../../docs/COMPATIBILITY.md)。

阶段45新增纯参考数据 acknowledgements.js（共18职责）；全部46链接与随包 SOURCES.md 一致性检查，设置使用原生details，不自动联网。optics缓存仅用于滚动成员列表，结构/选择/尺寸变化完整刷新，清理时释放。
