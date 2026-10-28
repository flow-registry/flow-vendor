# flow-vendor

AssistBox `.flow` 生态的 **vendored 第三方库**仓：规范（`spec/`）、构建管线（`pipeline/`）、收录条目（`libs/`）与契约测试（`conformance/`）。对照 Debian 维护者模型运营——收录制，不是开放发布。

vendor 条目是 `.flow` 包内 `vendor/` 目录放置的单文件 CJS bundle（≤1 MiB/条目），配套 `vendor.lock` 出处清单。包格式见 [flow-package](https://github.com/flow-registry/flow-package) `spec/FLOW_FORMAT.md`；索引分发走 [flow-registry](https://github.com/flow-registry/flow-registry)。

## 布局

```
spec/VENDOR_FORMAT.md   # 唯一必须版本化的资产：字节契约 + vendor.lock schema
pipeline/               # 构建与审查管线：pinned bundler + audit plugins（lintian 角色）
libs/<name>/
├── vendor.toml         # = debian/control：upstream、版本、API surface、license、maintainer
├── patches/            # = debian/patches：API 裁剪等本地改动，逐文件带头部说明
├── vendor.lock         # = .buildinfo：生成物，复现证据
└── REVIEW.md           # 收录评审记录与 sign-off
conformance/{valid,invalid}/  # 语言无关断言集，import gate 与管线跑同一份
```

## 收录模型（Debian 对照）

- **管线即闸门**：bundler + audit plugins 机械排除禁项（`eval(`/`Function(`/动态 `import(`/环境名引用/`require(`/node builtins），每条检查回链 VENDOR_FORMAT 条目号。
- **可复现构建**：同一份 `vendor.toml` + pinned builder 必得同一 `entry_sha256`；CI 构建 + 独立 rebuild 对账。
- **人工评审**：任何人可 PR（管线照跑）；`main` collection 合并需该 lib maintainer + 团队 sign-off，`contrib` 评审从简。
- **版本不可变**：发布后字节不改；漏洞检出在索引打 `vulnerable` 标记，修复发新版本，历史不撤。
- **版本后缀语义**：`x.y.z+flowN` = 上游 x.y.z 的第 N 次 flow 重打包（API 裁剪等），重打包动作在版本号上可见。

## 收录不承诺

语义正确性、数值精度、无条件触发后门不在收录保证内——管线消灭机械类违规，残差由设备侧 catalog 收窄与使用方自担。
