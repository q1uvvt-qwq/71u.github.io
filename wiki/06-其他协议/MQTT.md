---
title: MQTT 发布订阅与边缘遥测
category: 工控/协议
tags: [MQTT, 发布订阅, QoS, Retained, ACL]
order: 2
source: 工控协议权威资料与学习方案.md、工控协议.md
---

## 一句话概括

MQTT 是基于发布/订阅模型的轻量消息协议，在风电场景里用于"边缘网关 → 统一平台/沙盘"的遥测上送与状态同步：设备把数据发布到某个 Topic，平台订阅它就收得到，不需要设备知道平台在哪。

## 原理

### 发布/订阅模型

MQTT 的核心角色只有三个（依据学习方案）：

```text
Broker    消息代理，所有消息的中转站
Topic     主题，消息的"地址"
Publish / Subscribe   发布订阅
```

工作方式：

```text
发布者（边缘网关）
  -> publish 到 Topic
Broker（Mosquitto 等）
  -> 按 Topic 分发给订阅者
订阅者（统一平台 / 沙盘脚本）
  -> subscribe 到 Topic
```

定义：发布者和订阅者互不知道对方地址，只认 Broker 和 Topic。这与 Modbus 的"上位机主动去问设备"完全不同，属于事件驱动模型。

### Broker 与 Topic

- Broker 是消息中枢，边缘网关和平台都只连 Broker，不互连。
- Topic 是分层字符串，用 `/` 分隔，例如 `wind/plain/turbine/01/telemetry`。
- 订阅时支持通配符：`+` 匹配一层，`#` 匹配多层（这是 ACL 通配符写错问题的根源，见安全视角）。

### QoS 0 / 1 / 2

QoS 是消息投递质量等级（依据 MQTT 5.0 规范，本节为标准规范内容，非实测抓包）：

| QoS | 名称 | 语义 | 代价 |
|---|---|---|---|
| 0 | At most once | 最多一次，发出去就不管 | 可能丢消息 |
| 1 | At least once | 至少一次，需要 PUBACK 确认 | 可能重复 |
| 2 | Exactly once | 恰好一次，四次握手 | 开销最大 |

遥测"周期性重发、丢一条无所谓"，常用 QoS 0；控制/回执类消息业务上倾向 QoS 1 或 2，但要接受额外开销。

### Retained Message（保留消息）

Broker 为某个 Topic 保存最后一条 retained 消息，新订阅者一订阅就立刻收到。

```text
正常用途：新上线的 HMI 一订阅就拿到最新状态，不用等下一个周期。
风险用途：一条 retained 的 command 会一直挂在 Broker 上，
         客户端每次重连都会立刻收到它（见安全视角）。
```

### Will（遗嘱消息）

客户端在 CONNECT 时登记一条 Will 消息，异常断开时由 Broker 代发，工程上常用来做"设备离线告警"：

```text
设备掉线 -> Broker 发布 wind/plain/turbine/01/status = offline
```

注意：只有非正常断开才触发 Will，客户端主动 DISCONNECT 不会发布。

### ACL（主题访问控制）

Broker 侧按"用户 + Topic 模式"授权，控制谁能发布、谁能订阅，这是 MQTT 场景最关键的一道边界：

```text
诊断账号   -> 只允许 subscribe telemetry
控制账号   -> 允许 publish command
```

### 边缘遥测场景

学习方案给出的真实位置：

```text
边缘网关 -> 统一平台/沙盘   协议：MQTT、HTTP、OPC UA   数据：遥测、状态、控制回执
```

结合 IEC 61400-25 的信息模型，边缘侧按统一命名发布风机的测量/状态/控制/告警对象，平台侧只管订阅。

## 概念与关注点对照

| 概念 | 说明 | 靶场关注点 |
|---|---|---|
| Broker | 消息代理 | 是否允许匿名连接、是否有 ACL |
| Topic | 主题，`/` 分层 | 命名规范是否泄露业务结构 |
| Publish / Subscribe | 发布 / 订阅 | 谁能发 command |
| QoS | 投递质量等级 0/1/2 | 控制消息是否可靠送达 |
| Retained Message | 保留最后一条 | 旧 command 是否残留 |
| ACL | 主题访问控制 | 通配符是否写错 |
| Payload schema | 业务消息结构 | 字段是否做校验 |

## 用法

### 命名规范示例

学习方案要求"topic 命名规则必须来自运维文档、配置文件或 broker ACL 泄露"，不允许猜：

```text
遥测上行：
wind/plain/turbine/01/telemetry
wind/plain/turbine/02/telemetry

控制下行：
wind/plain/turbine/01/command
wind/plain/turbine/02/command

状态/在线：
wind/plain/turbine/01/status
```

分层含义：

```text
wind      业务域
plain     场景（平原 / 山区 / 海上）
turbine   设备类型
01        设备编号
telemetry / command / status   数据方向与用途
```

### 靶场化设计（依据学习方案阶段 5）

```text
1. telemetry topic 发布风机遥测。
2. command topic 接收控制命令。
3. 设计 ACL 错误：诊断账号只应订阅，却能发布某个控制 topic。
4. HMI 显示 retained command 导致风机状态异常。
```

## 安全视角

MQTT 在靶场里主要暴露三类弱点。

### 1. ACL 通配符写错导致越权发布

本该只读的诊断账号，因 ACL 里用了过宽的通配符（如误写 `wind/#` 而不是 `wind/+/+/telemetry`），能往 `.../command` 发布消息。后果是"只读账号"能下发控制。

防护：ACL 按"用户 → 精确 Topic 模式 → 动作（pub/sub）"三元组收紧；避免在写权限里使用 `#`；对 command 类 Topic 单独设账号。

### 2. Retained 旧命令导致重连后误动作

一条 retained 的 command 常驻 Broker。设备或 HMI 重连时立刻收到这条可能是很久以前的命令并执行，造成误动作。

防护：控制类 Topic 不要使用 retained；若必须保留状态，只对 status/telemetry 用 retained；命令带时间戳与有效期，接收端做新鲜度校验（可参考 STALE 判定的思路）。

### 3. Payload 无 schema 校验

Payload 是业务自己定的结构（类似 Modbus 点表）。接收端不校验字段类型、范围、必填项时，攻击者可以构造畸形消息让 HMI 显示异常值或触发逻辑错误。

防护：对 payload 做 schema 校验（字段白名单、类型、范围）；对关键控制消息做签名或一次性令牌。

### 通用注意

- Broker 是否允许匿名连接、是否使用默认端口与默认口令，是 MQTT 场景的第一检查点。
- MQTT 本身可以跑 TLS，但很多工业现场为了"轻量"是明文，需按分区要求评估。
- 依据：MQTT Version 5.0 OASIS Standard，https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html
