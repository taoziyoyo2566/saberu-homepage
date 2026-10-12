# saberu.com 的 Cloudflare 现状：调查记录

本记录回答：saberu.com 当前在 Cloudflare 上如何对外提供服务，哪些事实约束 [Cloudflare 配置代码化方案](plan-cloudflare-config-2026-10-12.md)与[主页方案](../homepage-foundation/plan-homepage-foundation-2026-10-11.md) P3 的切换。所有结论都是带日期的快照；执行任何 Cloudflare 变更前按“复核条件”重新核对。

## 1. 公开探测（2026-10-12）

**方法**：2026-10-12 约 10:47（Asia/Tokyo）从开发主机发起，不使用任何 Cloudflare 凭据。包括：经公共解析器 1.1.1.1 与区域权威服务器查询 DNS；对主域发送 HTTPS 与 HTTP 请求（GET、HEAD、POST，多个路径）；用不同 SNI 做 TLS 握手查看证书。

| 对象 | 观察结果 | 对切换的约束 |
|---|---|---|
| 主域 `saberu.com` | 解析到 Cloudflare 代理地址；所有路径与方法都返回 503 维护页，响应为 `text/html`、`no-store`，没有 `cf-cache-status`，也没有源站特征头。HTTP 请求 301 到 HTTPS | 与用户所说“由 Worker 提供”一致；挂载方式见第 2 节 |
| `www.saberu.com` | 没有任何记录。区域启用 DNSSEC，Cloudflare 对不存在的名称返回 NOERROR 与 NSEC，不返回 NXDOMAIN；不能据此判断记录存在 | P3 需新建记录并配置 301 到主域 |
| DNS 与 DNSSEC | 权威服务器为 Cloudflare；DS 已发布，公共解析器返回 `ad` 验证标志 | 无 |
| 根域邮件与验证记录 | 根域有 MX、SPF、DMARC 与多条站点验证 TXT 记录 | 切换只改主页相关记录，这些记录必须保持不变 |
| 区域内其他子域 | 至少一个其他子域在用，返回自己的服务响应，不受维护页影响 | 说明维护页只挂在主域；切换不得改动其他子域 |
| 证书 | Google Trust Services 签发，有效期至 2027-01-01，由 Cloudflare 自动续期。主域使用的证书同时覆盖另一个子域；`www` 等其他名称由覆盖 `saberu.com` 与 `*.saberu.com` 的证书提供 | `www` 已有证书覆盖，不需要另行签发 |
| HSTS | `max-age=0; includeSubDomains; preload`，相当于未启用 | 是否启用属于区域级设置，影响所有子域，另行决定 |
| Cloudflare 对页面的改写 | 响应 HTML 中被注入机器人检测脚本（`/cdn-cgi/challenge-platform/`）与 AI 爬虫陷阱的隐藏链接（`/cdn-cgi/content`），响应头带 Speed Brain 的 `speculation-rules` | 切换后同样作用于主页 HTML。主页的 CSP 只有 `frame-ancestors`，不会拦截注入脚本；对线上做冒烟检查时，不要把 HTML 的逐字比对当作期望 |

与 2026-10-10 的旧记录（已归档）相比，只有证书分配变化：主域现在使用的证书还覆盖另一个子域。其余观察一致。

## 2. API 令牌核对（2026-10-12，只发读取请求）

**方法**：2026-10-12 约 11:45（Asia/Tokyo），用 API 令牌经 IPv4 只发 GET 请求，查询区域、DNS 记录、Workers 路由与自定义域、Tunnel、区域设置与重定向规则。令牌限制了来源 IP，而主机访问 Cloudflare API 默认走 IPv6，所以必须用 IPv4；Terraform 容器默认走 IPv4。所用令牌当时存放在只读令牌的位置，事后用户确认它是带编辑权限的 P3 令牌，已移到写令牌的位置；本节的查询、导入与计划都只读取，没有对 Cloudflare 发出写请求。机器人防护一行与复核计划使用之后新建的只读令牌。

| 对象 | 结果 | 对切换的约束 |
|---|---|---|
| 维护页的挂载方式 | **Worker 自定义域**：`saberu.com` 绑定 Worker `down-page`（production）。区域内没有 Workers 路由 | 移除自定义域的接口需要账户级的 Workers Scripts Edit 权限 |
| 主域的 Web 记录 | 只有一条 `AAAA 100::`（代理），只读，`meta.origin_worker_id` 指向上述 Worker，由自定义域生成 | 不能单独管理或删除。Tunnel 需要在主域建 CNAME，而 CNAME 不能与其他记录共存，所以必须先移除自定义域再建 CNAME，期间主域会短暂无法访问；顺序与时长在 P3 运行说明中确定 |
| 主域的其他记录 | MX、SPF、DMARC 与站点验证 TXT，都不经代理 | 保持不变，Terraform 不纳入 |
| `www` | 没有记录 | P3 新建 |
| Tunnel | 账户中已有多条在用的 Tunnel，都不属于主页 | 主页新建专用 Tunnel，不复用、不修改已有的 |
| 其他 Worker | 账户中还有其他 Worker，另有一个其他主机名的自定义域 | 不纳入 |
| 区域设置 | 始终使用 HTTPS：开；SSL 模式 `full`；最低 TLS 1.2；HSTS 已启用但 `max-age=0`，带 `includeSubDomains`、`preload`、`nosniff`；Speed Brain：开；自动 HTTPS 重写：开 | 都是区域级设置，影响其他子域，不随主页切换改动 |
| 重定向规则 | 区域没有 Single Redirect 规则 | `www` 跳转需新建 |
| 机器人防护 | Bot Fight Mode：开；JavaScript 检测：开；AI 爬虫：阻止；AI 爬虫陷阱（crawler protection）：开；由 Cloudflare 管理 robots.txt：开，其中 AI 训练设为不允许 | 都是区域级设置。切换后，对外的 robots.txt 会经 Cloudflare 改写或补充，不再等于源站输出；Bot Fight Mode 可能对外部的脚本化检查发出挑战。P3 的外部冒烟检查以实际响应为准，是否调整这些设置由用户另行决定 |

**纳入 Terraform 的结果**：维护页的自定义域已导入为 `cloudflare_workers_custom_domain.apex_maintenance`，导入后生成计划，结果为无变更；同日换用只含读取权限的令牌复核，仍为无变更。维护页 Worker 的代码、设置、自定义域与主域记录已备份到 `deploy/recovery/2026-10-12-maintenance-worker/`；该目录被 Git 忽略，因为维护页内容不宜进入公开仓库。

**状态锁**：R2 支持条件写入。存在锁文件时，再次以 `If-None-Match: *` 写入返回 412，Terraform 报 `Error acquiring the state lock` 并停止，所以 `use_lockfile` 在 R2 上有效。

## 复核条件

- 执行任何 `terraform apply` 或 P3 切换之前，重新核对第 1 节，并用只读令牌重新生成计划，确认无变更。
- 维护页、DNS、证书或区域设置被人在控制台修改之后。
