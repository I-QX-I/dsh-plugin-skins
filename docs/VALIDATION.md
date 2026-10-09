# 测试记录 / Test results

## 2.6.3发布检查

- 构建一致性、12项配置字段、新装默认值、已有偏好保存和旧主题迁移通过检查。
- 86项中英文键、46项参考链接，以及安装缓存、非法归档和篡改处理通过检查。
- ZIP根目录12个文件的校验和与CRC检查通过；内包包含三项依赖及其MIT许可证。
- 中文、空格、单引号路径，以及移动原下载文件后的安装和重装通过检查。
- 空profile、空pnpm store下的离线安装，本机耗时875.2 ms。这仅是包和依赖的安装时间，不包含AI处理请求的时间。

## 运行检查

本机完成过37项回归，以及两种材质、屏幕缩放、浅深色、七种能力回退和卸载清理检查。长文输入、对话滚动和窗口操作也在实际Windows宿主中检查过。

两次对话滚动采样的帧间隔中位数为11.200/11.036 ms，P95为13.501/12.239 ms，最大值为33.598/12.989 ms。结果来自本机相同场景，不代表其他设备的帧率。历史37项检查包含本地宿主快照，数量与仓库可移植测试不同。

macOS/Linux目前仅有代码和安装包的自动测试，尚未完成实机画面检查。圆角细线和全透选项的已知限制见 [兼容性](COMPATIBILITY.md)。

## English

Release 2.6.3 passed build consistency, configuration defaults and persistence, theme migration, localization, reference-link and installation checks. Archive checks cover checksums, CRC, invalid paths, tampering and bundled dependency licenses.

A clean offline profile/store installation took 875.2 ms on the test machine. This measures package installation, excluding the assistant's processing time. Chinese, spaced and apostrophe-containing paths, and reinstalling after moving the original download, were also checked.

Windows runtime checks covered glass materials, display scales, light/dark appearance, fallbacks, cleanup and long-text interaction. Two conversation-scroll samples had median frame intervals of 11.200/11.036 ms and P95 values of 13.501/12.239 ms. These are local measurements, not a cross-device frame-rate guarantee.

macOS/Linux CI covers code and package portability; physical-device visuals remain untested. See [Compatibility](COMPATIBILITY.md) for known rendering limits.
