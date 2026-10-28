# pipeline

收录管线：构建 + 审查合一。**bundler 选型与 audit plugin 清单均为待实现项**——设计约束见 `spec/VENDOR_FORMAT.md` §2（V-1..V-6 双侧同一份检查清单）与仓库 README 的 Debian 对照。

## 形状

```text
libs/<name>/vendor.toml + patches/
  └─ lockfile 解析（tarball integrity 验证）
       └─ pinned bundler（候选：rspack——要 plugin 生态做审计闸门；或 esbuild——输出更裸）
            ├─ audit plugins / 静态检查：V-1..V-6、dep allowlist、license、OSV
            └─ 确定性构建 → vendor/<name>.js + vendor.lock 条目
                  └─ 独立 rebuild 对账 entry_sha256（main collection 必需）
```

## 硬约束

- builder 版本与 flags 钉死在仓库内，写进 `vendor.lock`——可复现是 attestation 的前提。
- 静态检查盲区（混淆、字符串拼接构造调用）不豁免：无法判定的字节按拒收处理。
- 管线只产**字节与 lock**；是否收录由评审决定，管线输出不是信任声明。
