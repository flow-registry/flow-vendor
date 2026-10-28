# conformance/

语言无关断言集：`valid/` 合法条目 + lock 样本，`invalid/` 每规则至少一个拒例。

断言格式：`{input, expected: ok | reject:<规则号>}`。

三方消费（对同一 fixture 必须给出同一断言）：

- AssistBox 设备侧 import gate（Kotlin）
- 本仓库 pipeline（构建时检查）
- 其他宿主实现（如 Rust host）

详见 `spec/VENDOR_FORMAT.md` §7。当前为空，随 v1 定稿补齐。
