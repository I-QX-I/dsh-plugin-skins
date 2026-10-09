# 玻璃皮肤 · Glass Skins

DeepSeek Harness 独立皮肤插件。九款配色，液体玻璃与模糊玻璃，可随时关闭或卸载。

[English](README.en.md) · [下载](https://github.com/I-QX-I/dsh-plugin-skins/releases/latest) · [更新记录](CHANGELOG.md)

## 实机预览

![Aero 主题实机动态预览](docs/assets/aero-live.webp)

Aero 液体玻璃，真实界面录制，自动循环。[静态截图](docs/assets/aero-window.png) · [录制说明](docs/PREVIEW.md)

<details>
<summary>查看输入区玻璃细节</summary>

![输入区玻璃与背景运动：实机录屏局部](docs/assets/glass-detail.webp)

同一段录屏的输入区局部，观察背景透过玻璃时的变化。

</details>

## 安装

将下面一行发到 DeepSeek Harness 对话：

```text
请安装并启用玻璃皮肤插件：https://github.com/I-QX-I/dsh-plugin-skins/releases/download/v2.6.3/glass-skins.zip；按包内 AI-INSTALL.md 执行，沿用当前 profile，保留已有偏好。
```

也可以[下载 glass-skins.zip](https://github.com/I-QX-I/dsh-plugin-skins/releases/download/v2.6.3/glass-skins.zip)，拖进对话后说「安装这个插件」。请使用 Release 安装包，不是 Source code ZIP。安装使用宿主插件管理器或官方 CLI，遵守宿主权限。

入口：**设置 → 皮肤**。新安装使用 Aero 液体玻璃预设，升级保留已有选择。原下载可移动或删除，宿主管理的安装缓存应保留。

## 主题与材质

Aero · 极光 · 石墨 · 凤凰 · 翠岚 · 火焰 · 青境 · 玫瑰石英 · 琥珀

- 液体玻璃、模糊玻璃；高光与折射厚度独立调节。
- 渐变流动、光球漂移、色彩区分度、透明度与光感可调。
- 长输入和长消息采用轻量阅读材质，不改消息行为。
- 中英文、宿主浅深色、减少动画及能力回退。

## 兼容性

主要在 Windows Electron/Chromium Harness 完成实机验证；macOS/Linux 尚无实机视觉验收。宿主更新可能需要适配。极细圆角存在部分 DPR 下的像素边界，「全透」为实验选项；详情见[兼容说明](docs/COMPATIBILITY.md)与[测试清单](TEST-OTHER-DEVICE.md)。

插件不修改宿主可执行文件、账号、模型、聊天或其他插件。

## 开发

JavaScript，CSS 嵌入客户端模块。Node.js 22+：

```sh
npm ci
npm run build
npm test
```

编辑 `src/client/`，构建生成 `client.js`。[架构](docs/ARCHITECTURE.md) · [贡献指南](CONTRIBUTING.md) · [验证记录](docs/VALIDATION.md) · [安全问题](SECURITY.md)

## 致谢与许可

[开发贡献](CREDITS.md) · [设计与技术参考](docs/SOURCES.md) · [第三方许可](NOTICE.md)

Copyright © 2026 爱伦提卡。[MIT](LICENSE)，允许使用、修改和商业分发，保留版权、来源与许可声明。本项目非 DeepSeek 或 Apple 官方产品。

---

[![请我喝杯咖啡](https://img.shields.io/badge/☕_请我喝杯咖啡-FFDD00?style=for-the-badge&labelColor=FFDD00&color=FFDD00)](https://afdian.com/a/alantica)

自愿支持，不影响功能或使用权限。
