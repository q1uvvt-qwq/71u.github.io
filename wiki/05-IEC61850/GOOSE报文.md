---
title: GOOSE 报文结构与时序
category: 工控/IEC61850
tags: [IEC61850, GOOSE, stNum, sqNum, 重放, 保护联锁]
order: 2
source: 2026-07-12_海上GOOSE保护链路部署记录.md、工控协议.md、工控协议权威资料与学习方案.md
---

## 一句话概括

GOOSE 是面向保护联锁的二层快速事件报文，不走 TCP/IP、直接封装在以太网帧里；它的可靠性靠"持续重发"而不是靠确认重传，状态变化用 `stNum+1 且 sqNum 归零`表达、心跳用 `sqNum 递增`表达，这个区别正是重放检测的关键。

![GOOSE 帧结构与状态变化时序](../_assets/goose帧.svg)

## 原理

### 为什么保护联锁不用 TCP/IP

保护跳闸、闭锁、联锁这类信号的要求是"毫秒级、必达、可预期"。走 TCP/IP 会遇到三个问题：

```text
1. 协议栈开销大，握手、确认、重传带来不确定延迟
2. 拥塞时会排队、会丢包，延迟不可控
3. 需要 IP 层可达，组网和路由配置复杂
```

GOOSE 的做法是把报文直接塞进以太网帧，用组播广播给同网段的所有订阅者：

```text
不走 TCP/IP  ->  没有连接建立与确认重传，延迟稳定在毫秒级
组播发送     ->  一次发送，所有订阅者同时收到
持续重发     ->  用重复发送代替确认，丢一帧下一帧立刻补上
```

代价是：没有连接、没有认证、没有加密、没有确认，网络里任何一台设备都能发 GOOSE 帧、也能收到所有 GOOSE 帧。这是 GOOSE 的设计取舍，也是它安全风险的根源。

### 帧的两层结构

GOOSE 报文可以分成"以太网层"和"GOOSE 协议层"两段：

```text
以太网层
  目的 MAC      01-0C-CD-01-xx-xx   组播地址，01-0C-CD 是 IEC 61850 的 OUI
  源 MAC        发布者 IED 的网卡地址
  可选 VLAN 标签（802.1Q，TPID 0x8100）  VLAN ID + 优先级，用于隔离与实时优先级
  以太类型      0x88B8              标识这是 GOOSE
GOOSE 层
  GOOSE 头      APPID / Length / Reserved
  GOOSE PDU     gocbRef / timeAllowedToLive / datSet / goID / t /
                stNum / sqNum / confRev / ndsCom / numDatSetEntries / allData
```

组播 MAC 的编码规则值得记一下：`01-0C-CD-01-xx-xx` 里 `01-0C-CD` 是 IEC 61850 的机构唯一标识前缀，`01` 表示 GOOSE（SV 用 `02`），后两个字节由 APPID 派生，看到 `01-0C-CD-01-` 开头即可判定是 GOOSE 帧。

## 结构

### 逐字段说明

GOOSE 头（8 字节）

| 字段 | 长度 | 含义 |
|---|---|---|
| `APPID` | 2 字节 | 应用标识，用于区分不同 GOOSE 控制块；同一网段内应唯一，订阅者据此过滤 |
| `Length` | 2 字节 | GOOSE PDU 的字节长度（不含以太网头） |
| `Reserved1` | 2 字节 | 保留，通常为 0 |
| `Reserved2` | 2 字节 | 保留，通常为 0 |

GOOSE PDU 主体字段

| 字段 | 含义 | 安全分析价值 |
|---|---|---|
| `gocbRef` | GOOSE 控制块引用，格式为 `LD名/LN名$GO$控制块名`，标识这条 GOOSE 由哪个 IED 的哪个控制块发布 | 直接暴露发布者身份，可用于伪造时冒充 |
| `timeAllowedToLive` | 本帧的最大存活时间（毫秒）。订阅者在此时限内没收到下一帧就认为链路中断并告警 | 伪造时设得过小会引发订阅者告警，设得过大反而掩盖断链 |
| `datSet` | 数据集引用，指向 SCD 中定义的数据集，决定 `allData` 里有哪些点、顺序如何 | 数据集定义泄露即点表泄露 |
| `goID` | GOOSE 标识，便于运行人员在抓包工具中辨认用途（如"WT08 保护联锁"） | 泄露业务语义 |
| `t` | 本帧生成时刻（UTC 时间戳） | 可用于时效性判断，但很多实现不严格校验 |
| `stNum` | 状态号：数据集内容发生变化时递增 | 重放检测的核心依据 |
| `sqNum` | 序号：状态号不变时每次重发递增 | 心跳计数，配合 `stNum` 判断新鲜度 |
| `confRev` | 配置版本号：数据集或控制块配置变更时递增 | 可检测配置被篡改（订阅者应校验版本一致） |
| `ndsCom` | `needs commissioning`：true 表示装置尚未完成组态，数据不可信 | 测试边界标志 |
| `numDatSetEntries` | `allData` 中的数据条目数量 | 结构自描述，便于解析 |
| `allData` | 数据值列表，按 `datSet` 定义的顺序排列；布尔量用单字节编码 | 业务内容本身，如 `Op.general`、`Pos.stVal` |

### stNum / sqNum 的语义（重点）

这是 GOOSE 最需要讲清的一对字段。

```text
状态发生变化（例如保护动作、开关变位）：
    stNum += 1
    sqNum = 0
    timeAllowedToLive 重置，重传序列重新开始

状态没有变化（心跳 / 稳定重发）：
    stNum 不变
    sqNum += 1
```

报文发送时序上表现为"变化时密集重发，稳定后拉长间隔"：

```text
状态变化瞬间（密集重发）
  T0 第 1 帧   stNum=N+1, sqNum=0    立即发送
  T1 重发      stNum=N+1, sqNum=1    很短，约 1~2 ms
  T2/T3 ...    sqNum 递增，间隔逐级拉长
稳定运行期（心跳）
  周期性发送   stNum 不变，sqNum 持续递增，间隔为 T0（通常数秒）
```

对安全的意义有三条：

```text
1. 接收方应校验"收到新事件时 sqNum 必须为 0"：状态变化的第 1 帧
2. 接收方应校验 stNum 单调递增，不回退、不重复
3. 同一 stNum 且 sqNum 重复出现的帧，是重放的典型特征
```

如果实现里不做这些校验，攻击者录下一条历史 GOOSE 帧原样重发，接收方就会把它当成新的状态变化执行，这就是 GOOSE 重放的原理。

### test 位与 ndsCom 的测试边界

test 位（在数据集中的品质位或独立测试标志中体现）表达"本帧是测试帧"：

```text
test = true   本次报文只用于试验/仿真，不反映真实一次设备状态
test = false  正式报文，反映真实状态
```

正确的处理规则是"模式一致才接受"：正常模式的订阅者应忽略 `test=true` 的报文，测试模式的订阅者应忽略 `test=false` 的报文。这条规则若被忽略，测试流量会污染生产链路，或生产事件能被当成测试事件蒙混过关。

ndsCom 表达"装置尚未组态完成"，为 true 时数据不可用于生产判断，订阅者应当拒绝。

这两个标志合起来构成 GOOSE 的测试边界。2026-07-12 部署记录里把它写得非常明确：

```text
测试边界：test=true 只模拟，test=false 不应通过测试通道进入生产链路
```

而靶场恰恰在这个边界上留了缺陷（见下节）。

## 报文/字段对照

各字段的规范取值与海上链事件要素的校验要求对照：

| 层次 | 字段/要素 | 取值 / 要求 |
|---|---|---|
| Ethernet | 目的 MAC | `01-0C-CD-01-xx-xx`（组播，规范格式） |
| Ethernet | 以太类型 | `0x88B8` |
| GOOSE 头 | APPID | 用于区分控制块（按站内规划分配） |
| PDU | `gocbRef` | 指向发布该事件的控制块（含 LD/LN） |
| PDU | `datSet` | 包含 `PTUV1.Op.general` 与 `XCBR1.Pos.stVal` 的数据集 |
| PDU | `goID` | 事件标识对应的用途名称 |
| PDU | `stNum` | 序列要求 `stNum > 41` |
| PDU | `sqNum` | 序列要求 `sqNum = 0` |
| PDU | `test` | `true` 只模拟；`false` 按正式保护事件处理 |
| allData | 保护动作 | `PTUV1.Op.general = true` |
| allData | 开关位置 | `XCBR1.Pos.stVal = open` |
| 业务映射 | 并网控制 | `XCBR1.Pos.stVal=open -> CTRL.GRID_ENABLE -> HR93=0` |
| 业务影响 | 机组状态 | PLC3 `OFF_GRID`、功率归零、告警 `GRID_DISCONNECT` |

## 抓包分析

依据说明（重要）：素材中没有提供海上链 GOOSE 的 pcap。上面的帧结构、字段长度与编码方式依据 IEC 61850-8-1 对 GOOSE 的规定，`stNum`/`sqNum`/`test`/`ndsCom` 的语义同样来自标准定义；海上链记录提供的是事件要素与校验要求（`PTUV1.Op.general=true`、`XCBR1.Pos.stVal=open`、`stNum > 41`、`sqNum = 0`、`test` 边界、HR93 映射），而不是抓包字节。因此本篇不给出任何十六进制帧内容，也不编造 APPID、MAC 后缀或 `gocbRef` 的具体取值。

另外要说明靶场实现方式：2026-07-12 的链路用 HTTP 接口（`/api/protection/sample`、`/api/protection/replay`、`/api/protection/test-result`、`/api/protection/interlock-test`）模拟 GOOSE 事件的回放与联锁确认，校验的是事件要素（事件类型、设备对象、序列号、test 位），并不是在二层真实收发 GOOSE 帧，适合教学"事件语义 + 边界校验缺陷"；讲逐字节帧格式需要额外的 GOOSE 仿真器或真实 IED。

如果具备 GOOSE 抓包条件，推荐的分析路径：

```text
1. Wireshark 过滤
   goose                       直接筛 GOOSE 协议
   eth.type == 0x88b8          按以太类型筛
   eth.dst == 01:0c:cd:01:00:01  按组播地址筛
   goose.stNum == 41           按状态号定位

2. 沿时间轴观察 sqNum 变化，区分"状态变化帧"与"心跳帧"
3. 定位 allData 中 PTUV1.Op.general 与 XCBR1.Pos.stVal 两个布尔量的位置
4. 核对 confRev 是否与 SCD 记录一致
5. 检查是否存在 test=true 的帧进入了非测试订阅者
```

## 实测过程

海上链的 GOOSE 保护链路（2026-07-12）：

```text
attack-offshore
  -> AGC/AVC3 IEC61850 GOOSE 保护测试
  -> 前置机1
  -> SCADA系统5 生成 PENDING_CONFIRM
  -> AGC/AVC3 回执通道读取 event_id / interlock_id
  -> AGC/AVC3 interlock-test 联锁确认
  -> SCADA系统3/HMI
  -> PLC3 HR93=0
  -> OFF_GRID / GRID_DISCONNECT
```

工控协议点（记录原文）：

```text
协议：IEC61850 GOOSE
事件：PTUV1.Op.general=true
设备对象：XCBR1.Pos.stVal=open
序列要求：stNum > 41，sqNum = 0
测试边界：test=true 只模拟，test=false 不应通过测试通道进入生产链路
控制映射：XCBR1.Pos.stVal=open -> CTRL.GRID_ENABLE -> HR93=0
业务影响：PLC3 OFF_GRID，功率归零，告警 GRID_DISCONNECT
```

两个漏洞点：

```text
漏洞点 1：保护测试通道边界校验缺陷
  正常逻辑：保护测试通道只能接受 test=true 的 GOOSE 回放事件。
  缺陷逻辑：AGC/AVC3 只校验 test_ticket，未阻止 test=false 正式保护事件进入下游链路。
  结果：正式 GOOSE 保护事件被前置机1转发到 SCADA系统5。

漏洞点 2：HMI 联锁确认授权缺陷
  正常逻辑：断路器联锁确认应由 SCADA系统3/HMI 授权操作员完成。
  缺陷逻辑：HMI 只校验 interlock_id 与事件内容，未校验请求来源、角色和测试通道边界。
  结果：AGC/AVC3 的 interlock-test 测试接口可触发真实联锁确认。
```

验收链路：

```text
GET  /api/protection/sample         返回 GOOSE 样例、字段说明和 HR93 映射
POST /api/protection/replay         test=true  -> SIMULATION_ONLY
                                    test=false -> PENDING_CONFIRM
GET  /api/protection/test-result
     event_id     = EVT-PTUV1-20260712-001
     interlock_id = INT-XCBR1-20260712-001
POST /api/protection/interlock-test 确认后 PLC3：
     status / grid_state = OFF_GRID
     active_power_kw = 0
     alarm = GRID_DISCONNECT
```

验收后执行 reset，PLC3 恢复 `RUNNING / GRID_CONNECTED`。旧的海上直控入口 `POST AGC/AVC3 /api/dispatch` 已禁用，返回 `LEGACY_DISPATCH_DISABLED`。

## 安全视角

- GOOSE 原生没有认证和加密，协议只保证快、不保证来源可信。任何接入过程层/间隔层网络的设备都能伪造 GOOSE 帧，网络准入是第一道也是最重要的防线。
- 序列号新鲜度校验是防重放的核心手段。接收端必须校验 `stNum` 单调递增、状态变化帧的 `sqNum=0`、同 `stNum` 下 `sqNum` 不回退；海上链把 `stNum > 41 且 sqNum = 0` 作为序列要求，正是把这条规则显式化。
- 测试边界必须双向严格执行。`test=true` 不进生产链路，`test=false` 不进测试链路，`ndsCom=true` 一律拒绝。靶场的漏洞点 1 就是单向校验造成的。
- 联锁确认必须校验来源与角色。只校验 `interlock_id` 与事件内容不够，测试接口能触发真实联锁，说明授权边界没有落在调用者身份上。
- VLAN 与组播过滤。用 VLAN 把过程层/间隔层与站控层、办公网隔离；工业防火墙只放行授权 IED 的 GOOSE 组播（按组播 MAC 与 APPID 白名单），阻断非授权发布者。
- 保护压板与远方控制权限管理。跳闸出口压板、远方/就地切换、联锁投退这些"软压板"必须纳入权限管理，避免仅靠协议报文完成真实出口动作。
- 监控与取证。对 GOOSE 流量做持续记录（发布者 MAC、APPID、stNum 变化、confRev），异常发布者或异常序列号变化应告警，这是事后区分"真实保护动作"与"伪造事件"的关键证据。
- 定位说明：本篇用于授权靶场与教学环境的知识整理，不对应真实生产系统的可利用操作。
