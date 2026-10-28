# quant — 收录评审

- 来源：assistbox `native/js-runtime/src/trusted/quant.js`（宿主自有代码，迁移自 trusted 表，ADR-0012 §9）
- 机械检查：V-1..V-6 全过（无 eval/Function/import/require/环境名/ct/BOM）
- dep graph：零依赖
- API surface：blackScholes / greeks / impliedVol（与 vendor.toml 声明一致）
- 裁剪：无（patches/ 为空）
- 结论：main / stable 收录。语义正确性由 conformance fixture 钉住（输入/期望输出对，T-S4 并入）。
