# 贡献 / Contributing

感谢贡献。先提交 issue 描述宿主版本、系统、DPR、主题与复现步骤，截图须去除私人信息。修改对应 src/client 职责，再执行 npm run build 与 npm test。

保持独立插件性质与旧偏好；不要修改宿主、发送测试消息、添加追踪、远程执行或静默联网功能。减少动画、关闭/卸载、能力回退和长文阅读均需保留。材质和移动改动需真实窗口的动静画面对照，性能改动需同场景对照数据，不能仅凭 CI 宣称验收。默认配色改动应附九主题对照。提交 PR 清楚说明变化、验证和限制。开发协作工具可如实记录，不虚构贡献者。

Please keep the independent plugin lifecycle, existing preferences, reduced motion, fallbacks and long-text behavior. Edit source modules, rebuild and test. Real-window before/after frames are required for optical changes; comparable measurements for performance changes. Remove private data from bug reports. Include validation and limits in pull requests.
