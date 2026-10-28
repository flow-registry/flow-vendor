# VENDOR_FORMAT v1（草案）

> `.flow` 包内 `vendor/` 目录与 `vendor.lock` 的字节契约。消费者：`.flow` 打包器、设备侧 import gate、本仓库构建管线。上位决策：AssistBox ADR-0012。
>
> 一句话：**vendor 条目是自包含 CJS 单文件；`vendor.lock` 是机器可验的出处清单——import gate 验字节契约与 digest，不验"被审过"；审查承诺由本仓库管线与发布流程承载。**

## 0. 三个事实必须同时成立

```text
vendor.toml  声明   —— 作者说"我 vendored 了什么"（人写，libs/<name>/ 内）
vendor.lock  事实   —— 管线说"实际解析与产出了什么"（生成物，进 .flow 根）
包内字节      证据   —— entry_sha256 对得上 lock，lock 对得上 manifest 声明
```

三者矛盾即拒。声明与事实分离是 Debian `control`/`buildinfo` 的同款结构：评审看声明，机器验事实。

## 1. 包内布局

```text
xxxxx.flow
├── manifest.yaml
├── vendor.lock              # vendor/ 非空时必需；vendor/ 为空时禁止出现
└── vendor/
    ├── quant-lib.js         # 单文件 CJS bundle
    └── date-cal.js
```

- 不嵌套；扩展名仅 `.js`。
- 界值：单条目 ≤1 MiB、`vendor/` 合计 ≤4 MiB、条目数 ≤8；**独立配额**，不占 `scripts/` 的条目界与配额。
- `vendor.lock` 与 vendor 条目字节均计入包指纹（`vendor=` 段）。

## 2. 条目字节契约（import gate 与管线双侧同一份检查）

| 编号 | 规则 | 理由 |
| --- | --- | --- |
| V-1 | 无 `eval(`、无 `Function(` 构造器 | 运行时代码生成 |
| V-2 | 无动态 `import(`；无顶层 `import`/`export` 语句（须已打平为 CJS） | ESM/异步加载形状 |
| V-3 | 无 `require(` 调用——vendor 条目自包含，不依赖其他模块（含 trusted 名与兄弟条目） | 隐藏加载序 |
| V-4 | 无 `self`/`document`/`window`/`process`/`global`/`Buffer` 引用；`globalThis` 仅允许只读标准内建 | 环境探测/原语借用 |
| V-5 | UTF-8、无 BOM；不自带 `//# sourceURL`（由物化层统一注入） | 归一化歧义 |
| V-6 | 无 `ct` 标识引用——vendor 条目是纯计算，碰不到副作用出口 | 借 ct 逃逸到工具面 |

静态扫描的固有盲区（`["ev"+"al"]` 拼接等混淆）不是豁免——混淆字节直接进拒收档（§5）。

## 3. `vendor.lock` schema

```yaml
vendor_lock: "1"                    # vendor-format 版本，缺省即拒
entries:
  - name: "quant-lib"               # [a-z0-9-]{1,63}，registry 级命名空间
    version: "2.3.1+flow1"          # semver；+flowN = 第 N 次 flow 重打包
    upstream: "quantlib-js@2.3.1"   # 上游坐标声明
    entry: "vendor/quant-lib.js"    # 包内路径
    entry_sha256: "9f2c…"           # MUST：条目字节 digest
    tarball_sha512: "a1b8…"         # SHOULD：上游 tarball integrity
    builder: "flow-vendor-cli"      # 构建器身份
    builder_version: "0.4.2"
    builder_flags: "--format=cjs --platform=neutral"
    provenance: "sigstore:…"        # MAY：上游 attestation 引用
    collection: "main"              # main | contrib（§5）
    channel: "stable"               # edge | stable
```

- `entries` 与包内 `vendor/` 文件**双射**；`entry`/`name` 重复即拒。
- `name` 不得与宿主 trusted 名冲突——同名即拒（trusted 表由宿主编译期固定）。
- `builder*` 是复现证据，不是信任声明。
- `vulnerable` 不进包内 lock（包字节不可变）：落在 registry 索引条目上，安装期按来源策略判定。

## 4. manifest 消费键

```yaml
uses:
  - { name: "quant", minVersion: 1 }         # trusted 名：宿主表
  - { name: "quant-lib", minVersion: "2.3" } # vendor 名：vendor.lock 解析
```

- vendor 名先查 `vendor.lock`，版本不足即**导入期**拒绝。
- 未在 `uses:` 声明的 vendor 条目不被物化层注入 `require` 影子——可携带但不可触达。

## 5. 收录分档（DFSG 式）

| collection | 准入 | 含义 |
| --- | --- | --- |
| `main` | 管线全绿 + 人工 sign-off + 独立 rebuild 对上 `entry_sha256` | 出处链完整、评审公开 |
| `contrib` | 管线全绿，评审从简 | 机械合规——设备侧默认更窄 catalog |

**拒收档**（任一即拒）：字节不可读/混淆、license 不合规、dep graph 未完整落 lock、V-1..V-6 任一触线、超界。

## 6. registry 索引条目

索引条目 `type: "vendor"`（flow-registry INDEX_SCHEMA），复用 `distUrl`/`sha256`/`minApp` 语义；`vulnerable: [...]` 可追加（追加不改包字节）。签名落地后 `vendor.lock` + `provenance` 是其载荷。

## 7. conformance fixture

`conformance/{valid,invalid}`：每条规则至少一个拒例 + 合法边界样本。断言格式 `{input, expected: ok | reject:<规则号>}`——设备 import gate、管线、其他宿主实现跑同一份。

## 8. 非目标

运行时 remote require；install hook；vendor 条目互相依赖；字节码/wasm 分发；语义正确性背书。
