# libs/

收录的 vendored 库，一目录一条目：

```
libs/<name>/
├── vendor.toml    # = debian/control：upstream、版本、API surface、license、maintainer
├── patches/       # = debian/patches：API 裁剪等本地改动（可空）
├── vendor.lock    # = .buildinfo：管线生成物
└── REVIEW.md      # 收录评审记录与 sign-off
```

收录、升级、orphan/adopt 均走 PR。发布后条目不可变；漏洞检出在索引打 `vulnerable` 标记，修复发新版本。

当前为空——首个收录条目待 VENDOR_FORMAT v1 定稿。
