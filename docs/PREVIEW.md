# 实机预览 / Live previews

首页动画采集自实际运行的 Windows DeepSeek Harness（Aero 液体玻璃、中文宿主界面），通过本机调试端口录制真实渲染帧。没有离线仿制界面、模拟光球轨迹、聊天素材或宣传片。

动画按采集时间重采样为 16 fps，缩至 1080 像素宽并编码为自动循环的 WebP（约 13.6 秒、5.2 MB）。输入区近景来自同一段录屏。循环衔接采用 0.4 秒交叉淡化；这属于预览剪辑，不是宿主动画逻辑。录屏有采集开销，不作为性能测量或跨设备流畅度保证。静态 PNG 保留用户提供的原图。

The homepage animation records the running Windows DeepSeek Harness app with Aero liquid glass and the host UI in Chinese. Frames come from the local debugging connection, without a reconstructed interface, simulated light trajectories, conversations or a promotional film.

Frames are resampled using capture timestamps to 16 fps, scaled to 1080 pixels wide and encoded as a looping WebP (about 13.6 seconds, 5.2 MB). The input-area detail uses the same recording. A 0.4-second crossfade joins the loop; it is a preview edit, not host animation behavior. Capture overhead makes the recording unsuitable as a performance measurement or cross-device guarantee. The still PNG preserves the original user-supplied screenshot.

`themes-settings.png` 与 `material-settings.png` 为同一宿主的原始渲染截图，分别展示九款主题的选择卡片，以及背景动效和玻璃细调。采集时只滚动设置页面，没有切换主题或修改偏好。主题选择卡片不是九款主题的整窗效果对照。

`themes-settings.png` and `material-settings.png` are original renderer screenshots from the same host, showing the nine theme selectors and the background/glass controls. Capture only scrolled the settings page; themes and preferences were left unchanged. Theme selector swatches are not full-window comparisons of all nine themes.
