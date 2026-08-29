# Verification

## Reproducible local checks

```bash
npm ci
npm test
npm run validate
npm run demo
```

这些命令不要求 key、`.env`、wallet 或外部网络。`npm ci` 安装一个零第三方 runtime dependency 的 lockfile；`npm test` 使用 Node 内置 test runner；`npm run validate` 重新生成内存中的 fixture 并与 checked-in JSON 比较，然后执行安全扫描；`npm run demo` 输出确定性摘要。

## What is verified

- 恰好四个 stable Agent，四人各一票。
- 同 seed 的四个 50% draw 可重放，候选字段不参与 vote。
- 3/4 threshold 产生 `PAPER_BUY`；不足三票产生 `OBSERVE_ONLY`。
- TP、SL 和 observation boomerang 三条 fixture 均可确定性重建。
- candidate evidence 包含三种 claim type、source、observed time 和 freshness。
- model request 只能在 vote finalized 后构建。
- provider-neutral output 做角色、字段、claim 和 source validation。
- 无 provider、timeout 和 invalid output 均走角色隔离 local fallback。
- public projection 删除私有字段。
- GET API 拒绝 POST 和非 allowlisted static path。
- fake lab 覆盖 success、revert、pending、ambiguous、one retry、nonzero exposure、single writer 和 atomic revision。
- security scan 检查 tracked/candidate path allowlist 与敏感类别。
- asset allowlist 仅接受仓内原创 `public/mark.svg`，并拒绝 public 文件中的远程或 data-URI 媒体。
- documentation-only fan-reward disclosure 继续经过相同 security scan，不得包含 private path、真实 chain address、长 transaction-style identifier、credential material 或 live mutation primitive。

## What is not verified for fan rewards

- 本仓没有 fan-reward implementation test；公开可验证对象只有设计和披露边界。
- broader project 的 action-locked preparation implementation 不能从本仓独立重建。
- 没有真实 treasury/token/recipient、public-chain preflight artifact、signer、signature、broadcast、receipt、payout 或 standing campaign 证据。
- `READY_ACTION_LOCKED` 不属于 execution、deployment、live validation 或 production acceptance。

## Browser verification

浏览器验证使用本地 loopback server，并检查桌面与移动 viewport：

- 页面首屏、品牌、三种模式标签可见；
- 三个 fixture tab 可切换；
- 四票、candidate claims 与 timeline 更新正确；
- safety lab 表格可见；
- 无 wallet、trade、login、publish 或 form control；
- 移动端无水平溢出；
- console error 为零。

2026-08-28 的本地验收使用 Chromium 检查默认桌面 viewport 与 390×844 移动 viewport；三条 fixture 均完成切换，console 为 0 errors / 0 warnings。该结果属于本机验证，不是部署证据。

截图若在本地验证期间产生，只放在被 Git 忽略的 `output/playwright/`，不进入发布仓库。

## Security and clean-history gate

提交后执行：

```bash
git diff --check
git status --short
git rev-list --objects --all
git fsck --no-reflogs --unreachable
```

审计目标：新仓只有自己的 root commit 和后续 clean-room commits；不存在其他仓库 object、tag、release 或 remote history。公开前还需验证 clean worktree、exact remote/HEAD、Actions 成功和安全扫描 0 findings；公开后使用匿名网页、API、Raw 内容和 Actions API 验证可读性。

日期化运行聚合另做算术一致性、字段白名单和敏感形状检查。它不包含原始记录，也不能从本 public reference 独立重算。

## Claim-state interpretation

| Claim axis | Meaning in this repository |
| --- | --- |
| `CODE_PRESENT` | code and documentation exist |
| `TESTED(FIXTURE/FAKE_TRANSPORT)` | 61 Node test cases plus deterministic fixture and injected fake validation passed |
| `PUBLIC_REFERENCE_RELEASED` | Owner-authorized public visibility and anonymous GitHub access were verified |
| `SANITIZED_RUNTIME_AGGREGATE` | only the checked-in aggregate and disclosure contract were tested |
| `FAN_REWARD_GOVERNANCE_DESIGN` | documentation-only; no public implementation or real payout evidence |
| `DEPLOYED_DEMO` | requires separate deployment evidence; currently not validated |
| `LIVE_READ_ONLY_VALIDATED` | requires an authorized real external read path; currently not validated |
| `NOT_VALIDATED` | production, money, social publication, users, revenue, reliability and business impact |

测试通过不等于 production acceptance，public GitHub release 不等于部署，页面能打开也不等于 production readiness。
