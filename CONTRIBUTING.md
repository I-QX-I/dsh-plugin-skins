# 参与贡献 / Contributing

欢迎反馈问题、改进配色或提交代码。

## 反馈问题

请在 [Issues](https://github.com/I-QX-I/dsh-plugin-skins/issues) 中说明 Harness 版本、操作系统、屏幕缩放比例、所用主题，以及问题出现的步骤。附上截图或短视频会更方便排查，上传前请隐藏账号、聊天内容等私人信息。

## 提交修改

客户端源码位于 `src/client/`，修改后运行：

```sh
npm run build
npm test
```

提交 Pull Request 时，请说明改了什么、为什么修改，以及做过哪些检查。配色、玻璃或动效的调整请附前后对照；性能优化请提供相同操作下的测量结果。

请保留已有设置，以及关闭、卸载、减少动画和长文阅读功能。插件只负责外观，修改应尽量局限在插件内部。涉及宿主兼容性的改动，还需要在实际 Harness 窗口中检查。

## Reporting issues

Open an [issue](https://github.com/I-QX-I/dsh-plugin-skins/issues) with your Harness version, operating system, display scale, theme and steps to reproduce the problem. Screenshots or short recordings help; hide account details and private conversations before uploading.

## Sending changes

Edit `src/client/`, then run `npm run build` and `npm test`. In your pull request, explain the change, its purpose and how you checked it. Include before-and-after images for visual changes, or measurements under the same conditions for performance work.

Keep existing preferences, disable/uninstall support, reduced motion and long-text behavior. Changes should stay within the appearance plugin wherever possible. Check host compatibility in a running Harness window as well as in automated tests.
