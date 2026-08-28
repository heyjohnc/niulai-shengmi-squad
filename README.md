# 牛来生米小队 / Niulai Shengmi Squad

**一个完全离线、确定性、只读的四 Agent 市场剧情参考实现：票先冻结，模型后接话，所有结果只在纸面发生。**

本仓库是从零编写、拥有独立 Git 历史的 clean-room public reference。它演示一条完整纵向切片：synthetic market snapshot → 云雀候选卡 → `FACT / INFERENCE / OPEN_QUESTION` → 四人独立 50% `RANDOM_ONLY` `BUY/PASS` → 3/4 决议 → `PAPER_ONLY` 开仓 → 确定性价格轨迹 → TP 或 SL → 四角色本地 fallback → canonical single timeline → GET-only API → 浏览器 UI。

另有一个不足三票、不开仓、先跌后拉的观察/回旋镖 fixture，以及一个只能使用 injected fake transport 的 execution-safety-lab。

## 5 分钟 demo

需要 Node.js 20 或更高版本。无需 key、网络、钱包或环境文件。

```bash
npm ci
npm test
npm run validate
npm run demo
npm run serve
```

打开 `http://127.0.0.1:4173`。页面可以切换三条确定性 fixture：`3/4 → TP`、`3/4 → SL` 和 `不足三票`。

`npm run demo` 会在被 Git 忽略的 `output/demo-summary.json` 写入可重复生成的摘要。`npm run fixtures:generate` 会从代码重新生成所有 checked-in fixture；`npm run validate` 会验证 fixture 没有漂移。

## 架构

```text
deterministic synthetic generator
  → sourced candidate + three claim types
  → four independent frozen RANDOM_ONLY votes
  → deterministic 3-of-4 resolution
  → paper position or observation-only branch
  → deterministic price path and TP/SL/boomerang
  → provider-neutral role contract or local fallback
  → canonical append-only timeline
  → public-field projection
  → GET-only local API
  → read-only responsive browser UI

injected fake transport
  → single-writer + atomic revision state
  → success / confirmed revert / pending / ambiguous
  → one same-snapshot retry only after confirmed revert
  → closed or fail-closed manual review
```

主要目录：

- `src/core/`：确定性候选、随机票、纸面生命周期、公共投影与单时间线。
- `src/model/`：provider-neutral request/output contract、角色隔离、超时、Schema 校验和本地 fallback。
- `src/execution-safety-lab/`：只接受 injected fake transport 的安全状态机。
- `src/server.mjs`：只绑定 loopback 的 GET-only API 与静态 UI。
- `fixtures/`：由本仓代码从零确定性生成的公开 fixture。
- `scripts/validate.mjs`：fixture、权限、安全实验室和公开扫描门。
- `public/`：无框架、无第三方图片、原创 SVG 的响应式只读界面。

详见 [架构说明](docs/ARCHITECTURE.md) 和 [验证说明](docs/VERIFICATION.md)。

## What is included

- 正式公开名称只使用“牛来生米小队 / Niulai Shengmi Squad”。
- 恰好四个运行角色：云雀、牛来、牛来妈妈、豹拉；四人各有一票。
- 四次独立 50% draw，`decision_basis` 固定为 `RANDOM_ONLY`。
- 模型请求只能在票冻结后创建；模型不能决定票、门槛、执行或发布。
- `MODEL_DISABLED / FIXTURE_ONLY` 默认模式和四套本地角色 fallback。
- synthetic 来源、`observed_at` 与 `freshness_seconds` 校验。
- 公共投影剥离内部字段；API 仅支持 GET。
- TP、SL、不足三票观察与回旋镖的确定性 fixture。
- fake-only execution safety scenarios：confirmed success、confirmed revert、pending、ambiguous、单次 retry、atomic revision、single-writer lock、version-frozen terms、nonzero exposure fail-closed。
- 无第三方运行依赖的测试、验证、demo、CI 与浏览器 UI。

## What is not included

- 真实市场数据、真实运行记录、provider 回包或从私人 fixture 裁剪的数据。
- 钱包、signer、credential、交易客户端、真实提交、链上余额或订单/回执标识。
- 任何交易 provider、launch runner、社交通道、群接收器、登录或发布能力。
- 生产 prompt、账号配置、梗库、真实地址、时间线、截图或私有基础设施路径。
- 电影画面、衍生头像、下载头像、第三方动态 Logo、台词、歌词或社区访问图片。
- 部署配置、线上服务、真实只读外部验证、真实用户采用、收益或商业结果。

## Claim states

| 轴 | 当前状态 |
| --- | --- |
| `CODE_PRESENT` | 本地参考实现、API、UI、fixture generator 与 fake safety lab 存在 |
| `TESTED(FIXTURE/FAKE_TRANSPORT)` | 自动测试和 validate 仅证明 fixture/fake 行为 |
| `DEPLOYED_DEMO` | `NOT_VALIDATED` |
| `LIVE_READ_ONLY_VALIDATED` | `NOT_VALIDATED` |
| `NOT_VALIDATED` | 生产、真实市场、真实资金、真实社交、真实用户、收益、商业影响 |

这些状态互不推导：代码存在不代表部署，fixture 通过不代表 live validation，private staging 也不代表 public release。

## 安全与声明

页面没有钱包、交易、发布、登录或其他 mutation 控件。服务只绑定 `127.0.0.1`，非 GET 请求返回 `405`。CI 不读取 secrets，不部署，不连接外部服务。

本项目是非官方粉丝二创参考实现，不声称与任何电影、角色权利人、商标权利人、平台、市场数据提供方、模型提供方或链生态存在官方关系、合作、赞助或背书。详见 [第三方内容边界](THIRD_PARTY_CONTENT.md)。

代码按 [Apache License 2.0](LICENSE) 提供；许可只覆盖本仓库作者有权许可的代码和原创 SVG，不覆盖第三方角色、电影、商标、UGC 或其他资产。

## 贡献边界

Owner 定义了产品名称、四角色、随机投票、纸面模式、公开/私有分离、安全实验室与发布门。本仓实现、测试、文档和审计由开发 Agent 在这些边界内辅助完成。最终公开可见性、对外声明和发布决定仍属于 Owner，当前不视为 Owner acceptance。

详见 [Case Study](docs/CASE_STUDY.md)、[限制](docs/LIMITATIONS.md)、[贡献指南](CONTRIBUTING.md) 与 [安全政策](SECURITY.md)。
