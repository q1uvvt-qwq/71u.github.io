---
title: MMS 通信与 IEC 61850 文件服务
category: 工控/IEC61850
tags: [IEC61850, MMS, 报告控制块, 文件服务, 102端口]
order: 3
source: 工控协议.md、工控协议权威资料与学习方案.md、2026-07-12_海上GOOSE保护链路部署记录.md
---

## 一句话概括

MMS 是 IEC 61850 站控层读写与报告上送的通道，跑在 TCP 102 上、外面套一层 ISO 栈；它同时还提供文件服务，能把保护装置的录波文件、动作报告、事件日志、配置文件整份读走。所以 102 端口既能读实时数据，也能把全站工程资料整份拿走。

## 原理

### MMS 在 IEC 61850 里的位置

IEC 61850 把"抽象通信服务"映射到具体协议上，其中站控层这条映射用的就是 MMS（Manufacturing Message Specification，制造报文规范）：

```text
IEC 61850 抽象通信服务
  ├── 客户端/服务器类  ->  映射到 MMS（TCP 102）      读写、报告、文件服务
  ├── 发布者/订阅者类  ->  映射到 GOOSE（以太网 0x88B8）  快速事件
  └── 采样值类         ->  映射到 SV（以太网 0x88BA）     采样值
```

MMS 本身是通用的工业报文规范（早年用于工厂自动化），IEC 61850 借用了它的服务框架，把变电站的数据对象映射成 MMS 的命名变量（Named Variable）。

用一句话区分 MMS 和 GOOSE 的分工：

```text
MMS   管"看和控制"：SCADA 读遥测遥信、下发控制、收报告、读文件
GOOSE 管"联锁和跳闸"：IED 之间毫秒级的保护事件
```

### 协议栈与封装

MMS 不是直接在 TCP 上跑，中间还有一层 ISO 协议栈：

```text
应用层      MMS（ISO 9506）
表示层      空实现（IEC 61850 规定 ACSE/表示层为空）
会话层      空实现
传输层      COTP（ISO 8073 Class 0）
            TPKT（RFC 1006，把 ISO 传输层封装进 TCP）
网络/传输层  TCP，端口 102
链路层      以太网
```

其中两个封装头是抓包时的关键识别点：

```text
TPKT（RFC 1006）
  版本号（1 字节，固定为 3）
  保留（1 字节，固定为 0）
  长度（2 字节，包含 TPKT 头本身）
  作用：把"ISO 传输层数据单元"的长度和边界告诉 TCP

COTP（ISO 8073）
  CR（Connection Request）/ CC（Connection Confirm）等 PDU 类型
  在建立阶段完成 ISO 连接的握手
  作用：为 MMS 提供一个"面向连接的传输服务"
```

一次典型的 MMS 会话建链与业务过程：

```text
TCP 三次握手（端口 102）
  -> COTP 连接建立（CR / CC）         ISO 传输连接
  -> MMS Initiate（协商 MMS 能力）     建立 MMS 关联
  -> 业务请求 / 响应
       GetNameList        获取变量与域清单
       Read / Write       读写数据对象
       InformationReport  MMS 层主动上报
       FileDirectory / FileOpen / FileRead / FileClose   文件服务
       GetVariableAccessAttributes                    读变量属性
  -> MMS Conclude / COTP 释放
```

### MMS 侧的数据访问方式

MMS 访问 IEC 61850 数据对象主要有四种方式：读单个变量（指定 `LD/LN.DO.DA` 对象引用，读当前遥测值）、读命名变量列表（一次读多个对象，SCADA 周期采集）、写变量（下发命令、改定值）、报告（服务端按报告控制块配置主动上送，用于遥信变位与告警）；另有独立的文件服务通道。

### Report Control Block 与数据变化上报

报告控制块（RCB）是 IEC 61850 实现"数据变化主动上送"的机制：客户端先配置好一个 RCB，服务端在满足触发条件时自动发报告，不需要客户端轮询。

RCB 的关键属性：

| 属性 | 含义 |
|---|---|
| `RptID` | 报告标识，接收方据此区分报告来源 |
| `RptEna` | 报告使能开关，true 才开始上送 |
| `DatSet` | 引用的数据集，决定报告里包含哪些数据点 |
| `ConfRev` | 数据集配置版本，配置变更时递增 |
| `TrgOps` | 触发选项：`dchg`（数据变化）、`qchg`（品质变化）、`dupd`（数据更新）、`gi`（总召唤）、`integrity`（周期完整性） |
| `OptFlds` | 可选字段：是否带时标、原因码、数据集名、序号等 |
| `BufTm` | 缓冲时间，把短时间内的多次变化合并成一条报告 |
| `IntgPd` | 完整性周期，周期性上送全量 |
| `SqNum` | 报告序号，接收方据此检测丢报告 |
| `EntryID` | 缓冲报告的条目标识，支持断点续传 |

RCB 分两类：

```text
URCB（Unbuffered Report Control Block，非缓冲报告控制块）
  只在上送通道可用时发送，通道断了就丢报告
  通常用于普通遥测上送

BRCB（Buffered Report Control Block，缓冲报告控制块）
  服务端内部缓存报告，通道恢复后补发
  通常用于保护动作、告警这类不能丢的事件
```

安全上有两点要留意：一是 `TrgOps` 里的 `gi`（总召唤）能让客户端一次性索取全量数据，等于合法地做一次大数据量导出；二是 `SqNum` 与 `EntryID` 意味着报告完整性可被校验，接收方若不校验 `SqNum` 是否连续，攻击者丢弃或插入报告就不容易被发现。

### 文件服务

MMS 的文件服务用于传输"文件类数据"，操作方式更接近电脑上的文件读写，跟遥测遥信那种实时值不是一回事：

| MMS 文件服务 | 作用 |
|---|---|
| `FileDirectory` | 列目录，获取文件清单与属性 |
| `FileOpen` | 打开文件，取得文件句柄 |
| `FileRead` | 按块读取文件内容 |
| `FileClose` | 关闭文件 |
| `FileDelete` | 删除文件 |
| `FileRename` | 重命名文件 |
| `ObtainFile` | 请求服务端主动把文件传送到指定位置 |

变电站里被传输的文件类型：

```text
故障录波文件          fault_20260616_153012.cfg / .dat（COMTRADE 格式）
保护动作报告          protection_report_001.xml
事件日志              event_log_20260616.txt
告警日志
配置文件              CID / 装置参数文件
设备参数文件
运行记录文件
```

典型数据流：

```text
保护装置 / 录波装置
        ↓ IEC 61850 文件服务（MMS over TCP 102）
保护信息子站 / SCADA / 历史库 / 工程师站
```

拿到录波文件的价值在于：`.cfg` 描述通道定义（每个通道对应哪个电压电流量、变比、采样率），`.dat` 是采样数据，两者结合能还原故障时刻的电气量波形，也能反推保护定值与动作行为。对攻击者既是"了解保护逻辑"的途径，也是"伪造故障记录"的素材。

## 报文/字段对照

MMS 与 IEC 61850 概念的映射，以及安全关注点：

| IEC 61850 概念 | MMS 层对应 | 安全关注点 |
|---|---|---|
| 逻辑设备 LD | MMS Domain（域） | `GetNameList` 可枚举全部域，即暴露 IED 功能集合 |
| 数据对象 / 数据属性 | Named Variable（命名变量） | 读变量属性可获知类型、读写权限 |
| 数据集 DataSet | Named Variable List | 数据集清单泄露即点表泄露 |
| 报告控制块 RCB | 一组可读写的命名变量 | 改写 `TrgOps` / `DatSet` 可改变上送行为 |
| 控制 Control | 写命名变量（带 SBO 等控制模型） | 直接下发控制命令 |
| 文件 File | MMS File Service | 可读定值、配置、录波、日志，甚至删除与改名 |

常用 MMS 服务与用途：

| 服务 | 用途 |
|---|---|
| `Initiate` / `Conclude` | 建立 / 释放 MMS 关联 |
| `GetNameList` | 枚举域与命名变量 |
| `Read` / `Write` | 读写变量 |
| `GetVariableAccessAttributes` | 读变量属性（类型、权限） |
| `InformationReport` | 未经请求的上报 |
| `DefineNamedVariableList` | 定义命名变量列表 |
| `FileDirectory` / `FileOpen` / `FileRead` / `FileClose` | 文件服务 |

## 抓包分析

依据说明（重要）：素材中没有提供 IEC 61850 MMS 或文件服务的 pcap。本篇的协议栈封装（TPKT / COTP / MMS）、RCB 属性、MMS 文件服务集合来自 IEC 61850-8-1、ISO 9506（MMS）与 RFC 1006 的规定及公开学习资料；102 端口、风险清单与防护建议来自《工控协议.md》和《工控协议权威资料与学习方案.md》。因此本篇不给出任何抓包字节或帧内容。

在具备抓包条件时，推荐的分析路径：

```text
Wireshark 过滤：mms / tcp.port == 102 / cotp / tpkt
                mms.confirmedServiceRequest（看调用了哪个 MMS 服务）
                mms.fileName（看文件服务涉及的文件名）
1. 建链阶段：确认 TCP 102 -> COTP CR/CC -> MMS Initiate 的时序
2. 业务阶段：区分 Read（采集）、Write（控制）、InformationReport（上报）
3. 文件阶段：定位 FileDirectory / FileOpen / FileRead，还原被读取的文件
4. 结合业务侧证据：保护信息子站的文件接收记录、装置侧的操作日志
```

## 实测过程：靶场实际跑的接口

本节讲的是 GOOSE 侧的保护事件通道（协议语义见 `GOOSE报文.md`），素材里的 MMS 与文件服务没有对应的实测流量。

海上链在 IEC 61850 这一段的实现方式需要特别说明：靶场没有真实跑 MMS 或 GOOSE 二层协议，而是用 HTTP 接口模拟保护事件通道：

```text
GET  /api/protection/sample                       返回 GOOSE 样例、字段说明和 HR93 映射
POST /api/protection/replay                       回放保护事件
     test=true  -> SIMULATION_ONLY
     test=false -> PENDING_CONFIRM
GET  /api/protection/test-result?id=OFFSHORE-PROT-TEST-20260712
     event_id     = EVT-PTUV1-20260712-001
     interlock_id = INT-XCBR1-20260712-001
POST /api/protection/interlock-test               联锁确认
     -> SCADA系统3/HMI -> PLC3 HR93=0 -> OFF_GRID / GRID_DISCONNECT
```

旧的海上直控入口 `POST AGC/AVC3 /api/dispatch` 已禁用，返回 `LEGACY_DISPATCH_DISABLED`；验收后执行 reset，PLC3 恢复 `RUNNING / GRID_CONNECTED`。

这带来两个使用上的注意点：

```text
1. 可以用它讲清"保护事件语义、测试边界、联锁确认授权"这三类问题。
2. 不能用它做 MMS 报文级、文件服务级的分析：素材里没有这类流量。
   要讲 MMS 文件服务，正确做法是引入 IEC 61850 开源库或专用仿真工具，
   让装置侧真实暴露文件服务后再抓包。
```

学习资料中对靶场化方式的建议也与此一致：IEC 61850 复杂度高，第一版可先做 SCD/CID 配置泄露、IED 点表读取、保护联锁状态仿真与 GOOSE/MMS 概念化教学，后续再引入真实协议。

## 安全视角

MMS 与文件服务的典型风险（来自素材的风险清单）：

```text
MMS 层面：102 端口暴露、设备未做访问控制、弱口令或默认账户、
          控制命令缺少严格权限、明文通信或证书配置不当、异常 MMS 报文导致设备异常
文件服务：未授权读取故障录波、未授权读取设备配置、泄露保护定值、
          泄露站内设备结构、删除或篡改历史记录、伪造故障文件
```

逐条对应的防护：

| 风险 | 防护措施 |
|---|---|
| 102 端口暴露 | 站控层网络隔离，只允许 SCADA / 网关 / 保护信息子站访问 TCP 102；工业防火墙做白名单 |
| 无访问控制 / 弱口令 | 强制身份鉴别，禁用默认账户，按角色分配最小权限 |
| 控制命令缺少权限 | 控制类写操作与只读采集彻底分离，远方控制需压板与权限双重确认 |
| 明文通信 | 引入 IEC 62351 的思路做认证与加密；纵向链路使用加密认证装置 |
| 异常报文导致设备异常 | 装置侧做报文健壮性校验，网络侧限制可访问 102 的主机范围 |
| 文件服务被滥用 | 只允许保护信息子站 / SCADA / 工程师站访问文件服务；对文件读取行为记录日志；重要文件做完整性校验 |
| 定值与配置泄露 | 把 CID、定值单、SCD 按敏感工程资料管理，不下发到无关主机 |
| 记录被删改 | 关键文件做完整性校验与异地备份，删除与改名操作单独审计 |

补充两条工程建议：区分"采集"与"操作"两条通道（周期采集只用 Read 与报告，Write 与文件服务调用另走审计通道）；保留交叉取证能力（装置侧操作日志、保护信息子站的文件接收记录、站控层交换机流量记录三者对齐，才能确认谁在什么时候读走了哪份录波、下了哪条控制）。

定位说明：本篇用于授权靶场与教学环境的知识整理，风险清单与防护建议均为防御视角，不对应真实生产系统的可利用操作；真实系统的测试必须经过书面授权。
