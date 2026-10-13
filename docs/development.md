# 开发与验证

本页说明如何在本机开发、检查、构建和验证主页，以及依赖、CI 与发布的约定。设计依据与验收要求见
[项目设计方案](reviews/homepage-foundation/plan-homepage-foundation-2026-10-11.md)；实现结构见
[architecture.md](architecture.md)；已验证的框架事实与复核条件见
[P1 验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)。

## 前提

- Node.js 24（`.nvmrc`），版本下限以 `package.json` 的 `engines` 为准（jsdom 30 需要 24.15 以上）。
- Docker Engine 与 Docker Compose v2 插件，用于容器验证与浏览器测试。
- 验证时使用的具体版本见 [P1 验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)的环境快照。
- 本机没有无头浏览器的系统库，浏览器测试在官方 Playwright 容器中运行。

## 安装与开发

```bash
npm ci
npm run dev
```

打开 <http://localhost:3000>，根路径按浏览器语言跳转到 `/zh`、`/en` 或 `/ja`。
`next dev` 会在 `AGENTS.md` 末尾重新写入 Next.js 写给 AI 编码助手的说明块，这是预期行为。

## 检查矩阵

| 命令 | 内容 | 需要 |
|---|---|---|
| `npm run lint` | ESLint（`eslint-config-next`） | — |
| `npm run typecheck` | `next typegen` 后 `tsc --noEmit` | — |
| `npm run format:check` | Prettier，含 Tailwind 类名排序插件；`npm run format` 自动修正 | — |
| `npm run test` | Vitest 的 `unit`（纯函数与配置）和 `component`（jsdom 下的客户端组件）项目 | — |
| `npm run check` | 以上四项，交付或交接前的最小门槛 | — |
| `npm run build` | 生产构建（standalone）；三语首页与分享图须为预渲染 | — |
| `npm run e2e` | 构建镜像、启动本地容器，跑冒烟检查和容器内 Playwright | Docker |
| `npm run smoke -- <url>` | 对运行中实例的 HTTP 契约检查 | 运行中的实例 |
| `npm run audit:deps` | 依赖审计策略（见下文） | 网络 |
| `npm run release:check` | 发布门槛：内容必须经品牌负责人确认 | — |
| `npm run terraform -- <参数>` | Cloudflare 配置的 Terraform（见下文“Cloudflare 配置”） | Docker；`init`、`plan` 等需要凭据 |

Vitest 的 `unit` 与 `component` 只覆盖纯函数、同步逻辑和客户端组件；异步服务端组件（布局、页面、分区）
由冒烟与浏览器检查覆盖，这是 Next.js 官方测试指南的分工。

## 容器

```bash
docker compose -f compose.yaml -f compose.local.yaml up -d --build web   # 本地绑定 127.0.0.1:3000
docker compose -f compose.yaml -f compose.local.yaml down
```

- `compose.yaml` 不发布任何端口；`compose.local.yaml` 只在本机回环地址发布 3000。
- 容器以非 root 用户 `nextjs`（uid 1001）运行，根文件系统只读；`/tmp`、`/app/.next/cache` 与
  `/app/.next/server/route-cache` 为有界 tmpfs；`cap_drop: ALL`、`no-new-privileges`、`init`、
  内存上限 512M、30 秒停机排空窗口。
- 健康检查请求 `/healthz`，只说明进程能响应，不替代冒烟检查。
- `cloudflared` 服务位于 `tunnel` profile，默认不启动；P3 在部署主机准备 `deploy/cloudflared.env`
  （以 `deploy/cloudflared.env.example` 为模板，被 Git 忽略）后再启用。
- `output: "standalone"` 下 `next start` 会提示不适用；本地运行生产服务器请使用容器。

## 冒烟与浏览器检查

```bash
npm run e2e                                         # 构建、启动、冒烟 + 浏览器检查、停止
KEEP_RUNNING=1 npm run e2e                          # 检查后保留容器
E2E_BASE_URL=http://127.0.0.1:3000 npm run e2e      # 对已运行的实例检查，不启停容器
npm run e2e -- --grep "404"                         # 额外参数透传给 Playwright
npm run smoke -- http://127.0.0.1:3000              # 只跑 HTTP 冒烟检查
SMOKE_TRUST_COUNTRY=true npm run smoke -- <url>     # 目标以 TRUST_CF_IPCOUNTRY=true 运行时
```

两类检查的期望值都取自应用自身的来源：冒烟脚本经 Node 24 的 TypeScript 类型剥离直接导入
`src/config/locales.ts` 与 `src/config/site.ts`，并读取 `messages/*.json`；浏览器测试经
`tests/e2e/fixtures.ts` 导入同样的文案与语言注册表，颜色取自 `src/app/globals.css`。更换文案不需要改测试；
冒烟检查与浏览器的窄屏溢出检查逐一覆盖注册表中的每种语言。增删或改名语言时，需要更新 `fixtures.ts` 的文案导入，
以及以具体语言写成的交互场景（偏好 Cookie、键盘、无 JavaScript 与 404）。冒烟检查覆盖根路径协商与跳转头、
三语页面的语言/标题/描述/canonical/hreflang/Open Graph（含 `og:locale`）/安全头、跨语言内容隔离、
导航锚点都指向存在的分区、联系邮箱、分享图与图标、真实 404 文档（含与排除路由名字相近的路径）、
sitemap/robots/healthz、静态资源缓存头与尾斜杠重定向。

浏览器检查使用与 `@playwright/test` 同版本的官方镜像 `mcr.microsoft.com/playwright:v<version>-noble`，
以当前用户、`--network host` 运行；报告在 `playwright-report/`，失败时 `test-results/` 含 trace。
检出目录按 Playwright 的 Docker 指南以读写方式挂载：运行器会删除并重建项目根目录下的这两个目录，只读挂载会使其失败。
镜像只按版本标签选择、不钉摘要：Dependabot 升级 `@playwright/test` 时镜像随之切换，钉摘要则每次升级都要手动改脚本。

## 内容与发布门槛

`src/config/site.ts` 的 `contentStatus` 说明 `messages/` 中的文案与站点信息由谁负责：

| 值 | 含义 | `npm run release:check` |
|---|---|---|
| `placeholder` | 开发占位 | 失败 |
| `demo` | AI 编码助手起草的 demo，未经品牌负责人确认（当前状态） | 失败 |
| `confirmed` | 品牌负责人已确认 | 通过（其余字段也须有效） |

联系邮箱已确定为 `contact@saberu.com`。P3 发布前必须先把 `contentStatus` 改为 `confirmed`，
这一步只能在品牌负责人确认全部三语文案之后进行。

## 依赖版本与安全更新

- **版本范围**：`package.json` 使用 `^`，即锁定主版本、允许次版本与补丁；`package-lock.json` 锁定实际解析结果，
  CI 与镜像构建都用 `npm ci`，所以构建可复现，范围只决定更新时允许移动到哪里。新主版本是人工决定的升级。
  从已发布的公告看，Next.js 的安全修复只出现在当时最新的 16.x 次版本上，所以范围必须允许次版本移动，才能接收修复
  （依据见[验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)）。
- **Node 与镜像**：Node 版本以 `.nvmrc` 为准。`Dockerfile` 与 `compose.yaml` 中的镜像写成"版本标签 + 摘要"，
  构建不可被悄悄替换，同时可由 Dependabot 更新。
- **GitHub Actions**：引用写成完整提交 SHA 加版本注释，这是 GitHub 安全加固指南中唯一不可变的引用方式；
  由 Dependabot 更新。代价是针对 Action 的漏洞告警不会触发，修复靠每周的版本更新进入。
- **Dependabot**（`.github/dependabot.yml`）：npm、GitHub Actions、Dockerfile、Compose、Terraform 五类，每周一 06:00（东京）；
  框架相关包分为一组；版本更新有 7 天冷却期，避免刚发布、可能被投毒的版本自动进入。npm 包、Node 基础镜像与
  Terraform 的 Cloudflare provider 不提议新主版本；GitHub Actions 与 Compose 中的镜像（cloudflared）会提议任何新版本，主版本升级需按变更说明审阅。
  告警与安全更新在建立远程仓库时于仓库设置中开启（见下文），安全更新不受冷却期限制。
- **不归 Dependabot 管的版本**：actionlint 与 zizmor 的工具镜像、CI 中 zizmor 的版本（都写在 `run:` 或 `with:` 中）、
  `scripts/terraform.sh` 中的 Terraform 镜像，需手动升级；Playwright 镜像随 `@playwright/test` 的版本自动选择。
- **审计门槛**：`npm run audit:deps` 由 `scripts/audit.mjs` 执行 `scripts/audit-policy.mjs` 的策略，
  始终在线查询注册表（离线的 npm 会返回空报告）：
  - 生产依赖不允许任何公告。生产依赖指从 `dependencies` 经依赖、可选依赖和必需的 peer 能到达的包；
    只因生产包把它列为可选 peer、又由开发依赖安装的包（如 next 与 `@playwright/test`）按开发依赖处理。
  - 只影响开发依赖的公告，必须在 `audit-exceptions.json` 中有逐条依赖路径、理由、阻碍、负责人与未过期的复核日期。
  - 例外过期、出现未接受的路径、npm 报不出路径、或已有不需升主版本的修复时，门槛失败。
  - 不再匹配的例外或路径会被提示删除，在 GitHub Actions 中显示为警告注解。
  - CI 另外运行 `npm audit signatures` 校验注册表签名与来源证明。
- **当前例外**：以 `audit-exceptions.json` 为准，理由、阻碍、负责人与复核日期都写在条目里；`npm run audit:deps` 会逐条列出。
- **Node 版本**：Node 24 进入维护期、Node 26 成为 LTS 后，评估升级 `.nvmrc`、`engines`、Docker 基础镜像，
  并确认 Vitest 与 jsdom 的引擎要求；日期与来源见[验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)。
- **框架安全公告**：出现影响所用版本的公告时，合并 Dependabot 的安全更新（或在范围内执行 `npm update`），
  运行 `npm run check`、`npm run build`、`npm run e2e` 与 `npm run audit:deps`，再按 P3 流程重建并发布镜像。
  已知、尚未处理的安全更新记录在[验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)的复核条件与方案的 P3 进入条件中。

## CI 与代码托管

工作流在 GitHub 上对推送到 `main` 的提交和所有拉取请求运行：

- `.github/workflows/ci.yml`：`checks`（安装、签名校验、lint、类型、格式、单测、构建）、`audit`（审计门槛）、
  `container`（`npm run e2e`；失败时上传 Playwright 报告）、`terraform`（Cloudflare 配置的格式、provider 锁文件与
  配置校验，不连接后端）、`workflows`（actionlint 与 zizmor 自检工作流）。
  工作流级默认无权限，各作业只授予 `contents: read`，不保留检出凭据，不使用任何密钥，所以 Dependabot 与外部贡献的
  拉取请求也能运行。运行环境固定为 `ubuntu-24.04`，不随 `ubuntu-latest` 自动切换到新的 Ubuntu 版本；
  迁移前先确认 `npm run e2e` 在新镜像上通过（切换时间与来源见[验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)）。
- `.github/workflows/dependency-review.yml`：拉取请求的依赖审查，只在公开仓库运行；个人账户的私有仓库没有该接口，
  作业会被跳过而不是失败。
- 修改工作流后在本地校验：

```bash
docker run --rm -v "$PWD:/repo:ro" -w /repo \
  rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 -no-color
docker run --rm -v "$PWD:/repo:ro" -w /repo \
  ghcr.io/zizmorcore/zizmor:1.30.1@sha256:a2eb396d886c053073405c7a980f2139ba2248ec172243cfa3841e57196e8101 \
  --offline --persona=pedantic .github/
```

去掉 `--offline` 并以环境变量传入 `GH_TOKEN` 时，zizmor 还会检查所用 Action 是否有已知漏洞；
这弥补了以 SHA 钉住的 Action 不产生 Dependabot 告警的缺口，CI 中的 zizmor 作业默认如此运行。
两个工具镜像与 CI 中的 zizmor 版本需手动升级（Dependabot 不读取 `run:` 中的镜像）。

仓库是公开仓库。个人账户的免费方案下，公开仓库可以免费使用分支规则（强制 CI 通过）、CodeQL、
密钥扫描与推送保护、依赖审查，Actions 分钟数不限；私有仓库只有 Dependabot 可用
（2026-10-12 按 GitHub 官方文档核对，见[验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)）。仓库按下列清单配置，修改设置时同步更新本清单：

- 安全：Dependabot 告警与安全更新；密钥扫描与推送保护（在首次推送前开启）；私密漏洞报告；
  CodeQL 默认设置，不提交 CodeQL 工作流。
- Actions：要求 Action 钉住完整提交 SHA；工作流令牌默认只读，不允许工作流批准拉取请求。
- 合并：只允许合并提交，合并后自动删除远程分支；关闭 Wiki。
- `main` 的规则集：禁止删除与强推；必须经拉取请求，不要求审批；必需检查 `Lint, types, unit tests, build`、
  `Dependency audit policy`、`Container, smoke and browser checks`、`Terraform checks`、`Workflow lint` 与
  `Dependency review`
  全部通过，且须由 GitHub Actions 报告。
- Dependabot 中 `braces` 的开发期告警以"风险可接受"驳回并引用 `audit-exceptions.json`；
  公开仓库默认的"开发依赖低影响"预设可能已自动驳回它。

## 分支、提交与合并

- `main` 受规则集保护，不直接提交。每个改动在从 `main` 拉出的短期分支上完成，分支名为 `<类型>/<主题>`，
  类型取 `feat`、`fix`、`docs`、`chore`、`ci`、`test`、`refactor`；Dependabot 的分支由它自己命名。
- 提交说明采用 Conventional Commits：`<类型>(<范围>): <英文祈使句摘要>`，范围可省略；
  依赖更新写作 `chore(deps): …`，Dependabot 的提交以 `chore(deps)` 或 `chore(deps-dev)` 开头。
- 并入 `main` 的唯一途径是拉取请求：必需检查全部通过后以合并提交并入，远程分支随之自动删除；
  本地分支在更新 `main` 后用 `git branch -d` 删除。规范远程名为 `origin`。

## 版本与发布

- 起始版本 `0.0.1`（`package.json`）。版本号与标签遵循工作区的 `releases.md`：发布是已部署并验证的提交，
  打带说明的注释标签 `v<MAJOR>.<MINOR>.<PATCH>`，首个为 `v0.0.1`。
- 首次提交是 2026-10-12 建立公开仓库时的初始导入。尚未发布，因此还没有版本标签。

## Cloudflare 配置

saberu.com 在 Cloudflare 上与主页有关的配置由 `infra/cloudflare/` 中的 Terraform 声明。管理范围、批准边界与
变更流程以 [Cloudflare 配置代码化方案](reviews/cloudflare-config/plan-cloudflare-config-2026-10-12.md)为准，
线上现状见[现状调查记录](reviews/cloudflare-config/investigation-cloudflare-current-state-2026-10-12.md)。

`npm run terraform -- <参数>`（即 `scripts/terraform.sh`）在官方 Terraform 镜像中运行，不需要在主机安装。
状态保存在 R2 存储桶的 `saberu-homepage/cloudflare.tfstate`，含 Tunnel 连接令牌，不进入仓库。

### 令牌与凭据

凭据都放在 `deploy/` 下，被 Git 与镜像构建排除，文件权限 600：

| 文件 | 变量 | 何时加载 |
|---|---|---|
| `deploy/terraform-state.env` | `AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`（R2 令牌）；`AWS_ENDPOINT_URL_S3`（`https://<账户 ID>.r2.cloudflarestorage.com`）；`TF_CLI_ARGS_init`（`-backend-config=bucket=<存储桶名>`） | 每次运行 |
| `deploy/cloudflare-readonly.env` | `CLOUDFLARE_API_TOKEN` | 默认 |
| `deploy/cloudflare-write.env` | `CLOUDFLARE_API_TOKEN` | 只在 `CLOUDFLARE_TOKEN=write` 且命令为 `apply <计划文件>.tfplan` 时 |

账户 ID 与存储桶名不是机密，但不写进公开仓库，所以和凭据放在一起。三个令牌在 Cloudflare 控制台创建：

| 令牌 | 范围 | 权限 |
|---|---|---|
| 只读 | Zone（只选 saberu.com） | Zone Read、DNS Read、Workers Routes Read、Single Redirect Read、Zone Settings Read、SSL and Certificates Read |
| 只读 | Account | Cloudflare Tunnel Read、Workers Scripts Read |
| 写 | Zone（只选 saberu.com） | Zone Read、DNS Edit、Single Redirect Edit |
| 写 | Account | Cloudflare Tunnel Edit |
| R2 | 只选状态存储桶 | Object Read & Write（R2 → Overview → API Tokens → Create Account API token） |

写令牌设有效期，并把来源 IP 限制为运行 Terraform 的主机。令牌限制了来源 IP 时，直接调用 Cloudflare API
要走 IPv4（例如 `curl -4`），因为主机默认走 IPv6；Terraform 容器默认走 IPv4。维护页是 Worker 自定义域
（见[现状调查记录](reviews/cloudflare-config/investigation-cloudflare-current-state-2026-10-12.md)），移除它需要账户级的
Workers Scripts Edit，这个权限能改账户内所有 Worker，因此这一步在控制台手动完成，或使用用完即吊销的临时令牌。

### 变更流程

```bash
npm run terraform -- init                                          # 连接 R2 中的状态
npm run terraform -- plan -out=change.tfplan                       # 只读令牌生成并保存变更计划
npm run terraform -- show change.tfplan                            # 审阅计划
CLOUDFLARE_TOKEN=write npm run terraform -- apply change.tfplan    # 只在用户批准这份计划之后
npm run terraform -- plan                                          # 执行后再生成一次，应显示无变更
```

- 每次 `apply` 前向用户提交受保护操作说明与计划摘要；批准只覆盖那一份计划文件。配置或线上状态在批准后
  变化时，重新生成计划并重新请求批准。
- 计划中出现管理范围之外的对象（根域的邮件与验证记录、其他子域、其他 Tunnel 或 Worker）时停止，不执行。
- 把现有资源纳入管理用 `npm run terraform -- import <地址> <ID>`，只需只读令牌，不改动 Cloudflare。
- 脚本拒绝用写令牌执行 `apply <计划文件>.tfplan` 以外的任何命令。

### 检查的边界

`terraform validate`（CI 与本地）只检查语法、顶层参数与 provider 锁文件；对象类型参数内部的键写错
（例如 `filter = { nam = "..." }`）不会报错，只在生成计划时由 Cloudflare 接口暴露。CI 通过不代表配置正确，
每次修改都要生成计划。

provider 版本由 Dependabot 更新；`.terraform.lock.hcl` 记录 linux_amd64 与 linux_arm64 的校验和，
手动更新时运行 `npm run terraform -- providers lock -platform=linux_amd64 -platform=linux_arm64`。

## 区块的两种设计与 shadcnblocks

`homeSections` 中每个区块的 `design` 决定它用哪套组件绘制：`velora` 是 Velora UI 风格的现有设计
（`src/components/sections/`），`shadcnblocks` 用 shadcnblocks.com 的免费区块
（区块在 `src/components/shadcnblocks/`，读文案的对接组件在 `src/components/sections/shadcnblocks/`）。
两种设计读同一份文案；`home-sections.tsx` 为每种版式登记每种设计的组件，缺一个就编译失败。
首页目前全部用 `velora`；shadcnblocks 区块留给以后新增的版式或页面，买付费版后可按区块切换
（[项目设计方案](reviews/homepage-foundation/plan-homepage-foundation-2026-10-11.md) 2026-10-14 的决定）。
浏览器测试只覆盖配置中正在用的设计；切换设计后要重跑 `npm run e2e`。调查到的许可、价格与区块质量见
[模板产品线调查记录](reviews/homepage-foundation/investigation-template-lines-2026-10-14.md)。

shadcn/ui 的配置在 `components.json`：组件库为 Base UI（2026-07-02 起 shadcn/ui 的默认），样式 `base-nova`，
登记了 shadcnblocks 的免费注册表（不需要密钥）。颜色变量沿用 shadcn/ui 的语义名，注册表中的组件和区块可以直接使用。
`buttonVariants` 从 `button.tsx` 拆到了 `src/components/ui/button-variants.ts`：从 `button.tsx` 导入会把 Base UI 的
`Button`（客户端组件）带进页面脚本。lucide-react 的图标也是客户端组件：只要 `home-sections.tsx` 登记了用到
lucide 图标的区块，页面就会多加载约 2.5 KB（压缩前）的脚本，即使这些区块没有启用。

添加一个 shadcnblocks 免费区块：

1. 先看源码：`npx shadcn@4.21.4 view @shadcnblocks/<名称>`。shadcnblocks 的条款只允许通过 shadcn CLI
   及基于它的工具自动获取注册表内容，不要用 curl 或脚本批量下载。
2. `npx shadcn@4.21.4 add @shadcnblocks/<名称>`，不带 `-p`：带 `-p` 时 CLI 会把依赖的 `ui/` 组件
   另复制一份到同一目录。区块文件生成在 `src/components/<名称>.tsx`，把它移到 `src/components/shadcnblocks/`。
   CLI 只安装区块声明的 npm 依赖；新依赖的版本按 7 天冷却期选择（见“依赖版本与安全更新”）。
3. 按以下要求修改区块，并在文件开头注明来源网址、条款位置与改动：
   - 删除 `defaultProps` 的演示内容：缺文案时不能退回到虚构的客户、评价或数据；
   - 链接写成带 `buttonVariants` 的 `<a>`，`buttonVariants` 从 `@/components/ui/button-variants` 导入：
     Base UI 的 `Button` 渲染链接时会加 `role="button"`，shadcn/ui 文档也不建议这样渲染链接；
   - 页面只有首屏一个 `h1`，其余区块从 `h2` 开始；
   - 硬编码的颜色改用主题变量；`<img>` 会触发 lint 警告，确有图片时改用 `next/image`。
4. 在 `src/components/sections/shadcnblocks/` 写对接组件：从 `home.<id>` 读文案，用 `BlockSection`
   包住区块，提供 `/#<id>` 锚点和以标题命名的区域。然后在 `home-sections.tsx` 登记。
5. 运行 `npm run check`、`npm run build` 与 `npm run e2e`，并在三种语言下查看排版。
   这些区块按英文短标题设计，中文的大标题可能在词中间换行。

## 改什么，改哪里

| 需求 | 位置 | 生效方式 |
|---|---|---|
| 文案 | `messages/{zh,en,ja}.json` | 三份键集合、ICU 参数与富文本标签必须一致，`npm run test` 校验。Velora 设计中，首页标题里 `<em>…</em>` 包住的部分显示为渐变色；shadcnblocks 的首屏区块只显示纯文本 |
| 首页显示哪些区块、顺序、哪些进导航 | `src/config/home.ts` 的 `homeSections` | 调整顺序或改 `enabled`、`nav` 即可；关闭的区块保留文案。新增区块时在每种语言加 `home.<id>`（进导航的再加 `header.nav.<id>`）；导入时自检、`npm run test` 检查三种语言，冒烟检查要求每个导航锚点都存在 |
| 区块用哪种设计 | `homeSections` 中该区块的 `design`（`velora` 或 `shadcnblocks`） | 重新构建后生效；见“区块的两种设计与 shadcnblocks” |
| 卡片、步骤的条目 | `messages/*.json` 中该区块的 `items` | 每种语言加同样的键即增加一项。卡片默认用 sparkles 图标，要换图标时在 `homeSections` 中该区块的 `icons` 按键登记（图标名见 `src/components/icons.tsx` 的 `iconsByName`） |
| 新版式 | 每种设计各加一个组件（`src/components/sections/` 与 `src/components/sections/shadcnblocks/`），`src/config/home.ts` 的 `HomeSection` 加类型与必填字段，`home-sections.tsx` 加一个分支并登记组件 | 类型检查要求每种版式在每种设计下都能渲染 |
| 语言、默认语言、国家兜底、偏好 Cookie | `src/config/locales.ts` | 导入时自检，非法配置使构建失败 |
| 品牌、域名、邮箱、产品入口、外链、内容状态 | `src/config/site.ts` | `npm run release:check` 决定能否发布 |
| Cloudflare 上与主页有关的配置（DNS、Tunnel、跳转规则） | `infra/cloudflare/` | 生成计划、经用户批准后执行（见“Cloudflare 配置”） |
| 新公开页面 | `src/app/[locale]/<path>/page.tsx`，并登记到 `src/config/public-pages.ts` | 未登记的路径由 proxy 返回 404，也不进入 sitemap |
| 设计 token、字体栈 | `src/app/globals.css` | 浅深色与品牌色阶均在此定义；颜色变量用 shadcn/ui 的语义名（`--background`、`--primary`、`--muted-foreground` 等），`--primary-soft` 与品牌色阶是本站补充。proxy 的 404 文档、`brandColors`（标志与生成的图片）和 `icon.svg` 读不到样式表，各自保留颜色副本；`tests/unit/design-tokens.test.ts` 检查它们与此一致 |
| 品牌标志 | `src/app/icon.svg` 与 `src/components/brand-mark.tsx`（同一几何，需同步） | 图标、苹果图标、页眉标志与分享图 |
| 地区头是否可信 | 环境变量 `TRUST_CF_IPCOUNTRY=true` | 仅当所有请求经 Cloudflare → Tunnel 到达时设置（P3） |
| 被接受的开发期审计公告 | `audit-exceptions.json` | 必须写明理由与复核日期 |

## 常见问题

- `tsc` 报找不到 `next/root-params` 导出或 `LayoutProps`：先运行 `npm run typecheck`（内含 `next typegen`）。
- Playwright 报浏览器不存在：镜像版本必须与 `@playwright/test` 一致，`scripts/e2e.sh` 按已安装版本选择镜像；
  首次运行会拉取约 3.6 GB 的镜像。
- 新增一个不带扩展名的元数据路由（例如 `twitter-image`）后它返回 404：proxy 的 matcher 只放行已列出的路由，
  根目录路由加入 `src/proxy.ts` 的 matcher（排除项要锚定整条路径，并补 `tests/unit/proxy-matcher.test.ts`），
  `[locale]` 下的路由加入 `localeMetadataRoutes`。
- `next start` 打印 standalone 警告：使用容器，或 `node .next/standalone/server.js`
  （需先把 `public` 与 `.next/static` 复制到 standalone 目录）。
