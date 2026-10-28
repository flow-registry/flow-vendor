# binance-utils — 收录评审

- 定位：binance-connector-js 的**纯计算子集**——原库是 HTTP client（axios + network），按 V-1..V-6 永远进不了 vendor；本条目只收签名/filter/kline 这些纯计算面
- 机械检查：无 eval/Function/import/require/环境名/ct/BOM
- dep graph：零依赖（自带 SHA256 实现，RFC4231 测试向量验证过）
- API surface：8 个导出（vendor.toml 一致）
- 语义边界：签名在沙箱内算，HTTP 走 net.fetch 工具面——这是"vendor 算 + tool 发"分层的参考实现
- channel: edge（首个版本，soak 后晋 stable）
