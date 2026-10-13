# 模板产品线调查：同时有免费版与付费版的区块库

Status: 调查快照，2026-10-13 至 2026-10-14（Asia/Tokyo）；价格与条款随时可能变化，购买前按“复核条件”重新核对

## 问题与范围

[项目设计方案](plan-homepage-foundation-2026-10-11.md) 2026-10-14 的决定是：模板现阶段用免费版，
以后为稳定性和降低维护成本可改用付费版，届时把仓库改为私有；选型优先看同时提供免费版和付费版的产品线。
本记录回答三个问题：哪些产品线符合条件；它们的设计模式与本站的区块配置（`src/config/home.ts`）是否契合；
免费版能否放在公开仓库、付费版能否用于私有仓库中的公司网站。

调查了 13 条产品线：shadcnblocks、Untitled UI React、shadcn/studio、Launch UI、Tailark、Aceternity UI、
Magic UI、Kokonut UI、Flowbite、Preline UI、TailGrids、Astroship、Cruip。证据来自各家的定价、许可、条款与文档页面，
免费仓库的代码，以及免费版与付费版演示站的截图。截图与逐条比较整理在给用户的私有对比页中，不入库；
复查时以下文列出的页面为准。没有购买或试用付费内容。

许可是唯一的硬条件：免费版必须允许商用并放在公开仓库，付费版必须允许用于私有仓库中的公司网站。
其余条件用于打分：区块文字是否通过参数传入，从而能直接接到区块配置；免费版升级到付费版是加区块还是换主题、换模板；
是否以服务端渲染为主；视觉是否依赖本站没有的素材，如产品截图、客户标志或拉丁字母的展示字体。

## 结论

### 设计模式

| 产品线 | 分发方式 | 免费版内容 | 文字走参数 | 渲染 | 免费 → 付费 | 风格 |
|---|---|---|---|---|---|---|
| shadcnblocks | shadcn CLI 复制源码 | 区块与整站模板 | 是（较旧的区块写死） | 服务端为主 | 同一区块库，多解锁区块 | 中性；整站模板偏产品截图 |
| Untitled UI React | 自家 CLI 复制源码 | 组件，少量营销区块，没有首屏区块 | 是（付费区块） | 组件多在浏览器运行 | 加区块 | 中性企业风 |
| shadcn/studio | shadcn CLI 复制源码 | 区块与免费整站模板 | 否，文字写死 | 服务端为主 | 加区块 | 偏活泼 |
| Launch UI | shadcn CLI 复制源码 | 9 类区块，免费与付费是同一区块的不同变体 | 是 | 服务端，免费版纯 CSS 动画 | 换变体 | 深色 SaaS、产品截图 |
| Tailark | shadcn CLI 复制源码 | 约 150 个区块与 3 套主题 | 否，文字写死 | 服务端为主 | 换主题 | 产品型 SaaS |
| Aceternity UI | shadcn CLI；模板是独立项目 | 动效组件 | 部分 | 动画多在浏览器 | 模板另起项目 | 动效重 |
| Magic UI | shadcn CLI；模板是独立项目 | 只有动效组件 | — | 动画多在浏览器 | 模板另起项目 | SaaS、AI |
| Kokonut UI | shadcn CLI 复制源码 | 只有交互组件 | — | 动画多在浏览器 | 范围不同 | AI 产品 |
| Flowbite | npm 包加原生 JS | 组件与区块 | 需改写为 JSX | 交互在浏览器初始化 | 加区块，新旧写法并存 | 传统企业风 |
| Preline UI | npm 包加原生 JS，HTML 源码 | 组件、区块、多页模板 | 需改写为 JSX | 交互在浏览器初始化 | 加页面 | 简洁企业风 |
| TailGrids | 自家 CLI 复制源码 | 组件与少量区块 | 部分 | 组件多在浏览器运行 | 付费模板是 Vite 应用，需移植 | 代理商、企业 |
| Astroship | 整站 fork | 整站模板（Astro） | 否，需换框架 | 服务端 | 换模板 | 创业公司，无深色 |
| Cruip | 整站模板 | 整站模板 | 否 | 滚动动画在浏览器 | 换模板 | SaaS，单主题 |

### 许可与价格（美元，2026-10-13 至 14 页面所示）

| 产品线 | 免费版 | 付费版价格 | 付费许可的关键限制 | 付费后仓库 |
|---|---|---|---|---|
| shadcnblocks | 注册表中的免费区块受网站条款约束（见下节）；旧的免费 GitHub 仓库为 MIT 加 Commons Clause，约一年未更新 | Pro 149 / Premium 299 / Elite 399，一次性；团队 349–599 | 可用于本人、公司或客户的任意数量网站；不得把组件或衍生物发布到公开仓库 | 私有 |
| Untitled UI React | MIT，只含部分组件与区块 | SOLO 349 / STUDIO 999 / BUSINESS 2,499 | 源码不得出现在任何公开位置，违约每次 1 万美元 | 私有 |
| shadcn/studio | MIT 加附加限制，可用于网站 | Pro 199（促销，原价 359）/ 团队 449 | 明确允许开源的最终产品 | 可保持公开 |
| Launch UI | MIT | Pro 99 / Team 499 | 条款只写在 FAQ 中，禁止开源；“不得用于构建在线发布的网站”一句有歧义 | 私有，且需书面确认 |
| Tailark | MIT | 249 / 299 / 团队 499 | 没有书面许可 | 未写明 |
| Aceternity UI | 自定义许可，未明确允许公开仓库 | 每年 169 / 终身 199 / 团队 1,590 | 不得再分发源码 | 私有 |
| Magic UI | MIT | Pro 199 | 不得再分发，违约每次 1 万美元 | 私有 |
| Kokonut UI | MIT | 159（促销 119） | 禁止开源，许可可随时终止 | 私有 |
| Flowbite | MIT | 299 / 团队 999 | 允许开源项目，但不得以分发文件为目的 | 均可 |
| Preline UI | MIT 加 Fair Use，网站可用 | 约 249（页面显示 222 欧元） | 禁止开源 | 私有 |
| TailGrids | MIT | 199 / 团队 349 | 禁止再分发；席位与项目数的说法矛盾 | 私有 |
| Astroship | GPL-3.0 | Pro 49 | 允许开源的最终产品 | 均可 |
| Cruip | 说法互相矛盾，没有许可证文件 | 每个 49–79，合集 79 / 149 | 禁止“托管或再分发衍生作品”，有歧义 | 私有 |

### 推荐

首选 shadcnblocks：区块是独立组件，较新的区块文字走参数，能直接做成区块配置中的一种设计；免费版和付费版是同一个区块库，
升级只是多解锁区块；分类最全（全库含付费：关于 43 个、团队 40 个、联系 30 个、服务 19 个、招聘 16 个、案例 15 个），
适合扩展成通用品牌网站；免费与付费的条款都有书面版本。

备选：愿意早点付费时选 Untitled UI，它设计质量最高、风格最中性，但免费版没有首屏区块，许可最严；
付费后仍想保持仓库公开时选 shadcn/studio，它的付费许可明确允许开源，但区块文字写死，需要先改成参数。
Launch UI 的结构最好（同一区块分免费与付费变体），但视觉是深色产品截图风格，付费条款只在 FAQ 中且有歧义。
其余产品线或免费版只有动效组件，或需换框架、换模板，或许可不清楚。

## shadcnblocks 的接入核实（2026-10-14）

在分支 `feat/shadcnblocks-comparison` 上把 5 个免费区块接入区块配置，与现有设计对比（方案 2026-10-14 的决定）。
版本：shadcn CLI 4.21.4，`@base-ui/react` 1.8.0，`class-variance-authority` 0.7.1，`cn` 0.4.0，`lucide-react` 1.52.0。

1. **注册表与条款。** 在 `components.json` 中登记 `https://www.shadcnblocks.com/r/{style}/{name}` 即可安装免费区块，
   不需要密钥；付费区块返回 401，需要 `SHADCNBLOCKS_API_KEY`。`{style}` 为 `base-*` 或 `aria-*` 时返回 Base UI 或
   React Aria 版本，旧的 `/r/{name}` 总是 Radix 版本。[网站条款](https://www.shadcnblocks.com/terms)（页面无日期，
   2026-10-14 读取）允许把免费区块装入最终产品并修改，包括商用产品，并保存在该产品的仓库中，包括公开仓库；
   不允许把免费区块作为库、套件、模板或目录再发布，不允许删除版权声明、许可元数据、署名或标识。
   用自动方式获取注册表内容，只能通过 shadcn CLI、MCP、IDE 扩展或基于 CLI 的工具，用于搜索、查看或安装。
2. **区块质量。**
   - 较新的免费区块（hero115、feature43、about29、cta10）文字走参数；较旧的（process1、services4、timeline9）
     把文字写在代码里，需要改写成参数，timeline9 还用 `dangerouslySetInnerHTML` 渲染内容。
   - 每个区块都带 `defaultProps` 演示内容，其中有虚构的客户与评价，例如 hero115 的
     “Trusted by teams at Arc, Notion, Raycast, and more”、hero7 的 206 条评价 4.9 分。照搬时，缺少的文案会退回这些内容，
     与方案第 2 节“不编造客户、成果、评价”冲突，所以接入时删除演示内容，并把参数改为必填。
   - Base UI 版区块用 `<Button render={<a />} nativeButton={false}>` 渲染链接。Base UI 的 `Button` 总会加上
     `role="button"`，链接因此被读作按钮；shadcn/ui 的 Base UI 按钮文档明确不建议这样渲染链接，推荐在 `<a>` 上用
     `buttonVariants`。Radix 版用 `asChild`，没有这个问题。
   - 上游代码不能直接通过本项目的 lint：`interface Hero115Props extends HeroBasicProps {}` 这类空接口违反
     `@typescript-eslint/no-empty-object-type`（错误），`<img>` 触发 `@next/next/no-img-element`（警告）。
     类型检查本身能通过。
   - 区块依赖 shadcnblocks 主题对 `container` 的定义（居中并加内边距）；Tailwind v4 默认的 `container` 不居中。
   - 区块按英文短标题设计。中文的大标题在窄栏中会在词中间换行，例如 hero115 的首屏标题与 process1 的“我们的工作方式”。
3. **shadcn CLI（4.21.4）。**
   - `add -p <目录>` 会把区块依赖的 `ui` 组件也复制到该目录，并改写区块的导入；不带 `-p` 时区块写到
     `src/components/<名称>.tsx`，`ui` 组件写到 `src/components/ui/`。
   - 没有运行 `init` 时，`add` 只安装区块声明的依赖（`cn`、`lucide-react`），不会安装 `button.tsx` 用到的
     `@base-ui/react` 与 `class-variance-authority`。
   - `add` 安装的是当天的最新版：`lucide-react` 1.56.0 发布不到一天，不符合 7 天冷却期，改为 1.52.0。
4. **shadcn/ui 的现状。** 2026-07-02 起 Base UI 是默认组件库（`init --defaults` 使用 `base-nova`），Radix 继续受支持；
   2026-09 起组件从 npm 包 `cn`（`shadcn-ui/cn`，MIT，带来源证明）导入 `cn`。颜色变量用语义名，
   其中 `accent`、`muted` 与本站原来的同名 token 含义不同，所以本站的颜色变量改用 shadcn/ui 的命名。
5. **页面代价。** 区块只用 `buttonVariants`，但 `button.tsx` 还导入了 Base UI 的 `Button`（客户端组件）。
   起初 `/en` 的脚本比 main 多 9,525 字节（压缩前；main 为 627,641 字节，分支为 637,166 字节）。把 `buttonVariants`
   拆到单独文件后，页面脚本里不再有 Base UI 的代码，仍多 2,523 字节：其中 2,511 字节是 lucide-react 的图标基础代码，
   12 字节来自改名后更长的类名。lucide-react 1.52.0 的 `Icon` 与 `context` 模块都标了 `"use client"`，
   所以只要页面的模块图里有用 lucide 图标的区块就会加载，即使区块没有渲染。所有区块用 `velora` 与用 `shadcnblocks`
   时，页面脚本总量相同（630,164 字节）。
6. **现有设计不受影响。** 颜色变量改名并加入 shadcn/ui 的基础样式后，把所有区块设为 `velora` 构建，
   与 main 在中英日三种语言、桌面与手机、浅色与深色下的整页截图逐像素比较（关闭动效），12 组完全一致。

## 复核条件

- 价格与条款页面都没有日期。购买前重新核对 shadcnblocks 的[价格](https://www.shadcnblocks.com/pricing)、
  [付费许可](https://www.shadcnblocks.com/license)与[条款](https://www.shadcnblocks.com/terms)，并确认所选层级包含要用的区块。
- 改为私有仓库前，核对 GitHub 私有仓库可用的规则集与代码扫描功能（方案 2026-10-14 决定的影响项）。
- 升级 shadcn CLI 或添加区块时，按 [development.md](../../development.md) 的“区块的两种设计与 shadcnblocks”
  重新检查上述行为；它们只对本记录所列版本成立。
- 其他产品线的结论只在选型重新开放时复查。
