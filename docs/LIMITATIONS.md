# Limitations

## Deliberate product limits

- 数据全部 synthetic、deterministic、fixture-only。
- 价格使用整数 index，不模拟真实流动性、税、滑点、延迟或成交。
- 纸面 notional 没有货币含义，不代表真实仓位或收益。
- 只有一个候选、一个纸面仓和有限事件类型的参考纵向切片。
- 本地角色 fallback 是演示文案，不是通用对话模型质量证明。
- provider-neutral contract 没有连接任何 provider，也没有验证真实 provider latency、cost 或 availability。
- safety lab 只验证 injected fake transport 状态转换，不验证链上、钱包或交易客户端。
- UI 是只读 reference，不包含身份、权限管理或多人协作。

## Evidence limits

- 没有 `DEPLOYED_DEMO` 证据。
- 没有 `LIVE_READ_ONLY_VALIDATED` 证据。
- 只有日期化脱敏运行聚合，没有原始市场、资金、社交渠道或真实用户证据。
- 没有可靠性 SLA、性能基准、成本账单、用户研究、采用、收入或商业结果。
- Owner 只批准了 public reference 可见性；没有对生产、资金、用户采用或商业结果作验收。

## Legal and content limits

仓库只包含自有代码、文字和原创 SVG。它不提供第三方角色、电影、商标、UGC 或资产的许可，也不判断某种粉丝使用在特定司法辖区是否合法。参见 `THIRD_PARTY_CONTENT.md`。

## Security limits

denylist scan 是 defense in depth，不是秘密扫描产品或独立安全审计。它会阻止本项目明确禁止的高风险类别，但不能证明任何任意未来改动都没有漏洞。

本地 server 只绑定 loopback；若使用者自行改变绑定地址、加入 proxy、provider、wallet 或写 API，就超出本仓验证和许可声明范围，需要新的 threat model、权限设计和测试。
