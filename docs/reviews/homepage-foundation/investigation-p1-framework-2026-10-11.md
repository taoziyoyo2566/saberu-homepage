# P1 框架验证记录：Next.js 16.4 + next-intl 4.14 组合

Status: 验证快照，2026-10-11（Asia/Tokyo）；2026-10-12 补充依赖策略、元数据与工程框架，并记录评审修复与更正

## 问题与范围

验证[项目设计方案](plan-homepage-foundation-2026-10-11.md)第 5–7 节对框架组合的假设在所选版本上是否成立，
并记录会约束 P2/P3 的事实。证据来自：本机构建、运行与容器检查；`node_modules/next/dist/docs`
随包文档（16.4.0）；以及当天对官方文档（Next.js、next-intl、Tailwind、Playwright、Vitest、Cloudflare、
GitHub 安全公告）的多代理核对（原始记录为本机会话文件，不入库；结论已归入下表）。

## 环境与版本快照

| 项目 | 值 |
|---|---|
| 主机 | 开发主机（名称不公开），Debian 13，Node 24.20.0，npm 11.19.0，Docker 29.7.2，Compose v5.5.0 |
| 运行依赖 | next 16.4.0、react / react-dom 19.3.0、next-intl 4.14.9 |
| 开发依赖 | typescript 5.9.3、eslint 9.39.5、eslint-config-next 16.4.0、tailwindcss / @tailwindcss/turbopack 4.3.3、vitest 5.0.3、@playwright/test 1.64.0、prettier 3.9.10、geist 1.7.2、@formatjs/icu-messageformat-parser 2.11.4 |
| 传递依赖 | sharp 0.35.5（next 的可选依赖，`images.unoptimized` 下未使用） |
| 镜像 | `node:24.21.0-alpine` 多阶段构建，`saberu-homepage:local` 约 298 MB；Playwright `mcr.microsoft.com/playwright:v1.64.0-noble` |

## 结论

每条标注适用范围；升级受影响依赖后需复核。

1. **root params + `generateStaticParams` + Cache Components 可预渲染三语首页。** `next build` 输出
   `/zh`、`/en`、`/ja` 为 `○ Static`，`/[locale]` 兜底为 `◐`；`generateMetadata` 中读取
   `next/root-params` 不触发请求期渲染，各语言 `<title>`、`<meta name=description>`、canonical 与
   hreflang 出现在预渲染 HTML 中。范围：next 16.4.0、next-intl 4.14.9。
2. **`dynamicParams` 与 Cache Components 互斥。** 构建错误：`Route segment config "dynamicParams" is not
   compatible with nextConfig.cacheComponents`。非法 locale 由根布局内 `hasLocale` + `notFound()` 拒绝。
3. **`notFound()` 在 Cache Components 下只输出空外壳。** 页面调用 `notFound()`（含为 `/{locale}/404`
   生成的静态参数）与根布局拒绝非法 locale 两种情况，服务端 HTML 均为 `<html id="__next_error__">`
   加 RSC 负载，无 `lang`、无 `<h1>`，状态 404、含 `noindex`，界面由客户端渲染。因此方案第 5 节的
   proxy 退路被采用：未知文档路径由 `src/proxy.ts` 返回完整 404 文档；经容器 `curl` 与无 JavaScript
   的浏览器检查确认。实验性 `global-not-found` 未启用。
4. **next-intl middleware 会给未知首段补前缀。** 官方文档与 4.14.9 源码核对：`localePrefix: 'always'`
   下 `/fr`、`/about` 会被 307 到 `/en/fr`、`/en/about`。方案要求的"进入 next-intl 前分流"是硬性前提，
   `proxy.ts` 只把已登记页面交给 `createMiddleware(routing)`；4.14.9 没有 `next-intl/proxy` 入口。
5. **`requestLocale` 与 `setRequestLocale` 已废弃。** 4.14.9 类型声明带 `@deprecated`，指向 root params
   方案；`i18n/request.ts` 以显式 `locale` 参数优先、否则读 root param。next-intl 自 4.4.0 支持 Next 16，
   4.14.5 起修正了 Cache Components 下 `useRouter`/`Link` 读取 pathname 的问题。
6. **预渲染中不能直接读取当前时间。** 构建错误 `encountered the unstable value new Date() while
   prerendering`；页脚年份改为 `"use cache"` + `cacheLife("days")`。副作用：三语页面
   `Cache-Control: s-maxage=86400, stale-while-revalidate=518400`。
7. **只读根文件系统需要两处可写目录。** 首次容器运行对 `/fr` 记录
   `ENOENT: mkdir '/app/.next/server/route-cache'`；为 `/app/.next/cache` 与
   `/app/.next/server/route-cache` 挂载有界 tmpfs 后，`/fr.html`、`/ja/x.txt`、`/zh/deep/file.json`
   均返回 404 且日志无错误。容器以 uid 1001 运行，`ReadonlyRootfs=true`、`CapDrop=[ALL]`、
   `no-new-privileges`、内存 512M、`init`、停机排空 30 秒均经 `docker inspect` 确认。
8. **`next start` 不适用于 standalone 输出**（启动时警告）；生产服务器以容器内 `node server.js` 运行。
9. **Tailwind v4 在 16.4 模板中经 Turbopack loader 接入**：`create-next-app 16.4.0 --tailwind` 生成
   `turbopack.rules["*.css"]` 使用 `@tailwindcss/turbopack`，不生成 PostCSS 配置。构建产物 CSS 含
   `--font-geist-sans`、`html:lang(zh-Hans)`/`html:lang(ja)` 字体栈与 `prefers-color-scheme: dark` 覆盖。
10. **语言切换会重挂载 `[locale]` 下整棵树并丢失滚动位置。** 切换器记录并恢复滚动意图后，
    Playwright 验证 `/en#contact` 切到 `/ja#contact` 时 URL、`lang`、滚动与历史替换均符合方案。
    （2026-10-12 更正：机制与原因见下文"评审与修复"第 1 条。）
11. **地区兜底只在显式信任时生效。** 以 `TRUST_CF_IPCOUNTRY=true` 启动的临时容器：浏览器 `fr` + `JP` → `/ja`，
    无浏览器语言 + `CN` → `/zh`，`XX`/`T1`/`US` → `/en`；默认（不信任）下同样请求 → `/en`。
12. **浏览器测试在官方容器中可行。** 主机缺少浏览器系统库；`scripts/e2e.sh` 以同版本镜像、
    `--network host` 运行，10 项检查全部通过。Playwright 文档只记载 `--add-host=hostmachine:host-gateway`
    方式，`--network host` 依赖 Docker 引擎行为。
13. **安全状态。** `npm audit --omit=dev` 为 0；`npm audit` 报 5 个 high，全部来自
    `eslint-config-next → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch → braces ≤3.0.3`
    （GHSA-vfj7-8cjw-p6xm，栈耗尽拒绝服务，无修复版本），仅影响开发期 lint 工具，已接受。
    已发布的 Next.js 公告首个修复版本均 ≤ 16.3.8，16.4.0 不在任何已发布受影响范围内；
    官方预告 2026-10-14 的带外更新含上游依赖两个 Critical、一个 High，16.4.0 早于该更新。
    sharp 解析为 0.35.5（≥ GHSA-wq5f-xc86-pv6w 的修复版本），且图片优化已关闭。
    next-intl 的三条公告分别需要 `localePrefix: 'as-needed'`（本项目为 `always`）或
    `experimental.messages.precompile`（未使用），不适用。
14. **工具版本。** TypeScript 7（npm `latest`）未采用：Next 16.4 仅通过实验性的 CLI 类型检查路径支持它，
    项目锁定 5.9.3；eslint-config-next 16.4.0 的 peer 为 `eslint >=9`，锁定 9.39.5。

## 本地验证结果（2026-10-11）

| 检查 | 结果 |
|---|---|
| `npm run check`（lint、typegen+tsc、prettier、vitest 35 项） | 通过 |
| `npm run build` | 通过；路由表如结论 1 |
| 容器构建与启动（`compose.yaml` + `compose.local.yaml`） | 通过；健康检查正常 |
| `scripts/smoke.mjs`（30 项 HTTP 契约） | 全部通过（含 `TRUST_CF_IPCOUNTRY=true` 变体） |
| Playwright 10 项（Chromium 桌面，含无 JavaScript 与 360px 窄屏） | 全部通过 |

## 复核条件

- 升级 next 或 next-intl：复核结论 1–7、10；尤其 `notFound()` 的服务端输出若恢复完整渲染，
  可考虑撤回 proxy 404 文档。
- 2026-10-14 Next.js 安全更新发布后：升级、重跑全部检查，再进入 P3（方案第 7 节进入条件）。
- 引入图片：决定 `images.unoptimized` 与 `images.maximumDiskCacheSize`，并核对 sharp 公告与 PIE 条件。
- 新增公开页面：登记 `public-pages.ts`，补 sitemap/导航/路由测试；proxy 对未登记路径返回 404。
- P3 核对 Cloudflare 对 3xx 与 HTML 的缓存规则：根路径 307 与三语页面的 `Vary`/RSC 头不得被共享缓存忽略。

## P3 前需核对的 Cloudflare 事实

来自当天对 Cloudflare 官方文档的核对，均为 P3 的前提或检查项，尚未在真实 zone 上验证：

- `CF-IPCountry` 只有在 zone 开启 IP Geolocation（或 "Add visitor location headers" 托管转换）时才会出现；
  新 zone 的默认状态文档未说明，P3 需读取 `ip_geolocation` 设置。值为 ISO 3166-1 alpha-2，特殊值 `XX`、`T1`。
- 文档没有说明边缘会覆盖客户端自带的 `CF-IPCountry`；"可信"只能来自源站仅经 Tunnel 可达这一网络事实。
  P3 用带伪造头的请求从公网验证后，才设置 `TRUST_CF_IPCOUNTRY=true`。
- 默认缓存按扩展名判断：HTML、JSON、XML 不缓存，`/_next/static/*` 的 js/css/woff2 无需规则即被缓存并遵守
  源站 `Cache-Control`；`robots.txt` 默认可缓存，但本项目返回 `public, max-age=0, must-revalidate`。
  日后若开启 HTML 边缘缓存，需显式排除 `/`、`/healthz`，并保证 RSC 请求的 `Vary` 生效。
- `www` → 主域的 301 应在边缘以 Redirect Rule 实现，或在源站 301 上显式设置 `Cache-Control`；
  可缓存路径上的 301 默认有 120 分钟边缘 TTL。
- 404 也会被边缘缓存：无缓存头时默认 3 分钟；Free、Pro、Business 方案默认遵守源站的 `Cache-Control`。
  源站对绕过 proxy 的 404 发出 `s-maxage=31536000`（"评审与修复"第 4 条），而 js、css、ico 等扩展名默认可缓存，
  因此按文档推断，边缘可把这类 404 保存一年。例如回滚后再切流时，新版本的资源会持续返回缓存的 404。
  P3 需要用缓存规则让非 2xx 响应不被缓存，至少覆盖 `/_next/static/*` 与静态扩展名。切流后还要检查：
  对不存在的 `/_next/static/chunks/<x>.js` 连续请求两次，第二次不得为缓存命中。（2026-10-12 核对
  [默认缓存行为](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)与
  [Origin Cache Control](https://developers.cloudflare.com/cache/concepts/cache-control/)。）
- Docker 推荐远程管理的 Tunnel：凭据是 token（`TUNNEL_TOKEN` 或 `TUNNEL_TOKEN_FILE`，后者需 cloudflared ≥ 2025.4.0），
  主机名到 `http://web:3000` 的映射在 Cloudflare 侧配置并自动创建代理 CNAME（指向 `<UUID>.cfargotunnel.com`），
  P3 不得再为主域另建 A/AAAA 记录。需要 TCP+UDP 7844 出站与容器 DNS 正常；`--loglevel debug` 会记录全部请求头，生产禁用。
- 官方示例使用 `cloudflare/cloudflared:latest`；本项目锁定 `2026.10.0`，Cloudflare 只支持一年内的版本，
  发布工具需要定期升级该镜像。cloudflared 容器的只读根文件系统未见文档说明，P3 实测。

## 2026-10-12 补充：依赖策略、元数据与工程框架

依据操作者 2026-10-12 的决定（见方案"文档决定与范围"）实施后验证。证据来自本机构建、容器与测试运行，
以及当天对 GitHub、npm、Dependabot 源码、Next.js 随包文档与 Testing Library 文档的多代理核对。

**依赖与安全更新**

1. `package.json` 改为 `^` 范围后，`npm install` 的解析结果不变，锁文件只记录新范围。从已发布公告的受影响范围推断，
   Next.js 的安全修复只出现在当时最新的 16.x 次版本上（8 月为 `>= 16.0.0, < 16.3.3`，9 月为 `< 16.3.8`，
   16.2.x 没有单独补丁），所以范围必须允许次版本移动；官方支持政策没有承诺向旧次版本回移修复。
2. Dependabot：`docker` 与 `docker-compose` 只有版本更新，没有安全更新；冷却期只延迟版本更新，从不延迟安全更新，
   自 2026-07-14 起默认 3 天；`ignore` 的 `update-types` 在安全更新任务中不生效（dependabot-core 源码，推断），
   因此忽略主版本不会挡住需要升主版本的安全修复；"标签 + 摘要"写法会被同时更新；Compose 文件中本地构建服务的
   `image:` 也会被当作依赖，需显式忽略；以 SHA 钉住的 Action 不会产生 Dependabot 告警，只靠版本更新前进。
3. GitHub 个人账户免费方案：私有仓库没有规则集与分支保护（无法强制 CI 通过）、CodeQL、依赖审查和密钥扫描，
   Actions 每月 2,000 分钟；公开仓库这些全部免费。依赖审查接口在私有仓库返回 403，不会静默通过。
4. `npm audit` 没有接受单条公告的内置机制；`audit-ci` 与 `better-npm-audit` 最后发布均在 2024 年，前者维护者已失去仓库权限，
   因此改用仓库内的 `scripts/audit-policy.mjs`（有单元测试）。`NODE_ENV=production` 会让 npm 默认省略开发依赖，
   全量审计必须显式 `--include=dev`。`npm audit signatures`：466 个包的注册表签名与 140 个来源证明全部通过。
5. `braces` 公告 GHSA-vfj7-8cjw-p6xm（CVE-2026-93687，2026-09-18 发布，CVSS 3.1 为 7.5）：所有 ≤3.0.3 版本受影响，
   无修复版本，上游维护者对 CVE 有异议，修复 PR 未合并；`@next/eslint-plugin-next` 16.4.0 与 16.5.0-canary.8 都钉住
   `fast-glob` 3.3.1。在本项目中它只在 lint 时展开本仓库 ESLint 配置的 `settings.next.rootDir`（未设置），
   standalone 输出中没有这条链上的任何包。npm 建议的 `audit fix --force` 会把 `eslint-config-next` 降到 14.x，不可执行。
6. 测试用的 ICU 解析器原为 2.x，而 next-intl 运行时使用 3.x（`intl-messageformat` 11 → 3.5.18，`icu-minify` → 3.5.21），
   已对齐为 `^3.5.21`。

**元数据与路由**

7. 页面一旦设置 `openGraph`，就整体替换上级段的同名字段，包括 `app/` 根目录的 `opengraph-image`：放在根目录时
   三语页面没有 `og:image`（本机构建确认）。放在 `[locale]` 段并提供 `generateStaticParams` 后，三张图为 `●` 预渲染，
   页面输出带绝对地址的 `og:image`、类型、宽高与替代文字，并自动复制为 `twitter:image`。
   `app/` 根目录的图标（`icon.svg`、`apple-icon`）对所有页面与 404 文档都生效。
   （更正：这些图标只作用于应用渲染的页面，见"评审与修复"第 2 条。）
8. 不带扩展名的元数据路由会进入 proxy：根目录路由需加入 matcher，`[locale]` 下的路由由 proxy 在首段为已注册语言时放行；
   否则会得到 404 文档。
9. Node 24 的类型剥离可以直接导入 `src/config/*.ts`，因此冒烟脚本从配置读取期望值；项目不是 ES 模块包，
   Node 每次运行会给出 `MODULE_TYPELESS_PACKAGE_JSON` 警告，npm 脚本只屏蔽这一条。

**测试与工具**

10. 组件测试（Vitest 5 + jsdom 30 + Testing Library 16.3 + React 19.3）可行，需要：内联 `next-intl`
    （其 ESM 构建导入不带扩展名的 `next/navigation`）、只部分替换 `next/navigation`、在初始化文件中执行 `cleanup`
    并开启 `IS_REACT_ACT_ENVIRONMENT`（未开启 Vitest 全局变量时 Testing Library 无法自动注册）。
    Vite 8 原生支持 `resolve.tsconfigPaths`，不再需要 `vite-tsconfig-paths`。jsdom 30 要求 Node ≥ 24.15.0，`engines` 已据此提高。
11. 变异验证：去掉切换器保留 query/hash 的代码后组件测试失败；把审计例外的复核日期改为过去后审计门槛失败。
12. 工作流校验：actionlint 1.7.12 与 zizmor 1.30.1（pedantic）无发现；zizmor 要求 Dependabot 冷却期至少 7 天。
13. Node 24 于 2026-10-20 进入维护期，2028-04-30 停止支持；Node 26 于 2026-10-28 成为 LTS。

**本地验证结果（2026-10-12）**

| 检查 | 结果 |
|---|---|
| `npm run check`（lint、typegen+tsc、Prettier 含类名排序、Vitest 单元与组件 50 项） | 通过 |
| `npm run build` | 通过；三语首页 `○`，分享图 `●`，苹果图标 `○` |
| `npm run e2e`：冒烟 31 项 + Playwright 10 项 | 全部通过 |
| `npm run audit:deps` | 通过；生产依赖 0 条公告，开发依赖 1 条已接受（复核 2027-01-12） |
| `npm run release:check` | 按设计失败：内容状态为 `demo` |
| actionlint、zizmor | 无发现 |

**复核条件补充**

- 升级 next：复核结论 7–8（元数据合并与路由放行）。
- `braces` 出现修复版本、`@next/eslint-plugin-next` 改变 `fast-glob` 依赖、或复核日期到期：重新评估审计例外。
- Node 26 成为 LTS 后：评估升级（`.nvmrc`、`engines`、Docker 基础镜像、jsdom 与 Vitest 的引擎要求）。
- GitHub 推出工作流级 Action 依赖锁定后：复核"SHA + 版本注释"的写法。

## 2026-10-12 评审与修复

对本地工作区做了多代理对抗式评审，每条发现由两名独立验证者复核。下列各条均已在本会话重新取证，
范围为 next 16.4.0、next-intl 4.14.9、npm 11.19.0 与 Chromium（Playwright 1.64.0）。

**更正**

1. 结论 10 的机制需要更正：切换语言不是"重挂载后丢失位置"。Cache Components 下 Next.js 用 React 的 `<Activity>`
   把上一语言的树隐藏保留（`display: none`，最多保留 3 条路由）。依据是随包文档 `cacheComponents.md` 的
   "Navigation with Activity"与 `guides/preserving-ui-state.md`。新语言的树挂载或重新显示，并排在文档最前，
   因此同一 id 会在 DOM 中重复出现（Chromium 实测 en→ja→en→zh）。切换器以 `scroll: false` 导航，带 hash 时
   浏览器停在原处：去掉恢复逻辑后，`#services` 停在视口上方约 850px（变异验证）。不带 hash 时 Chromium
   自己保持位置；只有同时让导航滚动并去掉恢复，位置才回到 0（变异验证）。浏览器测试须用可见性感知的定位。
2. 2026-10-12 补充第 7 条需要更正：根目录图标只作用于应用渲染的页面。proxy 的 404 文档原本没有图标，
   现在引用 `/icon.svg`，由冒烟检查覆盖。`/favicon.ico` 不存在，返回 404。
3. 结论 9 所述 `html:lang(…)` 字体选择器已改为 `:lang(…)`，带 `lang` 的任意元素（如切换器中的语言名）
   也会使用对应字体栈。

**运行与路由**

4. 绕过 proxy 的 404 带一年共享缓存。本地容器中，不存在的 `/_next/static/chunks/*.js`、`/favicon.ico` 与
   `/fr/x.txt` 都由预渲染的 `_not-found` 回答，状态 404，`Cache-Control: s-maxage=31536000`；proxy 返回的
   404 文档为 `no-store`。源站不能按状态码改写这个头，P3 的处理见上一节。
5. matcher 的排除项原为前缀匹配，`/healthz-x`、`/apple-icon/x` 因此也绕过 proxy，得到第 4 条的缓存外壳。
   现在锚定整条路径（`/_next/`、`healthz$`、`apple-icon$`）。单测使用 `next/experimental/testing/server`
   的 `unstable_doesMiddlewareMatch`，冒烟检查也覆盖。变异验证：换回旧写法后单测失败。
6. 切换器解码 hash 时没有处理非法转义：`#100%` 会在 effect 中抛出 `URIError`，导致页面崩溃。
   现在解码失败时按原文查找；组件测试覆盖，并经变异验证。
7. 页面补上 `og:locale`（`zh_CN`、`en_US`、`ja_JP`，来自语言注册表的 `ogLocale`），其他语言列为
   `og:locale:alternate`。

**供应链与审计**

8. npm 处于离线配置时，`npm audit` 返回结构完整的空报告，审计门槛会误判为通过。现在固定传
   `--offline=false`；实测 `npm_config_offline=true` 时仍会查询注册表。
9. 例外的适用条件已收紧：npm 报不出依赖路径，或已有不需升主版本的修复时，例外不再生效。
10. `npm audit --omit=dev` 仍会报告 devOptional 的包。next 把 `@playwright/test` 列为可选 peer，根目录又把它
    装为开发依赖，lockfile 因此把 Playwright 的三个包和 `@types/react`、`csstype` 标为 devOptional。
    原策略下，Playwright 若出现无修复的公告，会被当作生产依赖处理，而且不允许例外。现在策略按 lockfile
    计算从 `dependencies` 经依赖、可选依赖和必需 peer 可达的包。只有每个受影响副本都被 npm 标为 devOptional
    且不可达时，才按开发依赖处理。对本仓库 lockfile 的结果：上述 5 个包按开发依赖处理；同为 devOptional
    的 `semver` 经 sharp 进入 standalone 输出，仍按生产依赖处理。standalone 输出中没有 Playwright。
11. Dockerfile 去掉浮动的 `# syntax=docker/dockerfile:1`，改用构建器内置的前端。
12. Dependabot 一旦设置自定义 `labels`，就不再自动创建默认标签，而新仓库没有 `dependencies` 标签。
    已去掉该设置，使用默认标签。
13. lockfile 根条目的 `engines` 已与 `package.json`（`^24.15.0`）重新同步。同步时补入了
    `@tailwindcss/oxide-wasm32-wasi` 的捆绑依赖条目，解析版本不变。
14. 考虑过以只读方式挂载检出目录运行 Playwright 容器。运行器开始时会删除并重建项目根下的 `test-results/`
    与 `playwright-report/`，只读的上级目录使删除返回 `EROFS`（实测），只能改用非默认的输出位置。
    因此按 Playwright 的 Docker 指南保留读写挂载。

**测试与文档**

15. 新增单元测试：matcher、偏好 Cookie（含 `Secure`）、`site.url` 的固定值、`CLAUDE.md` 只导入 `AGENTS.md`、
    文档相对链接、颜色 token 副本（404 文档、`brandColors`、`icon.svg`）与 `globals.css` 一致，以及审计策略的
    新分支。浏览器主题测试也改为读取 `globals.css`。新增组件测试：无 hash 时恢复位置、非法 hash，
    以及修饰键点击时页面不阻止默认行为。
16. 浏览器测试的改动：历史替换先建立真实的上一条记录再后退；测试 Cookie 按 `baseURL` 设置，可以对任意主机运行；
    窄屏溢出检查遍历语言注册表。
17. 文档更正：页面注释中的分享图路径；`public-pages.ts` 的读取者（导航来自 `homeSectionIds`，删除了无人读取的
    `navKey`）；`next.config.ts` 中关于 sharp 的说明（standalone 输出仍含 sharp，只是不调用）；Dependabot 的覆盖范围；
    开发指南中复制的易变事实改为链接本记录。

**来源补充**

18. GitHub 托管运行器：`ubuntu-latest` 自 2026-10-19 起分几周切换到 Ubuntu 26.04，计划 2026-11-19 完成
    （[actions/runner-images#14748](https://github.com/actions/runner-images/issues/14748)，2026-09-17 发布，
    2026-10-12 核对）。`ubuntu-26.04` 于 2026-09-17 正式可用
    （[#14747](https://github.com/actions/runner-images/issues/14747)）。CI 固定使用 `ubuntu-24.04`。

**本地验证结果（评审修复后，2026-10-12）**

| 检查 | 结果 |
|---|---|
| `npm run check`（Vitest 单元与组件 70 项） | 通过 |
| `npm run build` | 通过；路由形态不变，standalone 输出中有 sharp、没有 Playwright |
| `npm run e2e`：冒烟 34 项 + Playwright 11 项 | 全部通过；容器已停止 |
| `npm run audit:deps` | 通过；生产依赖 0 条公告，开发依赖 1 条已接受 |
| `npm audit signatures` | 466 个包的注册表签名与 140 个来源证明通过 |
| `npm run release:check` | 按设计失败：内容状态为 `demo` |
| actionlint；zizmor（pedantic，离线与在线） | 无发现 |
| `scripts/e2e.sh` 的 shellcheck 0.11.0（actionlint 镜像内置）；`docker buildx build --check` | 无发现；两者都已先对坏样本报错 |
| JSON、YAML 严格解析（拒绝重复键）；`docker compose config` | 通过 |
| 变异验证 | 旧 matcher、未保护的 hash 解码、跟随可选 peer、token 漂移、坏链接、去掉滚动恢复：对应测试均失败 |

**复核条件（评审）**

- 升级 next：复核第 1、4 条（Activity 保留路由与 DOM 顺序、绕过 proxy 的 404 缓存头），并确认
  `unstable_doesMiddlewareMatch` 仍可用。
- 升级 npm：复核 devOptional 标记与 `--omit=dev` 的语义（第 10 条）。
- CI 运行器迁移到 Ubuntu 26.04 前：在其上跑通 `npm run e2e`，并为 actionlint 声明新标签。

## 未关闭的缺口

- Tunnel 到候选源站的可达性、实际 Host 行为与 TLS/HSTS 未验证（P3）。
- 三语文案、标志与分享图为 demo，待品牌负责人确认（P2）；联系邮箱已确定。外链与产品入口尚无内容。
- 浏览器检查仅覆盖 Chromium 桌面视口与模拟窄屏，语言切换时的滚动保持未在其他引擎上验证；
  首屏性能未在固定条件下测量（P2）。
- Cloudflare 对非 2xx 响应的缓存规则尚未配置与验证（P3，见"P3 前需核对的 Cloudflare 事实"）。
- 2026-10-12 决定建立公开仓库。首次推送之前，CI、依赖审查与 Dependabot 配置只在本地校验过；
  首次推送后的运行结果以 GitHub Actions 的记录为准，尚未记入本记录。
