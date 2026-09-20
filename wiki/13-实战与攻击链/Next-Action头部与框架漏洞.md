---
title: Next-Action 头部与框架漏洞
category: 实战与攻击链/框架漏洞
tags: [Next.js, Server Action, Next-Action, Flight协议, 攻击面, 抓包]
source: 课程 week2 · Next-Action 头部解析
order: 3
---

## 一句话概括

`Next-Action` 是 Next.js 客户端调用 **Server Action** 时自动加上的**框架内部请求头**。它把一条普通的 HTTP 请求标记成「请执行某个服务端函数」，因此这个头部本身就成了一个**攻击面** —— 攻击者只要会伪造它，就能直接触达服务端的反序列化与函数调用逻辑。

## 原理

### 1. 框架内部头部为什么天然是攻击面

一个 Web 框架会引入很多「自己的东西」：自己的请求头、自己的 Cookie、自己的序列化格式、自己的路由前缀。这些东西的共同特点是 —— **框架认为「只有我自己会发出来」，所以处理它们时格外放松警惕。**

这就是**功能面**和**暴露面**的错位：

| | 功能面（框架的视角） | 暴露面（攻击者的视角） |
|---|---|---|
| 谁会发这个头部 | 只有 Next.js 自己的客户端代码 | 任何人，用 curl / Burp 都能加 |
| 头部里的值 | 构建时生成，客户端自动填 | 抓包就能看到，可以照抄、可以改 |
| 服务端收到后做什么 | 直接进入「函数调用」流程 | 直接进入「函数调用」流程 |
| 有没有额外的身份校验 | 有 Origin/Host 校验（见后文） | 只要请求头对得上，校验就过 |

**关键推论有三条**：

1. **内部头部不是「隐藏」的**：它就明文躺在每一个正常的 RSC 请求里，抓一个包就能看到完整样式。它带来的是「不常见」，而不是「不可见」。
2. **内部头部往往能跳过业务层的判断**：服务器看到 `Next-Action` 就认为「这是框架在调函数」，于是直接走**反序列化 → 执行函数**这条路，而不是走「读参数 → 校验 → 按业务规则处理」。React2Shell 那条链，正是发生在这条「框架专用通道」里。
3. **头部本身是可以被攻击者控制的**：既然它只是一个普通的 HTTP 头，那么它的取值、是否重复、是否带异常字符，攻击者都能自由构造。很多框架级漏洞的入口就是「某个内部头部被塞进了不该有的内容」。

一句话总结这个规律：**框架为了「自己用着方便」而引入的每一种内部约定，对攻击者来说都是一条直达框架内部逻辑的捷径。**

### 2. `Next-Action` 的具体作用

**`Next-Action` = 「这是服务员呼叫铃，不是普通请求」**

对比一下普通 API 请求和 Server Action 请求：

```javascript
// 普通 API 请求：
POST /api/cart/add
Content-Type: application/json

{"productId": "123"}
```

```javascript
// Server Action 请求：
POST /_next/action
Content-Type: text/plain; charset=utf-8
Next-Action: <Action 标识>     // 关键头部！告诉 Next.js 这是一次 Action 调用

0:["action_id",["addToCart"]]
1:["args",["123"]]
```

区别有三处：

| 差异 | 普通 API 请求 | Server Action 请求 |
|---|---|---|
| 路径 | 业务自己定义的 `/api/...` | 框架保留路径 |
| Content-Type | `application/json` | `text/plain`（Flight 格式） |
| 关键头部 | 无 | **`Next-Action`**（唯一的「身份声明」） |

也就是说，**服务端区分「这是普通页面请求」还是「这是要执行函数」，靠的就是这一个头部。**

### 3. 完整的请求 / 响应头

#### 客户端发出的请求头

```http
POST /_next/action HTTP/1.1
Host: example.com
Content-Type: text/plain; charset=utf-8     // Flight 协议格式
Next-Action: <Action 标识>                   // 唯一标识这次 Action 调用
Accept: text/plain, */*                      // 接受 Flight 格式响应
Cookie: session=xyz789                      // 自动带上认证信息
Next-Router-State-Tree: [...]
Next-Url: /products/iphone
Content-Length: 128
```

逐个头部的作用：

| 头部 | 作用 | 安全含义 |
|---|---|---|
| `Content-Type: text/plain` | 声明请求体是 Flight 格式 | 也意味着「服务端要反序列化它」 |
| `Next-Action` | 标识要调用哪个 Action | **本节的攻击面核心** |
| `Accept: text/plain` | 声明想要 Flight 格式的响应 | — |
| `Cookie` | **自动携带认证信息** | 这是 CSRF 风险的来源（见下） |
| `Next-Router-State-Tree` | 当前路由状态 | 攻击者也需要伪造它才能打进某些路径 |

#### 服务器返回的响应头

```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8     // Flight 格式响应
X-Action-Status: success                    // Action 执行状态
X-Action-Error: (如果有错误)
X-Action-Redirect: /cart                    // 如果需要重定向
Cache-Control: no-cache, no-store           // Action 结果不缓存
Vary: RSC, Next-Router-State-Tree           // 缓存策略
```

`X-Action-*` 这一组响应头是**很好的指纹**：抓到一个响应里带 `X-Action-Status`，基本就能确定目标用了 Server Action。

### 4. 工作原理

#### 第一步：头部是怎么生成的

Next.js 在**编译期**为每个 Server Action 生成唯一 ID：

```javascript
// 源码：app/actions/cart.ts
export async function addToCart() { /* ... */ }

// 编译后：addToCart 函数被赋予一个指纹 ID，例如 '1a2b3c...'
```

客户端调用时，Next.js 的运行时自动把头部加上去：

```javascript
fetch('/_next/action', {
  headers: {
    'Next-Action': '1a2b3c...'    // 对应 addToCart 函数
  }
});
```

#### 第二步：服务器怎么识别

```javascript
function handleRequest(request) {
  // 检查是否是 Action 请求
  if (request.headers.get('Next-Action')) {
    const actionId = request.headers.get('Next-Action');

    // 1. 按 ID 查找对应的 Server Action 函数
    const actionFunction = findActionById(actionId);

    // 2. 解析 Flight 格式的请求体
    const args = parseFlightBody(request.body);

    // 3. 执行函数
    const result = await actionFunction(...args);

    // 4. 返回 Flight 格式响应
    return new Response(serializeToFlight(result), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  // 普通页面请求...
}
```

把这段伪代码当成攻击面地图来读：

| 步骤 | 输入来自哪里 | 风险 |
|---|---|---|
| `findActionById(actionId)` | **`Next-Action` 头部** | 攻击者可以填任意值，试探有哪些 Action 存在 |
| `parseFlightBody(request.body)` | **请求体，完全可控** | **这就是 React2Shell 的落脚点**：反序列化不可信输入 |
| `actionFunction(...args)` | 由前两步得出 | 参数被反序列化成对象后直接传进函数 |

**每一个箭头都是一次「把不可信输入交给有能力执行动作的代码」的机会。**

#### 第三步：为什么需要这个头部

```javascript
// 没有 Next-Action 头部会怎样？

// 问题1：无法区分普通请求和 Action 请求
POST /_next/action    // 这是 Action 请求？还是其它东西？

// 解决方案：用头部明确标识
POST /_next/action
Next-Action: xxx      // 明确告诉服务器："这是一次 Server Action 调用"

// 问题2：CSRF 风险
// 恶意网站可能伪造请求打到 /_next/action
```

**关于问题 2，需要说清楚一层**：因为 Action 请求会**自动携带 Cookie**，浏览器只要发出这个请求，认证信息就跟着走了 —— 这正是 CSRF（跨站请求伪造）的经典条件。Next.js 对此的防护，是在服务端**校验 `Origin` 与 `Host` 是否一致**（不一致就拒绝），而不是把令牌塞进 `Next-Action` 头部里。

### 5. `Next-Action` 的值到底是什么

这是最容易搞混的一点，原文专门追问过：

```text
Next-Action: abc123  // 这后面的信息是生成的唯一值吗，还是随便都行？
```

**结论：是生成的唯一值，不是随便写的。**

| 写法 | 结果 |
|---|---|
| `Next-Action: hello` | 失败 —— 找不到对应的 Action |
| `Next-Action: 123456` | 失败 |
| `Next-Action: addToCart` | 失败 —— 不是「函数名」，是「构建期生成的标识」 |
| `Next-Action: <构建期生成的标识>` | 成功 |

它的真实形态是一串**由构建期哈希得到的十六进制字符串**（40 位左右），由 Next.js 扫描源码里所有带 `"use server"` 的函数后生成，并随客户端 bundle 一起下发：

```javascript
// 1. 开发时，Next.js 扫描代码
// app/actions/cart.ts
"use server";
export async function addToCart(productId) { /* ... */ }

// 2. 为函数生成指纹（构建期完成，结果固定）
//   —— 输入是文件路径 + 函数名 + 函数内容，输出一个哈希值
//   —— 这就是 Next-Action 的取值

// 3. 编译进客户端 bundle，运行时按需取用
```

**为什么这个细节重要**：因为它决定了攻击者的动作方式。

- 如果值是**随便填都行**，攻击者就完全不需要做什么侦察；
- 因为值是**构建期固定的标识**，攻击者就**必须先把真实值拿到手**（从页面流量里抓、从 JS bundle 里翻）。所以抓包看正常的 RSC 请求，是这类攻击**不可跳过**的第一步。

## 本题情景与解题手法

### 题目形态

手上没有目标源码，只有一个 `Next.js` 站点。目标是判断它是否用了 Server Action、以及能不能利用。抓包能看到这样的请求：

```http
POST / HTTP/1.1
Host: 靶机地址
Content-Type: text/plain;charset=UTF-8
Next-Action: <一长串十六进制标识>
Next-Router-State-Tree: [...]
Accept: text/x-component
```

响应里带有（或页面 HTML 里存在）：

```http
X-Action-Status: success
```

### 第一步：确认框架和渲染模式

判断依据：

- 响应头 / HTML 里有 `x-nextjs-*`、`__NEXT_DATA__`、`X-Powered-By: Next.js` → **是 Next.js**；
- 请求里出现 `Content-Type: text/plain` 的 POST，并且带 `Next-Action` → **用了 Server Action（即 RSC）**。

两条都成立，才进入下一步。

### 第二步：判断 `Next-Action` 是不是必需的

做法很简单：**把头部删掉，其余不变，再发一次。**

| 操作 | 观察 | 结论 |
|---|---|---|
| 带 `Next-Action` | 正常返回 Flight 响应 | 头部是「进入 Action 通道」的开关 |
| 删掉 `Next-Action` | 返回页面 HTML 或 404 | 不带这个头，服务端**不会**去解析请求体里的 Action 数据 |

判断依据是：**同一个请求体，加不加这个头部，走的是完全不同的代码路径**。这就证明了它是一个「控制流开关」—— 而任何控制流开关，都是值得尝试伪造的东西。

### 第三步：拿到真实的 Action 标识

因为标识是构建期生成的，必须从目标的客户端资源里找：

| 来源 | 怎么找 |
|---|---|
| 正常流量 | 在页面上点几下会触发 Action 的按钮，抓包里就有 |
| JS bundle | 下载 `.js` 资源，搜索 `createServerReference` / 40 位十六进制串 |
| 已知路径 | 注意请求里的 `Next-Router-State-Tree`，它标明了当前路由 |

### 第四步：把请求体换成恶意内容

拿到标识之后，`Next-Action` 头部照抄，**把请求体（Flight 数据）换掉**，去触发服务端解析器的边界行为（具体链见《预认证 RCE 与 React2Shell》）。

判断依据：这里验证的不再是「能不能调用这个函数」，而是「解析器会不会因为这段数据而执行了不该执行的东西」。

### 手法一句话总结

> **抓一个正常 RSC 请求** → 认两个指纹（`text/plain` 的 POST + `Next-Action` 头）→ **删掉头部做对照**，确认它是控制流开关 → 从流量或 JS bundle 里**取到构建期生成的 Action 标识** → 保留头部、替换 Flight 请求体 → 把攻击载荷送进框架的反序列化通道。

## 利用条件

1. 目标是 Next.js / React RSC 应用，且启用了 **Server Action**
2. 能拿到**真实的 Action 标识**（抓包或从 bundle 中提取）
3. 服务端会解析请求体里的 **Flight 序列化数据**（反序列化入口存在）
4. 请求能通过 **Origin / Host 校验**（同源直接构造即可；跨站则需要绕过）

## 踩坑与备注

- **原始笔记里有一处需要修正的地方**：原文把 `Next-Action` 的值描述成一串「类似 JWT 的加密令牌」，并给出了 `action / timestamp / nonce / signature / exp` 这样的解码结构。**这个描述是一个类比，并不符合该头部的真实形态** —— 真实取值就是构建期生成的 Action 标识（十六进制哈希串），里面不含时间戳、随机数或签名。原文的核心结论（「是生成的唯一值，不是随便写的」）是**正确**的，只是「值里有什么」这一步的解释需要按上面的说明更正。
- **CSRF 防护不靠这个头部**：Next.js 对 Server Action 的跨站防护，是在服务端比较 **`Origin` 与 `Host`**（及 `X-Forwarded-Host`）是否一致，不一致直接拒。所以「伪造请求到 `/_next/action`」并不能仅靠补上一个 `Next-Action` 头就成功。
- **内部头部值得单独记住**：`Next-Action` 只是一个例子。凡是框架为了自己方便而引入的请求头、Cookie 名、序列化格式，都应当被当作「攻击者可以直接构造的输入」来对待，而不是「框架内部的东西，外面碰不到」。
- **`X-Action-Status` 是好用的指纹**：它出现得比 `Next-Action` 更「无意」（响应头往往是被动暴露的），在识别资产时比主动构造请求更稳妥。
- **标识不是秘密**：它被明文写进客户端 bundle，所以「生成的值」并不等于「保密的值」。指望靠它隐藏 Action 是不现实的。
