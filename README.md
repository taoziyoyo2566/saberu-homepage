# saberu.com 品牌主页

saberu 的中文、英文、日文三语品牌主页。技术栈：Next.js 16（App Router，Cache Components）+ next-intl，
Docker standalone 镜像自托管，计划经 Cloudflare Tunnel 对外提供服务。

**当前状态（2026-10-12）**：P1 基础框架已在本地实现并验证。首页使用 AI 编码助手起草的三语 demo 文案，
联系邮箱为 `contact@saberu.com`；文案未经品牌负责人确认，发布门槛会拒绝发布。CI、依赖更新与审计配置随仓库发布，
源代码公开在 GitHub 的 `taoziyoyo2566/saberu-homepage`；版本号 `0.0.1`，网站尚未部署。
主页工作流的唯一方案是[项目设计方案](docs/reviews/homepage-foundation/plan-homepage-foundation-2026-10-11.md)；
Cloudflare 一侧的配置由仓库中的 Terraform 管理，方案是
[Cloudflare 配置代码化方案](docs/reviews/cloudflare-config/plan-cloudflare-config-2026-10-12.md)。
两份方案的状态行与决定记录说明各自的批准范围。

## 从这里开始

- 开发、检查、依赖策略、CI 与发布：[docs/development.md](docs/development.md)
- 实现结构、请求流程与已知限制：[docs/architecture.md](docs/architecture.md)
- 已验证的框架事实（版本、约束、复核条件）：
  [docs/reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md](docs/reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)
- 产品范围、路由契约与阶段验收：设计方案第 2、5、7 节
- Cloudflare 现状与配置方式：[现状调查记录](docs/reviews/cloudflare-config/investigation-cloudflare-current-state-2026-10-12.md)、
  [docs/development.md](docs/development.md) 的“Cloudflare 配置”
- 面向编码助手的项目事实：[AGENTS.md](AGENTS.md)；漏洞报告：[SECURITY.md](SECURITY.md)
- 已过时资料：[docs/archive/homepage-foundation/README.md](docs/archive/homepage-foundation/README.md)

## 快速命令

```bash
npm ci
npm run dev                               # http://localhost:3000，按浏览器语言跳到 /zh、/en 或 /ja
npm run check                             # lint、类型、格式、单元与组件测试
npm run build                             # 生产构建（standalone）
npm run e2e                               # 构建镜像、启动本地容器，跑冒烟检查与浏览器检查
npm run smoke -- http://127.0.0.1:3000    # 只对运行中的实例做 HTTP 契约检查
npm run audit:deps                        # 依赖审计策略
npm run release:check                     # 发布门槛：文案须经确认
npm run terraform -- plan                 # Cloudflare 配置的变更计划（需 deploy/ 下的凭据）
```

## 目录速览

```text
src/app/[locale]/   根布局、首页、分享图、本地化 404、catch-all
src/app/            healthz、sitemap、robots、图标、全局样式 token
src/components/     页眉、页脚、语言切换器、首页分区、品牌标志
src/config/         语言注册、站点信息与内容状态、公开页面清单（各自唯一来源）
src/i18n/           协商纯函数、偏好 Cookie、next-intl 路由/导航/请求配置、404 文档
src/proxy.ts        根路径协商、未知路径 404、元数据路由放行
messages/           zh.json、en.json、ja.json（键集合必须一致）
tests/              unit/、component/（Vitest）；e2e/（Playwright）；release/（发布门槛）
scripts/            smoke.mjs、e2e.sh、audit.mjs 与 audit-policy.mjs、terraform.sh
infra/cloudflare/   Cloudflare 配置（Terraform）：DNS、Tunnel、跳转规则
.github/            CI、依赖审查与 Dependabot 配置
Dockerfile、compose.yaml、compose.local.yaml、deploy/cloudflared.env.example
audit-exceptions.json  被接受的开发期审计公告（带复核日期）
docs/               方案、验证记录、开发与架构说明、历史资料
```
