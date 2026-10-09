若用户提供发布链接，先下载其指向的 glass-skins.zip 与同一发布的 SHA256SUMS.txt，核对 ZIP SHA-256。只下载 Releases 成品，不克隆源码，不选 GitHub Source code ZIP。网络或审批不可用时简短报告，不改代理/权限；可以提示用户上传同一个 ZIP。校验通过再按下文执行。

# 安装此附件 / Install this attachment

这是爱伦提卡制作的 DeepSeek Harness 独立玻璃皮肤插件安装包。用户请求安装时，直接完成以下流程；不要求用户手工解压、选择通道、切换预设或运行命令。沿用当前 profile 和既有权限，不改其他插件、账号、模型或聊天。

## 最短安装流程

1. ZIP：只解出根目录安装说明、INSTALL.mjs、INSTALLER.mjs 和 plugin.tgz，到临时目录。不要展开或研究客户端源码。TGZ：只读 package.json、AI-INSTALL.md，提取 package/INSTALLER.mjs。
2. 使用宿主已有 Node 执行 ZIP 的 INSTALL.mjs（无额外参数）；TGZ 则执行 INSTALLER.mjs <归档真实路径>。所有路径作为独立参数，正确保留空格、中文和单引号。助手只校验包身份、校验和及复制到稳定缓存，不安装、不改 profile。读取输出的 spec；installed:false 仅表示尚待宿主安装。
3. **自动选择通道，不询问用户：**
   - 会话有 plugin_manager/install_bundle：按实际 schema 用 spec 安装并启用。
   - 没有该工具，但能执行宿主官方 CLI：使用 `dsh plugin --profile <当前profile> add <spec>`。这是正常回退，不需要切到 Creator 或启用工具。使用宿主已提供的 CLI/运行时，必要时仅查 `dsh plugin --help`；不要下载全局 dsh、Node 或开发依赖。不要猜测/切换 profile。
   - 仅当两条路径均不可用或宿主强制要求权限审批时，简短说明实际阻碍；不擅自改权限、模型或宿主文件。
4. 等待实际完成，检查独立 bundle 已选择、加载无错误和设置→皮肤入口。宿主要求重启时如实提示；不要把已选择等同已运行，不重复安装。安装、启用和回退都交给宿主正式管理逻辑，不直接编辑配置或只做 pnpm add。
5. **最终回复只需安装是否成功、是否需重启以及设置入口。** 不向普通用户贴实现步骤或一长串测试清单，不追问安装其他profile或额外服务；用户要求诊断时再展开。

## 安装约束

归档身份：dsh-plugin-skins / 爱伦提卡 / dsh.bundle.patch=./cordis.patch.yml。严禁原下载路径、临时解压目录、link:开发目录或制作者路径成为最终安装源。必须使用助手的稳定缓存 spec。

缓存默认在 DSH_HOME/bundle-cache/dsh-plugin-skins，或用户目录 .dsh/bundle-cache/dsh-plugin-skins。安装后原ZIP/TGZ可移动、改名或删除；保留仍被profile引用的受管理缓存。校验和是完整性校验，不是数字签名。三项MIT依赖已经随包，不需重建客户端或下载依赖；其他宿主依赖可能影响总耗时。

官方工具默认仅在Creator预设启用；标准预设缺少该工具不表示无法安装。CLI和服务共享安装操作实现：[Harness plugin manager](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)。

新装使用制作者Aero液体玻璃默认配置；已有显式偏好保留。插件保持独立、可关闭、可由宿主管理器停用和卸载。包不会仅因被拖入而自行执行代码；收到用户安装请求后由宿主AI完成以上步骤。
