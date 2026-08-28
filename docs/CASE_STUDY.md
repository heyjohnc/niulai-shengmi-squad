# 牛来生米小队 public reference｜Level 2 Case Study

> 当前阶段：`Level 2 / PUBLIC_REFERENCE_RELEASED`
> 证据范围：本仓自己的代码、deterministic fixture、injected fake transport、自动测试、本地 API、浏览器检查，以及单独标注的脱敏运行聚合。
> 不包含：原始运行数据、真实交易明细、线上部署代码、真实社交身份、用户采用或商业结果。

## 1. 一句话摘要

牛来生米小队 public reference 把 synthetic 候选、四人独立随机投票、纸面 TP/SL、角色接话和安全失败状态组织成一条离线可重复的时间线，用最小实现展示“模型负责表达、确定性代码负责决议、前端永远只读”的系统边界。

## 2. 问题与目标用户

多 Agent demo 很容易把三类事情混在一起：事实从哪里来、谁做决策、谁只是负责把结果说得更像角色。如果 fixture 来自真实系统删字段后的副本，demo 又会带来隐私和披露风险；如果 UI 带钱包或写按钮，读者也很难判断纸面演示与真实执行的边界。

本仓面向两个读者：

1. 想快速理解四角色单时间线产品结构的工程或产品评审者；
2. 想复现实验、检查权限与失败分支的安全评审者。

目标不是证明交易策略、模型质量或生产可靠性，而是提供一个五分钟内可运行、可测试、可审计的公开纵向切片。

## 3. Scope and non-goals

范围包括 synthetic snapshot、candidate card、三种 claim type、四票冻结、3/4 paper decision、TP/SL、observation boomerang、本地 fallback、canonical timeline、GET-only API、responsive UI 和 fake-only safety lab。

明确非目标包括真实数据、钱包、signer、provider credential、外部提交、社交发布、登录、launch、生产 prompt、账号配置、私人 fixture、真实地址、运行回执与部署配置。仓库也不包含外部图片、电影截图、衍生头像、下载头像、动态 Logo、台词或歌词。

## 4. Architecture and material decisions

### 4.1 决议与模型分离

四票由本地 deterministic function 在 role-specific input 上产生，概率固定 50%。四票一次生成并冻结，候选名称和指标不进入 draw。只有冻结后的 request 才能进入模型层；输出安全字段明确禁止模型投票、改门槛、执行和发布。

权衡是角色台词不能解释成“为什么买”，因为票的依据本来就是 `RANDOM_ONLY`。这减少了叙事上的伪因果，也让测试可以精确证明更换候选文本不会暗中改变票。

### 4.2 单时间线优先

候选、票、纸面仓、价格终局和 fallback 都追加到同一个 sequence。UI 不重建第二套状态，也不按角色分成四个互相矛盾的历史。

代价是事件必须具备稳定 ID、顺序、来源和 claim type；公共投影必须在 API 前完成，而不是依赖前端隐藏字段。

### 4.3 从零 deterministic fixture

fixture generator 使用固定版本、seed、固定 observed time 和整数 price index。checked-in JSON 是 generator 的产物，validate 会重新构建并比较完整 JSON。任何手工修改、系统时钟依赖或隐藏随机性都会形成 drift。

这是 clean-room disclosure 的关键决定：public demo 不需要知道 private system 的真实字段全集，也不会用真实 run 裁剪出“看起来像 synthetic”的数据。

### 4.4 Fake-only safety lab

公开仓没有真实 execution adapter，但仍需要展示容易在自动化系统里出错的状态边界。lab 因此只接受 injected fake transport，允许四类 observation：confirmed success、confirmed revert、pending 和 ambiguous。

confirmed revert 可以触发一次同 snapshot retry；pending 和 ambiguous 永不 retry。nonzero exposure 在 transport 前 fail closed。每次 state commit 需要 writer ownership 和 expected revision，从而把 single writer 与 atomic update 变成可测的 contract。

这种设计不能证明真实 transaction safety，却能公开说明“何时可以重试、何时必须停”的推理模型，而不泄露真实 transport 或 signer 实现。

## 5. Failure and recovery evidence

实现期间出现过三个有代表性的本地失败：

- 初版 fixture seed 没有达到预期 3/4。处理方式是用只读搜索找到满足目标分支的 seed，并把 generator 自检保留为硬断言；fixture 不会因为错误 seed 静默变成另一条故事。
- 初版脚本把 `fileURLToPath` 从错误的内置模块导入，生成命令立即失败。修正 import 后重新生成 fixture 与 demo。这个失败发生在任何提交或发布前，没有外部副作用。
- 首次浏览器验收发现静态文件 `Buffer` 被通用 JSON responder 序列化，状态码与 CSP 测试因此曾误判页面可用。修正为直接发送 binary/string body，并新增 HTML 正文与 content-type 回归测试后，桌面和移动浏览器复验通过。

这些失败说明本仓的验证重点不只是 happy path：生成器必须证明 fixture shape，状态机必须对 ambiguous/pending 不重试，API 必须拒绝 write method，public projection 必须证明私有字段被移除。

## 6. Verification and measured result

验证命令是 `npm ci`、`npm test`、`npm run validate`、`npm run demo`。测试数量和最终 commit SHA只从本仓最终验证记录报告，不继承任何其他项目数字。

浏览器验证在本地 loopback 进行，覆盖桌面和移动 viewport、三个 fixture tab、四票、claim cards、timeline、safety lab、console error、水平溢出和无 mutation control。

安全验证包括 top-level allowlist、敏感 category denylist、GET-only server、CSP、静态文件 allowlist、fixture drift、public field stripping、Git object enumeration 和 unreachable object audit。

当前 claim states：

| Axis | Result |
| --- | --- |
| `CODE_PRESENT` | yes |
| `TESTED(FIXTURE/FAKE_TRANSPORT)` | 59 Node test cases plus deterministic validation and security scan passed |
| `PUBLIC_REFERENCE_RELEASED` | yes; Owner-authorized public visibility and anonymous GitHub access verified |
| `SANITIZED_RUNTIME_AGGREGATE` | date-stamped aggregate only; raw records absent and not publicly reproducible |
| `DEPLOYED_DEMO` | `NOT_VALIDATED` |
| `LIVE_READ_ONLY_VALIDATED` | `NOT_VALIDATED` |
| `NOT_VALIDATED` | production, real market, money, social, users, business impact |

## 7. Security and disclosure boundary

公共仓使用 allowlist/denylist 思路而不是“复制后人工看一眼”。CI 对候选 tracked files 扫描绝对私有路径、source repository identity、地址/长 hash 形状、账号/邀请、secret material 和具体 live mutation primitive，只输出 path 与 category，不打印匹配值。

仓库不配置 CI secret、不部署、不连接外部服务。Owner 已单独批准 GitHub public visibility；任何未来部署、provider、钱包、用户数据或写能力仍需新的 go/no-go decision。

## 8. Contribution boundary

Owner 提供产品目标、名称、恰好四个角色、四票随机机制、3/4 门槛、PAPER_ONLY、模型零决策权、public/private 分离、execution-safety-lab 边界和发布门。

开发 Agent 在授权范围内完成 clean-room 架构、实现、测试、UI、文档、安全扫描、浏览器检查和版本证据整理。运行中的四个角色是产品角色，不是仓库开发者。Node.js 和 GitHub 托管属于第三方能力，不拥有产品决策权。

Owner 已审阅并明确授权 public reference 发布。该决定只接受本仓的公开范围和声明，不把生产、真实资金、用户采用或商业结果改写成已验收。

## 9. Current limitations and next gate

本仓没有真实 provider、真实 API、真实 market semantics、资金、社交、用户或部署证据。safety lab 只是 fake transport。UI 没有账号和权限系统。性能与成本没有测量，状态为 `NOT_MEASURED`。

public visibility gate 已完成。下一阶段是保持公开安全扫描、处理外部 Issue/PR，并在稳定 revision 有足够样本后发布新的日期化聚合；这不要求复制生产源码或原始遥测。

## 10. 30-second summary

我把一个容易把模型、投票和交易混在一起的四角色工作流，重写成完全离线的 public reference。四票由确定性代码先冻结，模型只能在严格角色 contract 下接话；3/4 只建立纸面仓，所有结果留在一条 canonical timeline。另有一个 fake-only safety lab，用 success、revert、pending 和 ambiguous 展示单次 retry、原子状态、single writer 与 fail-closed。当前只有本地 fixture/fake 测试证据，没有部署、live、资金或用户声明。
