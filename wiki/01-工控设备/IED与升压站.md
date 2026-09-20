---
title: IED与升压站
category: 工控/设备
tags: [IED, IEC 61850, 保护联锁]
order: 4
source: 工控协议.md、风电场点表与数据模型设计.md、风电场系统安全区归属表.md
---

## 一句话概括

IED（Intelligent Electronic Device，智能电子设备）是升压站/变电站里既能测量、又能保护、还能通信的装置；升压站把风机发出的 690V/35kV 电升到更高电压送出。IED 之间通过 IEC 61850 说话：GOOSE 管"一秒都不能等"的保护联锁，MMS 管"平时汇报和受控操作"。

## 原理

### 一、升压站里有什么

```text
风机侧（35kV 集电线路）
   └─ 箱变 collector-box
        └─ 集电线路 -> 升压站
升压站
   ├─ 主变、母线、SVG（无功补偿）
   ├─ 断路器、隔离开关
   ├─ 保护装置（过流、差动、距离）
   ├─ 测控装置（遥测、遥信、遥控）
   └─ 合并单元（采集电流/电压互感器信号）
送出线路 -> 电网
```

在靶场里的对应关系：

| 靶场节点 | 角色 | 归属 | 关键数据 |
|---|---|---|---|
| `line-collector-ied` | 线路/集电测控保护 IED | 安全 I 区 | 保护动作、断路器状态、线路故障 |
| `main-trans-svg-ied` | 主变、母线、SVG 测控保护 IED | 安全 I 区 | 无功、电压、保护动作 |
| `substation-gw` | 站控层网关，汇聚 IED 数据并转发控制 | 安全 I 区 | IED 聚合数据 |
| `collector-box` | 箱变 + 多回 35kV 集电线路 + 线路监测 | 安全 I 区 | 电压、电流、油温、门磁、烟感、接地/过流告警 |

### 二、IED、保护装置、测控装置、合并单元的分工

| 设备 | 核心职责 | 典型逻辑节点/数据 |
|---|---|---|
| IED（总称） | 带通信能力的站内智能装置 | —— |
| 保护装置 | 检测故障并发出跳闸命令 | `PTOC1` 过流保护（Str、Op、TmASt）、`PTRC1` 跳闸条件（Tr） |
| 测控装置 | 测量 + 状态采集 + 执行控制 | `MMXU1` 测量单元、`XCBR1` 断路器（Pos、OpCnt、BlkOpn、BlkCls） |
| 合并单元 | 把互感器的模拟采样数字化（SV / Sampled Values） | 电流、电压采样值 |
| 站控层网关 | 汇聚多个 IED，向监控/远动转发 | `LLN0`、`LPHD` 设备健康与状态 |

靶场给出的 `line-collector-ied` 逻辑节点清单：

| 逻辑节点 | 含义 | 关键数据 | 教学点 |
|---|---|---|---|
| LLN0 | 逻辑设备公共节点 | 状态、健康度 | 否 |
| LPHD | 物理设备信息 | 设备健康、铭牌信息 | 否 |
| MMXU1 | 测量单元 | 电压、电流、有功、无功 | 是 |
| XCBR1 | 断路器 | Pos、OpCnt、BlkOpn、BlkCls | 是 |
| PTOC1 | 过流保护 | Str、Op、TmASt | 是 |
| PTRC1 | 跳闸条件 | Tr | 是 |
| GGIO1 | 通用 I/O | 接地告警、闭锁状态 | 是 |

`main-trans-svg-ied` 另多 `YPTR1`（电力变压器：温度、负载状态）、`ATCC1`（分接头控制：TapPos、Ctl）、`ZSVG1`（SVG：ReactiveOutput、Available、Fault）。

### 三、间隔层与站控层

定义：IEC 61850 把变电站自动化分成三层。

```text
站控层（Station Level）
  ├─ 监控主机 / SCADA
  ├─ 保护信息子站
  └─ 远动网关（IEC104 出口）
        ↕ MMS（TCP 102）、文件服务
间隔层（Bay Level）
  ├─ 保护装置
  ├─ 测控装置
  └─ 合并单元
        ↕ GOOSE（二层以太网）、SV（采样值）
过程层（Process Level）
  └─ 互感器、断路器、隔离开关等一次设备接口
```

三种通信方式的分工：

| 名称 | 主要作用 | 承载 | 特点 |
|---|---|---|---|
| MMS | 站控层监控通信，SCADA 读数据、下发控制 | TCP/IP，常见端口 102 | 可路由、可审计，是主要的攻击面 |
| GOOSE | 快速事件通信，保护跳闸、联锁信号 | 二层以太网报文，不走 TCP/IP | 实时性极强，是保护联动的教学重点 |
| SV / Sampled Values | 采样值通信，传电流、电压等采样数据 | 二层以太网报文 | 数据量大、周期固定 |

注意：GOOSE 不走 TCP/IP，封 102 端口、上三层防火墙都管不住它，必须做二层隔离与端口安全。

### 四、保护联锁的概念

保护联锁是升压站里"自动、不经过人"的因果链：

```text
线路过流（PTOC1.Op = true）
    ↓
跳闸条件成立（PTRC1.Tr = true）
    ↓
GOOSE 快速报文发往相邻 IED / 站控层
    ↓
断路器分位（XCBR1.Pos = open）
    ↓
风机脱网（GridState = OFF_GRID）
```

靶场给出的 GOOSE 事件模型：

| 事件 | 发布方 | 订阅方 | 内容 |
|---|---|---|---|
| 集电线路过流跳闸 | line-collector-ied | main-trans-svg-ied / substation-gw | PTOC1.Op、PTRC1.Tr |
| 断路器位置变化 | line-collector-ied | substation-gw | XCBR1.Pos |
| SVG 故障闭锁 | main-trans-svg-ied | substation-gw / agc-avc-control | SVGAvailable=false |

联锁的麻烦在于它善意、自动、合法：攻击者不必伪造跳闸命令，只要让保护装置"看到"一个不存在的故障，整条链就自己走完。海上链"改阈值触发保护停机"是同一个套路，让系统忠实执行它认为正确的保护逻辑。

## 报文/字段对照

IEC 61850 点表示例（对象名 -> 标准点名）：

| IEC 61850 对象 | 标准点名 | 类型 | 读写 | 教学点 |
|---|---|---|---|---|
| IED01/MMXU1.A.phsA.cVal.mag.f | WF.IED01.MMXU1.CurrentA | Float | R | 是 |
| IED01/MMXU1.PhV.phsA.cVal.mag.f | WF.IED01.MMXU1.VoltageA | Float | R | 是 |
| IED01/XCBR1.Pos.stVal | WF.IED01.XCBR1.Pos | Enum | R/W | 是 |
| IED01/PTOC1.Op.general | WF.IED01.PTOC1.Trip | Bool | R | 是 |
| IED02/MMXU1.TotW.mag.f | WF.IED02.MMXU1.ActivePower | Float | R | 是 |
| IED02/MMXU1.TotVAr.mag.f | WF.IED02.MMXU1.ReactivePower | Float | R | 是 |
| IED02/ZSVG1.ReactiveOutput | WF.IED02.SVG.ReactiveOutput | Float | R/W | 是 |
| IED02/GGIO1.Alm1.stVal | WF.IED02.SVG.Fault | Bool | R | 是 |

文件服务（File Service）也在这层，传故障录波、保护动作报告、事件日志、配置与参数文件：

```text
fault_20260616_153012.cfg / .dat
event_log_20260616.txt
protection_report_001.xml
```

## 在攻击链里的位置

```text
平原链：最终效果体现在箱变/集电线路相关告警（CollectorLineFault、GroundFault、OverCurrent）
        以及 SCADA 的 CollectorLineFault、SVGReactiveOutput 等点；
        写 HR93 导致风机限功率时，HMI 也会同步反映集电线路侧的状态变化

山区链：IEC104 路径（10.0.4.2 -> 10.0.4.5:2404）是"远动/调度"侧的路径，
        与升压站 IED 层是并列的两条控制通道，教学上用来对比
        "遥控命令"与"保护联锁"两种不同的停机机制

海上链：WT08 的 PROTECTION_STOP 是"保护逻辑被触发"而非"收到停机命令"，
        与升压站保护联锁的思维完全一致：改变条件，让保护自己动作
```

## 安全视角

典型薄弱点：

- TCP 102 暴露给非站控层主机：NVD 记录过 IEC 61850-MMS 设备漏洞，攻击前提包括"能向 102/tcp 发送特制报文"。
- 设备未做访问控制，弱口令或默认账户可直接登录。
- 控制命令缺少严格权限，`XCBR1.Pos` 这类可写点没有角色校验时，任何连上 IED 的人都能操作断路器。
- SCD/CID 工程配置文件含站内设备结构、逻辑节点映射、保护定值，等于"升压站点表"。
- GOOSE 二层报文可被伪造/重放，导致虚假联锁或跳闸信号。
- 文件服务可未授权读取故障录波、保护定值、设备配置，甚至删改历史记录、伪造故障文件。
- MMS 默认可能不加密，中间人可篡改读数。
- 异常 MMS 报文可能导致设备异常。

防护要点：

- 站控层网络隔离，只允许 SCADA / 网关访问 TCP 102；用工业防火墙做白名单。
- 限制远方控制权限，控制命令分级授权、二次确认、全量记录操作日志。
- 关闭不必要的 MMS 服务；异常 MMS 报文只记录，不让设备因畸形报文异常。
- 对 GOOSE 做二层隔离（VLAN、端口安全、静态绑定），关键联锁报文做来源校验。
- 文件服务只允许保护信息子站 / SCADA / 工程师站访问，读取记日志，重要文件做完整性校验。
- SCD/CID 与保护定值按敏感工程资料管理，禁止无关主机访问站控层网络。
- 保护联锁既然是自动的，堵住跳闸命令就没用，得让故障条件无法被伪造。
