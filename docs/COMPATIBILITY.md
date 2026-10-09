> Public release: [v2.6.3](https://github.com/I-QX-I/dsh-plugin-skins/releases/tag/v2.6.3).

# 兼容与宿主升级维护

阶段42新增：媒体查询监听统一兼容现代 addEventListener、旧式 addListener 和接口缺失，并在卸载时成对解除。七个隔离浏览器能力场景验证启动与清理；增强对比度变化关闭光学、恢复后重建，背景速度变化保留相位。实际分发测试携带三项 MIT 依赖，不要求目标电脑下载 schema；独立安装的 Config 与当前宿主 schema 实例互操作通过，十二字段及新主题默认/指定值正确。未来 schema 的破坏性升级仍须复验。

安装缓存独立于下载文件位置，支持空格/中文文件名与 DSH_HOME；安装仅用缓存 spec。隔离空 profile、全新 pnpm store 在离线条件下安装和移动原下载后的重装通过，未声称在所有默认 Harness 配置中跑过 AI 安装流程。工具权限不足由宿主决定，插件不会擅自更改权限或安装其他工具。

阶段40主题兼容：原五主题 id 保留，退役 ocean 由客户端存储入口映射到 aero，旧配置无需手动清理。新增 teal 沿用字符串 Config 字段，不新增后端 schema、重启要求或运行时资源依赖。新的蓝绿、玫瑰、琥珀配色沿用原有动画预算与材质回退；鲜艳的背景不等于所有透明档在任意背景都满足固定对比度。

本插件只调整外观。运行时保持单个客户端文件，不依赖开发机路径、CDP、测试浏览器、远程字体或材质服务。开发测试中的本机路径不属于安装依赖。

## 能力回退

| 条件 | 当前行为 | 验证边界 |
|---|---|---|
| 支持 SVG URL 背景滤镜 | 使用缓存图集和真实 SourceGraphic 折射 | 支持语法不代表所有 GPU 都有同样精度或成本 |
| 输入卡片或消息气泡高于 240 CSS px | 释放该表面的 SVG 折射，使用原档位原生玻璃和弱亮边；变短后恢复 | 所有 DPR 使用 CSS 尺寸；不改保存的材质、内容或背景动效，其他控件保持原材质 |
| 不支持 SVG URL 背景滤镜语法 | 不安装光学镜片，保留原生模糊和轮廓 | 不修改用户保存的材质选择 |
| 不支持背景模糊 | CSS 支持条件内回退到主题实色阅读底 | 需在目标宿主复查最终计算样式 |
| 减少透明度或增强对比度 | 关闭光学并应用可读性回退 | 不靠检测显卡型号猜测用户需要 |
| 减少动画 | 停止背景和选择动画，释放活动轨迹 | 偏好实时变化也应生效 |
| 没有 IntersectionObserver | 使用代码标题的测量回退 | 长代码滚动成本可能提高 |
| 没有 ResizeObserver | 保留结构、窗口 resize 和滚动更新 | 非窗口引起的尺寸变化需要目标环境复核 |
| 没有构造样式表或 replaceSync | 完整安装普通 style 文本 | 不反复触发异常尝试构造样式表 |
| CSSOM 局部编辑失败 | 安装整份目标 CSS，包括部分编辑已发生的情况 | 外观完整性优先于增量更新收益 |
| 原生标题栏通知接口不可用 | 跳过可选通知，皮肤继续运行 | 不修改窗口控件或宿主安装 |

当前已有五种离线 DPR（1 / 1.25 / 1.375 / 1.5 / 2）、软件渲染场景、两种材质、浅深宿主外观和系统偏好验证；真实宿主已验证本机 DPR 1.1 和 1.375。软件渲染启动参数和 DPR 仿真不能代替另一台物理电脑，也不证明 macOS/Linux 已实测。

## 宿主依赖契约

| 依赖 | 所在维护职责 | 更新风险与处理 |
|---|---|---|
| ModuleLoader、React require、ctx.effect、locale、slots、configForms | runtime.template、setup、settings、preference、lifecycle | 属于宿主插件 API；若不兼容，停用插件并适配，不能以假服务覆盖宿主 |
| --dsw-* 色彩与几何 tokens | skin-styles、recipes-and-selectors | 优先使用宿主 tokens；检查 token 改名后的计算值和可读性 |
| data-composer-card、data-slot、data-dockkit-tab、ARIA 状态 | recipes-and-selectors、geometry-and-motion、optics | 保留语义结构限定，不用宽泛匹配把祖先误当控件 |
| BynINW_* 布局和若干 CSS module 家族 | skin-styles、geometry-and-motion | 哈希前缀及 DOM 结构可能变化；核对真实 DOM 后局部适配，不能承诺免维护 |
| body 的 data-ds-dark-theme | lifecycle | 只观察，不更改宿主外观偏好 |
| 原生标题栏对 body style 的观察 | style-installation | 可选兼容路径；通知 token 按实例记录和恢复原值，其他写入者的新值不覆盖 |

选择器共享定义已集中在 recipes-and-selectors；专用布局 CSS 仍存在宿主依赖。17 个职责片段继续处于同一工厂，颜色计算与样式更新器已收窄作用域，但不能把拆文件称为完全独立模块。历史测试中还存在源码切片和绝对路径，后续维护应逐步迁移，禁止为重构通过而弱化断言。

## 更新后的必要验收

1. 保存当前源码、偏好与可回退版本；核对构建一致性，不修改宿主安装文件。
2. 检查真实 DOM 与上述契约，再运行离线回归；不以旧夹具全部通过代替宿主验证。
3. 检查首次启用、设置、九主题、材质、系统偏好、快速反选、滚动和右栏尺寸变化。对照原生点击区域、文字、圆角与读字。
4. 验证关闭和重新开启；在隔离环境验证卸载。样式、镜片、监听器、观察器、定时器、缓存与自有 token 应清理，用户配置和宿主属性保留。
5. 在可见真实窗口测量显示提交、输入响应和主线程长帧；记录尺寸、DPR、渲染器及测量负载。RAF 与实际呈现分别报告。

已接受边界：部分背景细直线在圆角仍可能有像素断续；全透属于实验材质。修复宿主兼容时不顺带改变曝光、模糊、动画速度或用户选择。

## 性能和设计维护原则

保持读写分批、相关变化才发现表面、滚动轻量路径、有限缓存和明确 disposer。背景运动与选择轨迹以 transform/opacity 为主；不逐帧改变模糊，不全页截图采样，不按每帧重烘焙。避免无测量地增加 will-change 或合成层，不在交互时冻结背景。

装饰服从内容阅读，选中状态与原生点击区域一致；沿用弱亮边、克制阴影和主题层次。更贵的折射不自动意味着更高级，采用方案必须同时通过画面对照与实际成本验证。

参考资料：[Google 高性能动画](https://web.dev/articles/animations-guide)、[Google 避免布局抖动](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)、[MDN 构造样式表更新](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync)、[MDN 减少动画](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)、[Apple 材质设计](https://developer.apple.com/design/human-interface-guidelines/materials)。资料用于核对原则，产品取舍以本插件实际画面和数据为准，不声称网页与原生管线等效。

## 新增参数的回退与边界

- 不支持 Animation.updatePlaybackRate：渐变和光球使用对应的 CSS 时长；再次调速可能改变当前相位。现代接口保留位置。
- 减少动画：CSS 停止场景；恢复动画后重新应用已保存速度。背景动效关闭时，速度和色彩流动选项禁用但保留选择。
- 无液体折射能力：继续原生磨砂回退，不伪称厚度仍产生光学变化。
- 窄窗口/大字号：选项自然换行，多行选择组禁用单行移动镜片。
- 厚度采用有界肩部/弯折近似，不是物理光线追踪；长段落仍优先轻量材质。
- 新增 Config 字段需由宿主加载新插件 schema。运行中旧模块缓存不是宿主升级保证，重启后仍需核对保存值。

当前宿主全局使用 superellipse(1.5)；液体玻璃图集是普通圆弧。仅对活动且已经安装 SVG 的玻璃表面/对应伪元素/输入卡片，插件将 corner-shape 统一为 round，半径仍取原 tokens。旧浏览器忽略不支持的属性，原生圆弧继续适配。关闭皮肤或释放镜片后恢复宿主轮廓；长阅读面的原生材质继续采用宿主轮廓。未来宿主若增加独立 mask、非等角半径或新的裁切路径，需要重新检查实际轮廓，不能仅检查 border-radius 数值。


阶段39新增验证：颜色速度现代updatePlaybackRate保留相位；缺少该接口时CSS duration回退。两个色场按3窗口比例×DPR 1/1.375/2检测闭合、接点速度和纹理覆盖，八主题×色差档与五球固定尺寸保留。设置单层native阅读玻璃不依赖角区SVG滤镜，减少一次宿主升级时的几何/采样耦合；未知CSS corner-shape在旧浏览器中忽略，其他原生回退保持。软件DPR测试与本机可见宿主trace不能代替不同物理GPU、远程桌面或未知未来宿主验证。宿主升级后复查插件槽/设置入口、主要玻璃映射、长文滚动、偏好存取、停用与清理，不能声称绝对零BUG。

阶段46：默认standard会话没有plugin_manager工具时，使用官方 dsh plugin --profile <当前profile> add <稳定缓存spec>，不要求用户切Creator。用户报告另一电脑rc.8经该CLI路径热加载成功，下载路径与缓存路径分离；未独立复测该电脑所有视觉功能。rc.9仅更新指南/分发ZIP，运行客户端保持rc.8。
