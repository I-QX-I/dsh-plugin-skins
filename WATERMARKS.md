# 制作者标记 / Creator marks

基本署名保留在贡献致谢、MIT 版权、包作者与设置页底部。仓库首页以功能与安装为主，不重复强调制作者。

隐性标记：生成客户端的源注释包含 Attribution-ID: glass-skins.ailuntika.2026；package.json 和 CREATOR.json 记录同一制作者标识；安装 ZIP 的归档注释记录 Created by 爱伦提卡。它们在界面不额外显示，不改变渲染/输入/性能，也不含账户、设备或用户唯一标识，不发送网络请求。不是隐蔽追踪、数字签名或强制 DRM，构建工具可能移除注释。

此标记不增加 MIT 之外的许可限制。分发时保留 MIT 所要求的版权与许可文字。不得把第三方库或设计参考宣称为本项目作者原创。

Basic attribution remains in credits, the copyright/license, package author and settings footer. The repository homepage focuses on features and installation. Non-UI attribution is recorded in source comments, package metadata, CREATOR.json and the ZIP comment. All marks are static, non-tracking and impose no additional license conditions. They are not signatures or DRM.

自由使用、修改与分发；分发副本/衍生版本时，请保留 LICENSE 内的制作者版权声明、原项目链接和许可文字。界面无需增加新的强制展示规则。

Releases provide an Ed25519 public key and verification files. Private keys and private identification parameters are never distributed. Download PROVENANCE.json, PROVENANCE.sig and all listed artifacts, then run `node scripts/verify-release.mjs <artifact-directory>`. Verification checks creator provenance and artifact integrity; it does not replace a security audit.

公开发布还提供 Ed25519 制作者公钥和签名校验资料。私钥与私有识别参数不进入仓库或安装包。验证附件：`node scripts/verify-release.mjs <附件目录>`；需同时下载该版本的 PROVENANCE.json、PROVENANCE.sig 与其所列附件。署名验证不是恶意代码安全审计。
