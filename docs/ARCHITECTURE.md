# 架构 / Architecture

运行时分两部分：index.js 注册 Config、客户端和 locale；client.js 是宿主模块加载器读取的生成单文件。src/client/parts.json 列出 18 个完整职责片段，build-client.mjs 按原字节拼到 runtime.template.js 的唯一标记。各片段目前仍共享工厂作用域，不宣称完全模块隔离。

主题与设置数据、颜色计算、材质配方、样式、设置 UI、偏好存储、背景、光学发现/采样、几何运动与生命周期分开维护。详见 [源码职责](../src/client/README.md)。不要加运行时相对导入或复制选择器/配方。

光学发现先测量后提交；可见性缓存减少长会话的测量。滚动复用候选，DOM/状态变化刷新发现。高于 240 CSS px 的长文面释放全表面 SVG 镜片，保留阅读材质。移动层与静止层共用轮廓/材质，高光和折射厚度独立。背景为静态底色、两个连续色场和五个固定尺寸的平面光球，使用 transform/opacity 动效。

偏好采用乐观更新和串行保存，抵御旧快照回显；旧 ocean 迁移到 aero，不覆盖已有显式选择。关闭/卸载须清理样式、镜片、标记、观察器和事件，并恢复宿主原外观。

INSTALLER.mjs 只验证安全的 TGZ 路径/包身份并复制到 SHA256 命名的稳定缓存。ZIP 的 INSTALL.mjs 验证固定载荷哈希。它们不自行安装；宿主工具或官方 CLI 执行正式管理操作。release 构建解引用三项 MIT 依赖，携带各自许可，不分发开发环境链接。

Runtime stays in a single generated host factory. Source sections separate responsibilities without claiming full scope isolation. Geometry reads precede writes; candidate caches reduce repeated scroll discovery; long text uses lightweight reading material. Installation helpers validate and stage only; host management owns installation, rollback and removal. Public tests are portable behavioral checks and never a substitute for actual GPU/visual acceptance.
