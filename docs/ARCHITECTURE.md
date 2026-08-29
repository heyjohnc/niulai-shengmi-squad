# Architecture

## Goal and trust boundary

牛来生米小队 public reference 的目标不是连接真实市场，而是把一个容易混淆权限的工作流压缩成可读、可测、完全离线的纵向切片。所有输入都由本仓的 deterministic generator 从零创建。系统没有 credential source、wallet abstraction 或 outbound network adapter。

边界分成四层：

1. **Evidence layer** — synthetic snapshot、来源、观察时间、freshness 和三种 claim type。
2. **Decision layer** — 四个稳定角色各取得一次独立 50% draw；四票冻结后确定性计算 3/4 门槛。
3. **Presentation layer** — provider-neutral 文案 contract 或本地 fallback；只能消费冻结票和公开证据。
4. **Projection layer** — canonical timeline 先构建，公共投影再剥离私有字段，最后由 GET-only API 和 UI 读取。

## Four-agent invariant

运行角色只有：

| Stable ID | Display name | Responsibility | Vote |
| --- | --- | --- | --- |
| `YUNQUE` | 云雀 | 候选卡和证据分层 | one |
| `NIULAI` | 牛来 | PAPER_ONLY 开仓与结果回写 | one |
| `NIULAI_MAMA` | 牛来妈妈 | 时间线整理和角色接话 | one |
| `BAOLA` | 豹拉 | 反证、开放问题和回旋镖 | one |

没有第五个 Agent。API、UI、fixture generator 和 safety lab 都是软件组件，不是角色，也没有票。

## Deterministic workflow

`src/core/random-vote.mjs` 以 `fixture version + seed + role` 产生四个互相独立、可重放的 bit。候选名称或行情字段不进入 draw。冻结结果包含 `vote_finalized=true`、`decision_basis=RANDOM_ONLY` 和 `external_features_used=false`。

`src/core/workflow.mjs` 创建：

- synthetic candidate card；
- `FACT / INFERENCE / OPEN_QUESTION`；
- 3/4 paper branch 或不足三票 observation branch；
- version-frozen paper terms；
- integer price index path，避免浮点随机误差；
- TP、SL 或 boomerang outcome；
- 四角色 local fallback；
- 连续 sequence 的 canonical timeline。

所有时间都是固定 fixture 时间，不读取系统时钟。所有 source 都明确 `synthetic=true / fixture_only=true / read_only=true`。

## Model boundary

`src/model/contracts.mjs` 不是特定 provider SDK。每个 request 只能包含一个 role、一个 `case:role` context、公开候选字段、已标注 evidence 和该角色冻结的票。

输出严格限制为：

```json
{
  "role": "YUNQUE",
  "claim_type": "INFERENCE",
  "text": "...",
  "source_event_ids": ["event-001"]
}
```

角色不匹配、额外字段、FACT、自造 source、超长文本、timeout 或无 provider 都进入经过同一权限声明的本地 fallback。输出安全位始终禁止投票、改门槛、执行和发布。

默认没有 provider，因此所有 checked-in fixture 都是 `MODEL_DISABLED / LOCAL_TEMPLATE`。参考 contract 展示的是隔离与失败处理思路，不包含生产 prompt 或账号配置。

## Canonical timeline and public projection

事件按 sequence 追加；候选、票、纸面仓、终局和接话共享同一数组。公共 API 不拼接第二条时间线，也不让 UI 重新推断业务状态。

内部 record 可以包含以下类别的字段：fixture seed、调试注记、raw output 或 transport receipt。`toPublicView()` 递归删除下划线字段和显式 private-key allowlist。测试同时检查公共 JSON 不包含这些字段。

## GET-only API

本地 server 绑定 loopback，并只实现：

- `GET /api/health`
- `GET /api/demo`
- `GET /api/fixtures/paper-tp`
- `GET /api/fixtures/paper-sl`
- `GET /api/fixtures/observe-boomerang`
- `GET /api/safety-lab`
- allowlisted static UI files

其他 method 返回 `405`，非 allowlisted path 返回 `404`。响应使用 `no-store`、CSP、`nosniff`，没有表单提交目标或外部资源 origin。

## Execution safety lab

lab 不是交易实现。它要求 caller 注入 `InjectedFakeTransport`，且 terms 固定 `mode=FAKE_ONLY / mutation_permitted=false`。

状态机展示：

- confirmed success：一次 fake call 后 CLOSED；
- confirmed revert：只允许同一 snapshot 的第二次也是最后一次 fake call；
- pending 或 ambiguous：不 retry，进入 manual review；
- 第二次 confirmed revert：进入 manual review；
- nonzero exposure：在 transport 前 fail closed；
- single-writer lock：拒绝第二 writer；
- atomic revision：拒绝 stale commit；
- version-frozen terms：attempt 1 和 retry 必须引用同一 snapshot version。

该目录没有 signer、wallet library、RPC adapter 或 live runner。CI 的 security scan 对具体危险 primitive、绝对私有路径、地址形状、长 hash、账号/邀请和源仓身份做 denylist 扫描。

## Documentation-only fan reward lane

The broader product direction includes a separate fan-contribution reward lane. It does not reuse market `RANDOM_ONLY` votes: public contribution facts, recipients and bounded amounts are frozen into deterministic commitments, then the same four named Agents cast structured `CONTRIBUTION_EVIDENCE_ONLY` votes. Three approvals may produce only an action-locked exact transfer plan.

This public repository does not implement that lane. It documents the reported preparation contracts, the separation of decision authority and the missing execution/recovery gates in [`FAN_REWARD_GOVERNANCE.md`](FAN_REWARD_GOVERNANCE.md). No fan-reward event enters the current demo, API, UI, fixture generator or fake execution lab.

## UI and assets

UI 使用原生 HTML/CSS/JavaScript，避免新增 runtime dependency。项目 mark 是本仓手写 SVG：四条轨迹围绕一粒抽象种子。它不模仿第三方 Logo 或电影画面。页面只调用同源 GET API；没有表单、钱包按钮、登录、交易或发布控件。

## Sanitized operations evidence

本仓不复制运行系统代码或原始遥测。日期化 operations snapshot 只允许聚合计数、投票完整性、逐字唯一率、provider-neutral 路由计数和零权限越界计数；它必须明确 mixed revision、非 uptime、非语义质量、非收益和不可从 public repo 独立重算。

原始时间线、候选/Token 标识、钱包与链上标识、交易/provider 回执、用户与社交身份、prompt/completion、策略表现、主机和凭证配置全部在 public projection 之前排除。聚合文件通过独立 Schema、算术回归和既有安全扫描，但不因此获得 production evidence 状态。
