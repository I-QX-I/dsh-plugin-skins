# 兼容性 / Compatibility

主要测试环境为 Windows 上的 Electron/Chromium DeepSeek Harness。macOS 和 Linux 的自动测试覆盖代码与安装包，尚未完成实机画面检查。显卡、系统缩放、远程桌面和宿主版本都可能影响显示效果。

## 安装与已有设置

安装使用当前 profile 和宿主已有权限。会话没有安装工具时，可使用官方CLI完成安装，无需更换预设。发布包携带配置校验依赖，下载的原文件可以移动或删除；仍被profile引用的受管理缓存需要保留。

已有主题和设置会保留，旧 `ocean` 主题自动映射为 `aero`。插件运行不依赖调试端口、开发机路径、远程字体或材质服务。

## 显示与功能回退

| 环境或设置 | 插件行为 |
|---|---|
| 支持SVG背景滤镜 | 使用液体玻璃折射 |
| 输入或消息表面高于240 CSS px | 使用轻量阅读材质，变短后恢复折射 |
| 不支持SVG背景滤镜 | 使用原生模糊玻璃，保留已选材质设置 |
| 不支持背景模糊 | 使用主题色背景保持文字可读 |
| 减少透明度或增强对比度 | 关闭折射，采用更易读的背景 |
| 减少动画 | 停止背景和选择动画 |
| 缺少可选浏览器接口 | 使用普通样式表、旧式监听或尺寸测量等替代方式 |
| 不支持动画调速接口 | 使用CSS时长调速，切换时可能改变动画位置 |
| 窄窗口或大字号 | 选项换行，多行按钮组使用静态选择样式 |

全透为实验选项，明亮或复杂背景可能影响阅读。折射厚度使用曲面近似，并非物理光线追踪。部分缩放比例下，细线经过圆角仍可能出现像素断续。

目前检查过DPR 1、1.25、1.375、1.5和2，以及软件渲染、两种材质、浅深色和系统显示偏好。实机检查覆盖本机DPR 1.1和1.375；模拟缩放与软件渲染测试不能代表所有显卡。

## 宿主更新

插件依赖Harness的模块加载、设置和本地化接口，也使用部分DOM属性、CSS模块和主题变量。宿主更新这些接口或布局时，可能需要适配。

更新后建议检查设置入口、主题和材质、长文滚动、窗口缩放、偏好保存，以及关闭和卸载后的恢复情况。维护代码的位置见 [架构说明](ARCHITECTURE.md)，试装步骤见 [设备检查清单](../TEST-OTHER-DEVICE.md)。

## English

Real-device checks primarily cover DeepSeek Harness on Windows with Electron/Chromium. macOS and Linux CI covers code and package portability; their visuals have not been checked on physical devices. GPU, display scale, remote sessions and host versions can affect rendering.

Installation uses the current profile and host permissions. If the conversation lacks an installation tool, the official CLI is available as a fallback. Release packages include the required configuration dependencies. The original download can be moved or deleted; keep the managed cache while a profile references it. Existing preferences are preserved, and the retired `ocean` theme maps to `aero`.

Liquid glass falls back to native frosted glass when SVG filters are unavailable. Inputs and messages taller than 240 CSS px use lightweight glass. Reduced motion, reduced transparency and stronger contrast settings are respected. Older browsers use alternative listeners, stylesheets or measurements where needed. Without the playback-rate API, changing speed may shift the animation position.

Pure transparency is experimental and may reduce readability. Refraction is an approximation, and fine lines can have pixel discontinuities at corners under some display scales. Simulated DPR and software rendering checks do not cover every GPU.

After a host update, check Settings, themes, glass, long-text scrolling, resizing, saved preferences and cleanup when disabled or uninstalled. Host API or layout changes may require a plugin update.
