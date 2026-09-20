---
title: HMI与SCADA
category: 工控/设备
tags: [HMI, SCADA, 组态]
order: 1
source: 工控协议.md、风电场点表与数据模型设计.md、平原链攻击链指南.md
---

## 一句话概括

HMI（Human-Machine Interface，人机界面）是操作员面前那块能看到风机状态、能点"启动/停机"的屏；SCADA（Supervisory Control and Data Acquisition，监控与数据采集系统）是屏后面那套轮询设备、组态画面、判断告警、存历史的系统。HMI 是脸，SCADA 是脑和手。

## 原理

### 一、两者怎么分工

| 维度 | HMI | SCADA |
|---|---|---|
| 名字 | 人机界面 | 监控与数据采集系统 |
| 面向对象 | 操作员 | 设备与数据 |
| 核心动作 | 显示、点击、二次确认 | 轮询采集、归一化、报警、存储、下发 |
| 数据从哪来 | 问 SCADA 要（API / WebSocket） | 问网关/RTU/PLC 要（Modbus、OPC UA、IEC104） |
| 有没有控制能力 | 有按钮，但按钮背后是 SCADA 的指令点 | 有指令点，真正把控制量送到设备 |
| 靶场实例 | hmi-web（平原 SCADA HMI `10.0.8.3:8080`） | scada-server（SCADA 点表与指令点） |

定义：HMI 不产生数据。页面上的"总有功 8.4 MW"是 SCADA 从 `data-gateway` / RTU 采上来，归一化成点表后，再通过接口推给 HMI 的。

```text
风机 RTU/PLC --Modbus/OPC UA--> 数据网关 --点表归一化--> SCADA --API/WebSocket--> HMI
                                                      |
                                                      +--> Historian --> 趋势曲线
```

### 二、HMI 的数据是怎么来的（关键）

HMI 上每个数字背后都是一条完整的轮询链：

```text
HMI  ->  SCADA/通信网关  --Modbus TCP FC03-->  RTU/PLC 的 HR0-HR9
                      <-- 响应值 --------
      <-- 归一化后的点表 JSON / WebSocket 推送 --
```

平原链原文说得很直白："HMI 通过通信系统1实时轮询三台 RTU 状态，所以页面会随之变化。"

```text
HMI 10.0.8.3:8080
   ↑ 点表推送
SCADA 系统1
   ↑
通信系统1  plain_scada_gateway = 10.0.6.8   （唯一被允许访问 502 的节点）
   ├─ Modbus TCP 502 --> WT01-RTU 10.0.5.6
   ├─ Modbus TCP 502 --> WT02-RTU 10.0.5.4
   └─ Modbus TCP 502 --> WT03-RTU 10.0.5.5
```

所以攻击者只要改了 RTU 里的寄存器，HMI 就会"如实"地把被篡改的世界展示给操作员。HMI 不校验真假，它只是显示。

### 三、SCADA 的核心能力

1. 轮询采集（Polling）：SCADA（或它下游的通信网关）按固定周期去问每个 RTU "HR0-HR9 当前是多少"，把结果填进点表。
2. 组态（Configuration）：工程师在组态软件里画画面、绑点表，"这个数字框绑定 WF.SCADA.TotalActivePower"。
3. 报警（Alarm）：对点表里的值做规则判断，超范围、状态位跳变就产生告警。
4. 历史存储（History）：周期性写入 Historian，用于趋势曲线和事后分析。
5. 部分 SCADA 还带控制下发：把 HMI 或调度来的指令，翻译成对设备的具体写操作。

### 四、风电 SCADA 页面的典型字段

风电场点表与数据模型设计.md 给出了页面模块划分：

| 页面 | 数据来源 | 显示内容 | 教学关注点 |
|---|---|---|---|
| 风场总览 | scada-server | 总功率、风速、风机运行数、告警数 | Web 越权、接口泄露 |
| 风机列表 | scada-server | 每台风机状态、功率、故障码 | 前端隐藏字段、接口遍历 |
| 单机详情 | scada-server | 风机实时曲线、控制按钮 | 越权控制、CSRF |
| 升压站状态 | scada-server / substation-gw | 主变、SVG、线路、母线状态 | 关键设备状态泄露 |
| AGC/AVC | agc-avc-control | 目标值、执行状态、分配结果 | 目标值篡改 |
| 告警中心 | scada-server / security-monitor | 告警、操作日志 | XSS、日志污染 |
| 历史曲线 | historian | 功率/风速/电压曲线 | SQL/API 越权 |

风机卡片上典型出现的量是：

```text
有功功率 active_power_kw     无功功率 reactive_power_kvar
风速 wind_speed              风向 wind_direction
温度 temperature             机舱/变流器温度
运行状态 RunState            STOPPED / RUNNING / TRIPPED / OFF_GRID
并网状态 GridState           OFF_GRID / ON_GRID
限功率百分比 ActivePowerLimitPercent
告警码 AlarmCode             NONE / POWER_LIMIT_ZERO / REMOTE_STOP / TRIP / OFF_GRID
```

## 报文/字段对照

HMI 与后端之间的推送与告警报文（出自风电场点表与数据模型设计.md）：

遥测推送：

```json
{
  "type": "telemetry",
  "timestamp": "2026-06-17T10:00:00+08:00",
  "points": {
    "WF.SCADA.TotalActivePower": 8.4,
    "WF.SCADA.GridVoltage": 35.2,
    "WF.SCADA.TurbineFaultCount": 0
  }
}
```

告警推送：

```json
{
  "type": "alarm",
  "severity": "HIGH",
  "point": "WF.CB01.LINE01.GroundFault",
  "message": "Collector line 01 ground fault",
  "timestamp": "2026-06-17T10:00:00+08:00"
}
```

SCADA 侧的控制校验规则（同样是 HMI 能不能点按钮的依据）：

```text
1. 普通 HMI 用户只能查看，不允许控制
2. 操作员可以执行启停和复位，但需要二次确认
3. AGC/AVC 控制接口只能由 agc-avc-control 调用
4. RTU/调度指令必须带有点表编号和操作序号
5. 所有控制写入 historian 和 security-monitor
```

## 在攻击链里的位置

HMI 在三条链里都是最终验证界面，也是攻击者的第一个侦察目标：

```text
平原链：验题前先打开 http://10.0.8.3:8080 确认 active_power_kw>0、alarm=NONE、风机 RUNNING
        写 HR93=0 之后回到同一页面，看到：
          场站总有功功率变为 0 kW
          ActivePowerLimitPercent 从 100 变为 0
          三台风机状态从 RUNNING 变为 LIMITED_STOP / 停机或限功率
          告警出现 POWER_LIMIT_ZERO
          事件记录出现 ActivePowerLimitPercent changed 100% -> 0%

山区链：http://10.0.2.7:8080 山区 SCADA HMI，确认 Conpot RTU 收到
          C_SC_NA_1 / IOA=10490（映射为 WT08_STOP_CMD）后：
          WT08 active_power_kw=0, active_power_limit_percent=0, alarm=POWER_LIMIT_ZERO
          其他风机仍为 RUNNING / 96 kW，证明是"单台可控"

海上链：http://10.0.11.5:8080/api/state 中 WT08：
          state: PROTECTION_STOP, grid_state: OFF_GRID, power_kw: 0.0,
          temperature_limit_c: 40.0, alarm: TEMP_THRESHOLD_TRIP
```

三条链的 HMI 效果也正好覆盖三种不同的物理后果：限功率、停机、保护停机脱网。

## 安全视角

典型薄弱点：

- HMI 页面泄露接口与点表。前端 HTML 里写死 API 路径、导出任务编号、字段名（平原链的 `/api/reports`、`export_id=211/315/421` 就写在页面源码里）。
- 只读展示掩盖了控制接口。页面上看不到"建立会话""控制按钮"，但接口真实存在，只是没在前端暴露。
- 越权控制与 CSRF。单机详情页的控制按钮如果没有服务端权限校验与二次确认，任意登录用户都能停机。
- 数据源不可信。HMI 无条件相信 SCADA 推送，SCADA 无条件相信 RTU 上报，形成脏数据一路上屏。
- 告警被当成唯一真相。攻击者只要让告警码不产生（或改掉阈值），操作员就看不到异常。

防护要点：

- HMI 采用只读数据面 + 独立控制面：展示走只读 API，控制走需要鉴权、二次确认、审计的独立接口。
- 页面与前端 JS 中不出现内部服务名、点表全字段、导出任务 ID。
- 所有控制命令在 SCADA 侧校验来源身份与点表编号，并写入 Historian 与安全监测。
- 对关键遥测做独立校验（旁路校验节点、HMAC 签名、时间戳新鲜度、范围与跳变检查），不依赖 HMI 显示值。
- HMI 与 SCADA 所在网段必须与办公网、互联网隔离，运维访问只能经堡垒机与白名单防火墙。
