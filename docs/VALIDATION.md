# 验证摘要 / Validation summary — 2.6.3

## 本次公开发布
- index.js 与已验收的 rc.9 逐字节一致；client.js 除新增静态制作者注释外逐字节一致，新增公开资料/许可/发布脚本，不改变实际外观。
- 公开可移植检查通过：构建一致性、12项新装默认/已有选择、旧快照回显/串行持久化/主题迁移、86项中英文键及46项参考、安装缓存/非法归档/篡改处理。
- ZIP 12项根文件，全部校验和与 CRC 通过；内层 TGZ 携带 MIT 许可证和三项依赖各自的原始许可，不含开发机文件。
- 中文/空格/单引号路径、稳定缓存与下载移动验证通过。
- 空 profile + 空 pnpm store + 离线安装耗时本机 875.2ms；载入 Config/apply、12默认字段、异实例宿主 schema 和移走下载后的离线重装通过。这是隔离包/依赖测试，不能当作用户整段 AI 安装耗时保证。

## 已接受运行时的历史验证
本地37项回归、两种材质、DPR/浅深外观、七种能力回退与清理、真实长文和窗口响应均有本地证据。历史完整诊断依赖宿主快照和机器环境；公开仓库没有分发这些快照或私有记录。

本机可见宿主对话滚动的两次测量：帧间隔中位约11.200/11.036ms，P95约13.501/12.239ms，最大33.598/12.989ms；第一次有一个超过33.34ms的帧。结果只代表同场景本机采样，不是全设备FPS保证。完整37项不等同本仓库可移植测试数量。

Real-window acceptance primarily covers Windows. macOS/Linux CI checks JS/package portability only. Different GPU/DPR, remote sessions and future Harness updates still need actual visual/response testing. Fine corner pixels and pure transparency retain the documented boundaries.
