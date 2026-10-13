# saberu 主页：编码助手须知

工作区共享规则在 `~/workspace/.agents/rules/`，由工作区的 `CLAUDE.md`／Codex 托管块加载；
本文件只补充项目事实与更窄的约束。`CLAUDE.md` 仅导入本文件。

## 项目事实

- Next.js 16.4 App Router + Cache Components，next-intl 4.14，Tailwind v4（Turbopack loader），
  TypeScript strict，Node 24（`.nvmrc`）。
- 依赖：`package.json` 用 `^`（锁主版本），`package-lock.json` 锁解析结果；新主版本是人工决定的升级。
  `Dockerfile` 与 `compose.yaml` 的镜像写成"标签 + 摘要"，GitHub Actions 写成"完整 SHA + 版本注释"。
  哪些由 Dependabot 更新、哪些需手动升级，见 `docs/development.md` 的"依赖版本与安全更新"。
- 根布局是 `src/app/[locale]/layout.tsx`，`locale` 是 root param（`next/root-params`）。
  不要新增 `src/app/layout.tsx`，它会取代根布局并让 root params 失效。
- 唯一来源：语言 `src/config/locales.ts`；站点与内容状态 `src/config/site.ts`；公开页面
  `src/config/public-pages.ts`；文案 `messages/{zh,en,ja}.json`（三份键集合一致）。
  测试与冒烟脚本从这些来源读取期望值，不要在测试里写死文案或颜色。
- 颜色 token 的唯一来源是 `src/app/globals.css`；404 文档、`brandColors` 与 `icon.svg` 中的副本要同步，
  `tests/unit/design-tokens.test.ts` 会检查。
- 首页区块按 `src/config/home.ts` 中每项的 `design` 用 Velora 设计或 shadcnblocks 区块绘制。shadcn/ui 的配置在
  `components.json`（Base UI），区块在 `src/components/shadcnblocks/`；添加区块的步骤与必改项见
  `docs/development.md` 的“区块的两种设计与 shadcnblocks”。shadcnblocks 的注册表只通过 shadcn CLI 获取。
- 文案当前是 demo（`contentStatus: "demo"`），未经品牌负责人确认；不要把它改成 `confirmed`。
- `src/proxy.ts` 对未登记的文档路径直接返回 404 文档；新页面必须登记到 `public-pages.ts`，
  新的无扩展名元数据路由要加入 matcher（根目录，排除项锚定整条路径并补 `tests/unit/proxy-matcher.test.ts`）
  或 `localeMetadataRoutes`（`[locale]` 下）。
- 版本与发布：起始版本 `0.0.1`，发布标签为带说明的注释标签 `v<semver>`（工作区 `releases.md`）。
- Git：公开仓库 `taoziyoyo2566/saberu-homepage`，规范远程名 `origin`，主分支 `main` 受规则集保护。
  改动走短期分支与拉取请求，以合并提交并入；分支类型、提交说明格式与必需检查见
  `docs/development.md` 的"分支、提交与合并"。
- Cloudflare 上与主页有关的配置由 `infra/cloudflare/`（Terraform）管理，方案为
  `docs/reviews/cloudflare-config/plan-cloudflare-config-2026-10-12.md`。用 `npm run terraform -- <参数>` 运行；
  默认加载只读令牌，写令牌只用于 `CLOUDFLARE_TOKEN=write npm run terraform -- apply <计划文件>.tfplan`。
- 方案与验收：`docs/reviews/homepage-foundation/plan-homepage-foundation-2026-10-11.md`；
  已验证的框架事实：`docs/reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md`；
  开发命令：`docs/development.md`；结构：`docs/architecture.md`。

## 命令

- `npm run check`：lint、`next typegen` + `tsc`、Prettier（含 Tailwind 类名排序）、Vitest 单元与组件测试。交付前必须通过。
- `npm run build`；`npm run e2e`（构建镜像、冒烟检查、官方 Playwright 容器）；`npm run smoke -- <url>`。
- `npm run terraform -- plan -out=change.tfplan`（Cloudflare 配置的变更计划，需 `deploy/` 下的凭据）。
- `npm run audit:deps`（依赖审计策略，需网络）；`npm run release:check`（demo 文案下预期失败）。
- 修改 `.github/` 后用 actionlint 与 zizmor 校验，命令见 `docs/development.md`。
- 主机没有浏览器系统库，Playwright 只在容器中跑（`scripts/e2e.sh`）。

## 约束

- `src/app/[locale]` 下不要放 `loading.tsx`：它会把 `notFound()` 变成流式 200。
- 需要保持预渲染的页面树里不要读取 `cookies()`、`headers()`、`Date.now()`；随时间变化的值用 `"use cache"`。
- Cache Components 下不可用 `dynamicParams`、`dynamic`、`revalidate` 段配置。
- 保持 `alternateLinks: false`、`localeCookie: false`、`localeDetection: false`；偏好 Cookie
  `SABERU_LOCALE` 只由语言切换器写入。
- 密钥只放 `deploy/*.env`（已忽略）；不进镜像、文档或示例。
- 未经操作者明确授权不提交、推送、创建远程仓库或部署。
- `terraform apply` 只执行操作者批准的那一份保存计划；计划中出现管理范围外的对象（根域邮件与验证记录、
  其他子域、其他 Tunnel 或 Worker）即停止。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
