---
title: Historian
category: 工控/设备
tags: [历史库, 时序数据, 审计]
order: 5
source: 风电场点表与数据模型设计.md、风电场系统安全区归属表.md、工控协议权威资料与学习方案.md
---

## 一句话概括

Historian（历史数据库 / 时序库）是那台"永远在记账"的机器：把 SCADA 采到的每个遥测值、每条告警、每次控制操作连同时间戳存下来，供趋势曲线、报表统计、故障分析和事后追责使用。对防御方是证据库，对攻击者是侦察富矿。

## 原理

### 一、Historian 存什么

定义：Historian 按数据类型分表，要保留以下五类（出自风电场点表与数据模型设计.md）：

| 数据集 | 字段 | 来源 |
|---|---|---|
| telemetry_realtime | point、value、quality、ts | scada-server |
| alarm_event | alarm_id、point、severity、message、ts、ack_user | scada-server / hmi-web |
| control_event | command_id、source、target_point、old_value、new_value、result、ts | scada-server / agc-avc-control |
| security_event | event_id、src_ip、dst_ip、protocol、severity、message、ts | security-monitor |
| forecast_curve | forecast_time、target_time、power_mw、confidence | forecast-server |

第一批必须落地前三类：

```text
1. telemetry_realtime   遥测趋势
2. alarm_event          告警事件
3. control_event        控制操作（含改前值、改后值）
```

这三类覆盖"发生了什么（遥测）、出了什么问题（告警）、谁动了什么（控制）"。

遥测趋势：把 `WF.SCADA.TotalActivePower`、`WF.SCADA.GridVoltage`、`WF.WTxx.Environment.WindSpeed` 这类连续量按固定周期落库，形成曲线。HMI 的"历史曲线"页面查的就是 Historian。

事件日志：告警的产生、确认（`ack_user`）、恢复，以及操作记录。`control_event` 尤其重要，它记的是改前值和改后值：

```text
command_id  source              target_point                        old_value  new_value  result
C-2001      plain_diag@10.0.6.8 WF.WT01.CTRL.ActivePowerLimitPercent  100        0        ok
```

这条记录就是平原链里"HMI 事件记录出现 ActivePowerLimitPercent changed 100% -> 0%"的落库形态。

补充：故障录波是更接近设备侧的一类历史数据，故障录波文件、保护动作报告以文件形式存在：

```text
fault_20260616_153012.cfg / .dat
event_log_20260616.txt
protection_report_001.xml
```

它们经 IEC 61850 文件服务从保护装置/录波装置读到保护信息子站或 Historian。Historian 通常只存"索引 + 文件路径"，文件本体留在录波装置或文件服务器。

### 二、Historian 的位置与安全等级

风电场系统安全区归属表.md 把 historian 放在：

```text
生产控制区 / 安全 II 区
理由：历史数据、告警、控制记录与 I 区交互紧密，但不直接实施控制
```

对应的安全要求：

```text
1. 与 I 区通信应最小化，只开放必要方向和端口
2. Historian 如需给管理区使用，应通过隔离/复制方式提供数据，
   不建议管理区直接访问生产库
3. 时间同步、录波、电量数据应记录异常和篡改风险
```

注意：Historian 只用于管理报表时，应部署只读副本到 III 区，III 区不直连生产库。

## 报文/字段对照

Historian 通常通过 SQL / HTTP API / OPC UA 对外提供数据：

| 真实链路 | 常见协议 | 数据类型 |
|---|---|---|
| Historian -> 管理/分析系统 | SQL、HTTP API、OPC UA | 历史趋势、事件日志 |

一个典型的历史数据查询面：

```text
GET /history?point=WF.SCADA.TotalActivePower&from=...&to=...
GET /events?severity=HIGH&limit=100
GET /control-events?target_point=WF.WT01.CTRL.ActivePowerLimitPercent
```

这些接口的价值主要是元数据：返回的字段名本身就是一份点表。

## 在攻击链里的位置

Historian 在三条链里干两件事：

```text
角色一：侦察富矿（攻击者视角）
  点表：从历史接口的字段名/返回结构可以还原出全部点名与语义
  链路：从"哪些点在同一张表/同一张图里"能推断出设备拓扑与数据流
  拓扑：从 source 字段、设备编号、站号能推断出分区与网关结构
  参数：从历史趋势能反推出安全范围、正常波动区间、告警阈值
        （例如温度曲线稳定在 73 附近、阈值在 95，就能算出"改成 40 会立刻触发"）

角色二：取证与追责（防御方视角）
  平原链的攻击效果之一就是"HMI 事件记录出现 ActivePowerLimitPercent changed 100% -> 0%"
  这条记录落到 Historian 的 control_event 里，是判定"谁在什么时候改了控制点"的直接证据
  校验节点 10.0.5.7:8080 的 /api/integrity 返回三台机组的 status/reasons/energy_kwh，
  说明"另抄一份数据做对比"是发现数据篡改的有效手段
```

与 Historian 相关的教学点（出自工控协议权威资料与学习方案.md）：

```text
1. 支撑"低权限账号只能访问部分历史数据"的设计
2. 支撑数据泄露、越权查询、日志审计绕过类题目
3. 支撑趋势异常发现（从曲线上看出被篡改的痕迹）
```

## 安全视角

典型薄弱点：

- 历史接口只做登录校验不做数据分级，任意账号能查全量点位与全时段数据。
- 历史查询本质是数据库查询，参数拼接就回到 SQL/API 注入（平原链报表系统是同类问题的放大版）。
- III 区报表系统图"方便"直连生产 Historian，把管理区变成进入生产控制区的跳板。
- 时间同步异常（TIME_SYNC_LOST）让历史记录的先后顺序不可信，攻击者借此混淆因果。
- 攻击者改删历史记录让事后追责失去依据，伪造故障文件则会误导分析。
- 长期趋势暴露设备的正常范围、调节速率、保护阈值，为"改多少会触发保护"提供精确依据。

防护要点：

- Historian 与 I 区间最小化通信，只开放必要方向和端口；管理区用只读副本，不直连生产库。
- 数据分级：低权限账号只能看摘要或部分点位，不能看全量路由与点表。
- 重要历史数据、控制记录、告警事件做完整性保护（校验和/签名），关键记录只增不改、不可删。
- 统一时间同步（time-sync）是关键基础设施，对时失败要产生 TIME_SYNC_LOST 告警。
- 历史数据的查询、下载、导出行为记审计日志，并同步到安全监测平台。
- 展示给外部的趋势数据应脱敏、降采样或延迟发布，降低"从曲线反推参数"的风险。
