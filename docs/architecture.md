# 实现结构

本页解释当前实现的请求流程、模块职责与已知限制。选型理由与验收要求在
[项目设计方案](reviews/homepage-foundation/plan-homepage-foundation-2026-10-11.md)，
本页只描述代码实际的样子；与方案不一致处以
[P1 验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md) 中的证据为准。

## 请求流程

```text
浏览器 ──► Cloudflare ──► cloudflared（P3）──► web 容器：node server.js（standalone）
                                                   │
                                   next.config headers()：安全响应头（所有响应）
                                                   │
                                   src/proxy.ts（matcher 排除 /_next/ 下的路径、恰为 /healthz 或 /apple-icon 的路径、带扩展名的路径）
                                   ├─ "/"              → 协商语言，307 到 /zh|/en|/ja，private no-store，保留查询参数
                                   ├─ 首段不是语言      → 英文 404 文档（如 /about、/fr、/404、/healthz-x）
                                   ├─ 首段是语言，其余为该段的元数据路由 → 放行（/{locale}/opengraph-image）
                                   ├─ 首段是语言，其余路径未登记 → 该语言的 404 文档（如 /ja/missing）
                                   └─ 已登记页面        → next-intl middleware → App Router
                                                   │
                                   src/app/[locale]/layout.tsx（根布局，html lang、字体、metadataBase）
                                   ├─ page.tsx（首页分区；canonical、hreflang、Open Graph）
                                   ├─ opengraph-image.tsx（每种语言一张，构建时生成）
                                   └─ not-found.tsx／[...rest]（应用内 404 安全网）
```

未经 proxy 的路径（带扩展名的 `/fr.html`、`/ja/x.txt`，以及 `/_next/*`、`/healthz`、
`/sitemap.xml`、`/robots.txt`、`/icon.svg`、`/apple-icon`）由各自的处理器或 Next.js 的 404 处理回答；
后者的缓存头见"渲染与缓存"。排除项锚定整条路径，`tests/unit/proxy-matcher.test.ts` 检查哪些路径进入 proxy。

## 模块与职责

| 模块 | 职责 | 唯一来源 |
|---|---|---|
| `src/config/locales.ts` | 语言注册（ID、BCP 47 标签、显示名、Open Graph 地区代码）、默认语言、国家兜底表、偏好 Cookie 名与期限；导入时自检 | 语言事实 |
| `src/config/site.ts` | 品牌名、规范域名、联系邮箱、产品入口、外链、`contentStatus`（`placeholder`／`demo`／`confirmed`）；`findSiteReleaseErrors` 供发布门槛 | 站点事实 |
| `src/config/public-pages.ts` | 已发布公开页面（无语言前缀）；proxy 与 sitemap 读取。页眉导航不读它，分区导航来自 `homeSectionIds` | 页面清单 |
| `src/i18n/negotiation.ts` | 纯函数：解析 `Accept-Language`、best-fit 匹配、偏好 → 浏览器 → 可信国家 → 默认 | 协商规则 |
| `src/i18n/preferences.ts` | `SABERU_LOCALE` 的读取与序列化（host-only、`Path=/`、`SameSite=Lax`、365 天、HTTPS 下 `Secure`） | 偏好 Cookie |
| `src/i18n/routing.ts` | `defineRouting`：`localePrefix: 'always'`、`localeDetection: false`、`localeCookie: false`、`alternateLinks: false` | next-intl 配置 |
| `src/i18n/navigation.ts` | `createNavigation` 导出的 `Link`、`usePathname`、`getPathname` 等 | 语言感知导航 |
| `src/i18n/request.ts` | `getRequestConfig`：显式 `locale` 参数优先，否则读 `next/root-params`；非法值回退默认语言；按语言加载 `messages/*.json` | 请求期文案 |
| `src/i18n/not-found-document.ts` | proxy 返回的完整 404 文档（本地化、`noindex`、不回显路径、引用 `/icon.svg`）；读不到样式表，内联一份颜色 token 副本 | 404 文档 |
| `src/proxy.ts` | 上文的分流逻辑；`TRUST_CF_IPCOUNTRY=true` 时才把 `CF-IPCountry` 交给协商 | 入口策略 |
| `src/app/[locale]/layout.tsx` | 根布局；`generateStaticParams` 枚举语言；非法 locale 调用 `notFound()`；`metadataBase`、标题、描述 | 文档外壳 |
| `src/app/[locale]/page.tsx` | 组合首页分区；页面级 `alternates`（canonical、三语 hreflang、`x-default=/`）与 `openGraph`（类型、站点名、URL、标题、描述、`og:locale` 与其他语言的 `og:locale:alternate`），错误页因此不继承 | 首页 |
| `src/app/[locale]/opengraph-image.tsx` | 1200×630 品牌分享图，`generateStaticParams` 使每种语言在构建时生成一张；只含品牌标志、名称与域名，不随文案漂移 | 分享图 |
| `src/app/icon.svg`、`src/app/apple-icon.tsx`、`src/components/brand-mark.tsx` | 网站图标、苹果触控图标（构建时生成的 PNG）、标志的 JSX 版本；几何一致，修改时同步 | 品牌标志 |
| `src/app/[locale]/not-found.tsx`、`[...rest]/page.tsx` | 应用内 `notFound()` 的边界与安全网 | 应用内 404 |
| `src/app/healthz/route.ts` | `connection()` 后返回 `{status:"ok"}`，`no-store` | 进程存活 |
| `src/app/sitemap.ts`、`robots.ts` | 由语言注册与页面清单派生；每条列出全部语言含自身，首页含 `x-default` | 抓取信息 |
| `src/app/globals.css` | Tailwind v4 导入、浅深色 token（`:root` + `prefers-color-scheme`，经 `@theme inline` 映射）、按 `:lang()` 的中日字体栈（作用于任何带 `lang` 的元素，如切换器中的语言名）、焦点样式；404 文档、`brandColors` 与 `icon.svg` 中的颜色副本由 `tests/unit/design-tokens.test.ts` 对照 | 设计 token |
| `src/components/home-sections.tsx` | 首页分区（主视觉、服务、工作方式、关于、联系）与 `homeSectionIds`；卡片按文案中的条目生成 | 首页结构 |
| `src/components/site-header.tsx`、`site-footer.tsx` | 页眉（标志、按 `homeSectionIds` 生成的分区导航、切换器）、页脚（`use cache` 的年份） | 页面框架 |
| `src/components/language-switcher.tsx` | 客户端组件：真实链接可无 JS 使用；有 JS 时写偏好 Cookie、`router.replace` 到目标语言并保留 query/hash/滚动意图 | 语言切换 |

`messages/zh.json`、`en.json`、`ja.json` 的键集合、非空与 ICU 参数由单元测试保证；
`src/global.d.ts` 把英文文案的结构注册为 next-intl 的 `Messages` 类型，键名在编译期检查。
服务与工作方式的卡片按 `home.services.items`、`home.approach.items` 中的键依次生成，
增删卡片只改三份文案。`site.contentStatus` 记录文案由谁负责，发布门槛只接受 `confirmed`。

## 元数据与分享

- 标题、描述、Twitter 卡片类型在根布局；canonical、hreflang 与 Open Graph 在页面上。
  `og:locale` 取语言注册表的 `ogLocale`（如 `zh_CN`），其他语言列为 `og:locale:alternate`。
  Next.js 按段浅合并元数据：页面一旦设置 `openGraph`，就整体替换上级段的同名字段，
  包括上级目录的 `opengraph-image`。因此分享图放在页面所在的 `[locale]` 段，而不是 `app/` 根目录。
- `[locale]` 下的元数据图片路由同样是动态段，没有 `generateStaticParams` 时会在请求时渲染；
  分享图因此自带语言参数，构建输出中三条为 `●`。
- 这类路由没有扩展名，proxy 只在首段是已注册语言时放行（`localeMetadataRoutes`），
  `/fr/opengraph-image` 等未知前缀仍得到 404 文档，不会触发运行时渲染。

## 渲染与缓存

- Cache Components 开启（`cacheComponents` + `partialPrefetching`）。构建输出中 `/zh`、`/en`、`/ja`
  为 `○ Static`，三张分享图为 `●`，`/apple-icon`、`/icon.svg`、`/sitemap.xml`、`/robots.txt` 为 `○`，
  `/[locale]` 与 `/[locale]/[...rest]` 的兜底外壳为 `◐`，`/healthz` 为 `ƒ`。
- 页脚年份通过 `"use cache"` + `cacheLife("days")` 计算，是页面中唯一随时间变化的值；
  因此三语页面的 `Cache-Control` 为 `s-maxage=86400, stale-while-revalidate=518400`。
  Cloudflare 默认不缓存 HTML；若日后开启 HTML 边缘缓存，这个值会生效，需同时处理 RSC 请求的 `Vary`。
- 根路径 307 为 `private, no-store`，`Vary: Accept-Language, Cookie`；`/healthz` 与 404 文档为 `no-store`；
  带哈希的 `/_next/static/*` 为一年 `immutable`。
- 绕过 proxy 的 404（不存在的 `/_next/static/*` 文件、`/favicon.ico`、带扩展名的未知路径）由 Next.js 预渲染的
  `_not-found` 回答，带 `Cache-Control: s-maxage=31536000`：共享缓存可以把这个 404 保存一年。
  例如回滚后再次切换时，边缘可能一直对新版本的资源返回缓存的 404。源站不能按状态码改写这个头，
  所以 P3 需要在 Cloudflare 上让非 2xx 响应不被缓存（见验证记录的"P3 前需核对的 Cloudflare 事实"）。
- 运行时写入：Next.js 16.4 会把按需渲染的动态参数路由写到 `.next/server/route-cache`，
  并可能使用 `.next/cache`；两处在容器中为有界 tmpfs，根文件系统保持只读。

## 为什么 404 在 proxy 里渲染

Next.js 16.4 + Cache Components 下，页面调用 `notFound()`（或根布局拒绝非法 locale）时，
服务端只输出 `<html id="__next_error__">` 的空外壳与 RSC 负载，可见的 404 界面由客户端 JavaScript
渲染；HTTP 状态为 404、含 `noindex`，但没有 `lang`、标题与正文。这不满足方案对错误页
"使用相应语言、无 JavaScript 仍可读"的要求，所以按方案第 5 节的退路，proxy 对未知文档路径直接
返回完整的本地化 404 文档；应用内的 `not-found.tsx` 与 catch-all 仅作为绕过 proxy 的路径
（带扩展名）与未来 `notFound()` 调用的安全网。实验性的 `global-not-found` 未启用。

## 语言与偏好

- URL 决定页面语言；只有 `/` 做协商。`/fr`、`/about` 不补前缀，直接 404。
- 主动偏好只由切换器写入 `SABERU_LOCALE`；访问 `/ja` 不会改写它。next-intl 的
  `NEXT_LOCALE` Cookie、浏览器语言识别与 HTTP `Link` alternate 头全部关闭。
- 切换语言会替换 `[locale]` 下的整棵树。Cache Components 下 Next.js 用 React 的 `<Activity>`
  把上一语言的树隐藏保留（`display: none`，最多保留 3 条路由），新语言的树挂载或被重新显示，
  并排在文档最前（2026-10-12 实测）。切换器以 `router.replace(…, { scroll: false })` 导航：
  不带 hash 时 Next.js 不会滚到页首；带 hash 时浏览器也不会滚到对应分区。切换器在导航前记录滚动位置与 hash，
  可见树中的切换器运行 effect 时恢复：有 hash 时滚到对应分区，与直接打开目标 URL 一致；否则回到原位置
  （Chromium 本身已保持该位置，恢复是跨浏览器的兜底）。隐藏的树仍在 DOM 中，同一 id 会重复出现：
  浏览器测试必须用可见性感知的定位（`getByRole`，或 `filter({ visible: true })`）。
- 无 JavaScript 时语言链接仍是真实链接，但不承诺记录主动偏好（与方案一致）。

## 已知限制与后续

- 浏览器基线：Tailwind CSS v4 需要 Chrome 111+、Safari 16.4+、Firefox 128+；更旧浏览器不在支持范围。
- 图片优化关闭（`images.unoptimized`），P1 无位图；引入真实图片时再决定优化与缓存目录大小。
- 中日文字体依赖系统字体栈；拉丁字体为自托管 Geist（`geist` 包，完整字形）。
- 绕过 proxy 的未知路径（带扩展名）得到的是客户端渲染的 404 外壳，可接受。
- next-intl 已将 `requestLocale` 与 `setRequestLocale` 标记为废弃，本项目未使用。
- 绕过 proxy、带扩展名的未知路径会由 Next.js 按需渲染，并在有界的 `route-cache` tmpfs 中留下记录；
  大量不同路径只会填满这块有界空间，不影响根文件系统。
- 安全：已知、尚未处理的框架安全更新记录在 [P1 验证记录](reviews/homepage-foundation/investigation-p1-framework-2026-10-11.md)
  与方案的 P3 进入条件中；处理流程见 [development.md](development.md) 的"依赖版本与安全更新"。
