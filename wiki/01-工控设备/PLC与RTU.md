---
title: PLC与RTU
category: 工控/设备
tags: [PLC, RTU, Modbus]
order: 2
source: 工控协议.md、风电场点表与数据模型设计.md、平原链攻击链指南.md
---

## 一句话概括

PLC（Programmable Logic Controller，可编程逻辑控制器）是装在柜子里、跑逻辑、管 IO 的工业电脑；RTU（Remote Terminal Unit，远程终端单元）是装在远方站点、长期无人值守、把现场状态通过远动协议送回主站的设备。前者重逻辑与 IO，后者重远方测控与远动通信。

## 原理

### 一、PLC：逻辑控制 + IO 映像

PLC 的工作方式是扫描周期：

```text
读输入（DI/AI） -> 写进输入映像区
   ↓
执行用户程序（梯形图/ST/功能块）
   ↓
写输出映像区 -> 输出到 DO/AO
   ↓
与上位机通信（Modbus / OPC UA / 厂商协议）
   ↓
（循环）
```

IO 映像（I/O Image）是 PLC 的核心概念：程序读到的不是物理端子的实时电平，而是映像区里的一份拷贝。这个特性带来一个攻击面，MITRE ATT&CK for ICS 里的 `Manipulate I/O Image` 就是改映像区，让 PLC 看到的输入和真实输入不一致。

### 二、RTU：远方测控，强调恶劣环境与远动

RTU 和 PLC 的差别在部署位置和通信对象：

| 维度 | PLC | RTU |
|---|---|---|
| 部署位置 | 厂房、机柜、机组旁 | 远方站点、变电站、风机塔基、无人值守站 |
| 环境要求 | 常温、有空调 | 宽温、防潮、防雷、抗电磁干扰 |
| 通信能力 | 以太网为主 | 多种远动通信（串口、无线、以太网），支持多主站 |
| 典型协议 | Modbus、OPC UA、S7comm | Modbus、IEC 60870-5-101/104、DNP3 |
| 核心功能 | 逻辑控制、联锁 | 遥测/遥信采集、遥控/遥调执行、本地存储与转发 |
| 电源 | 常规 | 常带后备电池/太阳能 |

在风电靶场里，两者常被合起来讲：`WT01-RTU` / `plc1-modbus-sim` 同时对应"PLC1 / 风机发电机组1"和"独立 Modbus 子站"，在教学层面它就是一台既跑逻辑、又能被 Modbus 读写的机组控制器。

### 三、Modbus 寄存器与 PLC 内部存储区的对应

这是本页最需要记牢的一张表：

| Modbus 区域 | 全称 | 功能码 | 数据方向 | PLC 内部对应 | 风电靶场典型用途 |
|---|---|---|---|---|---|
| Coil | 线圈 | FC01 读 / FC05 写单个 / FC15 写多个 | 读/写 | 输出继电器（Q/Y） | 启停命令、开关控制 |
| Discrete Input | 离散输入 | FC02 读 | 只读 | 输入继电器（I/X） | 断路器位置、就地/远方状态 |
| Input Register | 输入寄存器 | FC04 读 | 只读 | 模拟量输入（AI） | 电压、电流、温度原始值 |
| Holding Register | 保持寄存器 | FC03 读 / FC06 写单个 / FC16 写多个 | 读/写 | 数据寄存器（V/D/MW） | 过程值、设定值、控制参数 |

靶场把只读遥测和可写控制都放在 Holding Register 区，用地址区间区分权限：

| 地址 | 名称 | 类型 | 读写 | 缩放 | 对应标准点 |
|---|---|---|---|---|---|
| 40001 / HR0 | WindSpeed | uint16 | R | value/10 | WF.WTxx.Environment.WindSpeed |
| 40002 / HR1 | RotorSpeed | uint16 | R | value/10 | WF.WTxx.Generator.RotorSpeed |
| 40003 / HR2 | ActivePower | uint16 | R | value | WF.WTxx.Generator.ActivePower |
| 40004 / HR3 | ConverterTemp | uint16 | R | value/10 | WF.WTxx.Converter.Temperature |
| 40005 / HR4 | FaultCode | uint16 | R | value | WF.WTxx.Alarm.FaultCode |
| 40010 / HR9x | PowerLimitSet | uint16 | R/W | value | WF.WTxx.Control.PowerLimitSet |

注意：点表写的是 `addressing=zero_based_pdu`，即 HR93 就是 PDU offset 93，命令行里不要再加 1 或加 40001。

### 四、为什么"写一个寄存器就能让风机停机"

把上面的链条连起来看就明白了：

```text
1. 点表规定 HR93 = ActivePowerLimitPercent，权限 RW，安全范围 0-100
2. 风机主控进程每个扫描周期读 HR93，把它当成"本机有功功率限制百分比"
3. HR93 = 100 -> 按正常风速、转速、并网状态计算有功功率
   HR93 = 0   -> 有功功率被限制为 0%
4. Modbus 协议层没有认证、没有权限、没有范围校验
5. 于是"写一个寄存器"= "改一条运行参数" = "风机功率归零"
```

没有魔法，也没有漏洞利用代码，这就是协议本身的设计。RTU 忠实地执行了它读到的值。

### 补充：风机侧的三个角色

```text
风机主控（turbine-01~06）
  对应 VM：turbine-01 ~ turbine-06
  归属：生产控制区 / 安全 I 区
  职责：风机启停、限功率、故障状态、运行控制
  协议：OPC UA（主）+ Modbus TCP（辅）+ Syslog

箱变 / 集电线路（collector-box）
  归属：安全 I 区
  职责：箱变 + 多回 35kV 集电线路 + 场内线路监测的压缩模拟
  协议：Modbus TCP，点表含 LvVoltageA/B/C、HvVoltageAB、CurrentA、
        OilTemperature、DoorOpen、SmokeAlarm、FaultCode、
        LINE01/02 的 Current/Voltage/BreakerClosed/GroundFault/OverCurrent

测风塔 / 气象站（met-mast）
  归属：生产控制区 / 安全 II 区
  职责：提供风速、风向、温度、气压；影响功率预测和控制决策，
        但本身不直接控制一次设备
  协议：Modbus TCP + HTTP/HTTPS API
```

## 报文/字段对照

平原链里对 RTU 的读写命令（出自平原链攻击链指南）：

```bash
# 读 HR93（FC03，读保持寄存器）
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6

# 写 HR93=0（FC06，写单个保持寄存器）
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6 0
```

参数逐项解释：

```text
-m tcp    使用 Modbus TCP
-p 502    连接风机 RTU 的 Modbus TCP 端口
-a 1      Unit ID = 1（来自 gateway.conf 与 pointmap.csv）
-0        使用 0-based PDU 地址（点表 addressing=zero_based_pdu）
-r 93     读/写 HR93 / PDU offset 93
-c 1      1 个寄存器
-t 4      16-bit holding register，读时使用 FC03
-1        只轮询一次
末尾的 0  写入值（写时 modpoll 使用 FC06 Write Single Register）
```

写成功后的返回：

```text
Protocol configuration: MODBUS/TCP, FC6
Written 1 reference.
```

## 在攻击链里的位置

```text
平原链（Modbus 路径）：
  通信系统1 10.0.6.8 作为 Modbus Master
  -> WT01-RTU 10.0.5.6:502 / WT02-RTU 10.0.5.4:502 / WT03-RTU 10.0.5.5:502
  -> 写 HR93 = 0（限功率 0%）
  -> HMI 上三台风机功率归零，告警 POWER_LIMIT_ZERO
  -> 恢复：写 HR94 = 1（AlarmReset），RTU 恢复 HR93=100

山区链（IEC104 -> Modbus 路径）：
  frontend3-lower 10.0.4.2 --IEC104 TCP 2404--> conpot RTU 10.0.4.5
  攻击者发 C_SC_NA_1 / IOA=10490（= WT08_STOP_CMD）
  -> Conpot 的控制事件桥接到 WT08 的 Modbus 子站
  -> mountain-wt08-modbus-sim 状态变化，WT08 停机

海上链（OPC UA -> Modbus 路径）：
  OPC UA Method SetTemperatureLimit(40.0)
  -> OPC UA Server 把新阈值写入 Modbus HR96
  -> 风机 Modbus 模拟器检测到温度 73.0 > 40.0
  -> 触发 PROTECTION_STOP，功率归零、脱网
```

三条链的最终写入点都是 Modbus 寄存器，说明在靶场设计里 Modbus 就是物理世界的最后一跳。

## 安全视角

典型薄弱点：

- 可写寄存器就是攻击面。HR90-HR94（RunCommand、ManualOverrideEnable、WindSpeedOverrideX10、ActivePowerLimitPercent、AlarmReset）每一个都能改变过程。
- 手动覆盖标志的滥用。HR91 = ManualOverrideEnable 本来是调试功能，一旦被置 1，校验节点就会判 `SOURCE_OVERRIDE`（源侧伪造）。
- 缺少范围与合理性校验。写 HR92 = 3000（即 300 m/s）在协议层完全合法，只能靠旁路校验判 `RANGE_WIND`。
- PLC/RTU 对异常报文脆弱。不经意的扫描或畸形报文可能导致设备异常，这也是 OT 里不推荐主动扫描的原因。
- RTU 的多主站特性。RTU 往往允许任意 Master 连接，不会拒绝第二个来写的人。

防护要点：

- 在 RTU/PLC 侧对关键寄存器做上下限与合理性校验（拒绝 0-100 之外的限功率值）。
- 进入手动覆盖（HR91）必须授权、记录并设置超时自动退出。
- 用工业防火墙把"谁能写哪个寄存器区间"写进白名单（只放行对 HR90-HR94 的写，拒绝写 HR0-HR89）。
- 对遥测做 HMAC 签名与时间戳新鲜度校验，让改值但签名对不上暴露为 `HMAC_MISMATCH`。
- 保留控制前后的值对照与操作来源（`old_value` / `new_value` / `source`），写入 Historian 与安全监测。
