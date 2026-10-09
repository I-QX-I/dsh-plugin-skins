# 架构 / Architecture

`index.js` 注册配置、客户端和语言文件；宿主加载构建生成的 `client.js`。客户端源码分为18个文件，由 `src/client/parts.json` 指定顺序，构建时插入 `runtime.template.js`。这些文件共用工厂作用域。

主题、颜色计算、材质、样式、设置页、偏好、背景、折射和动画分别维护。文件说明见 [客户端源码](../src/client/README.md)。选择器和材质配方集中定义，运行时无需相对导入。

折射更新先读取几何信息，再提交样式。滚动时复用候选表面列表，结构或状态变化时重新检查。高度超过240 CSS px的输入和消息表面使用轻量阅读材质。移动与静止状态共用轮廓和材质；高光与折射厚度分别控制。

背景由底色、两个流动色场和五个固定尺寸的平面光球组成，主要通过 `transform` 和 `opacity` 动画更新。偏好即时显示、按顺序保存；旧 `ocean` 主题映射到 `aero`。关闭或卸载时清理样式、镜片、事件和观察器，恢复宿主外观。

`INSTALLER.mjs` 校验归档和包身份，将归档保存到以SHA-256命名的缓存；ZIP中的 `INSTALL.mjs` 校验内包哈希。正式安装由宿主插件管理器或官方CLI完成。发布包携带三项依赖和相应许可证。

The host loads a single generated client file. Eighteen source files share a factory scope, with themes, styles, settings, preferences, background motion and optics maintained separately.

Geometry reads precede style writes. Cached surface lists reduce scroll work, and tall inputs/messages use lightweight glass. Preferences update immediately and save in order. Disabling or unloading the plugin removes its styles, listeners and observers.

Installation helpers validate archives and stage them in a stable cache. The host manager or official CLI performs installation. Required dependencies and their licenses are included in release packages.
