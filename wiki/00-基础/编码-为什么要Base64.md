---
title: 为什么要 Base64：include 无回显而 php://filter 有回显
category: 基础/编码
tags: [PHP, php://filter, base64, include, readfile, 文件包含, 源码泄露]
order: 8
---

## 一句话概括

因为 **`include` 是「执行」源代码**，而 **`php://filter` 是「读取」原始字节**。一旦用 `convert.base64-encode` 把源码变成一串 Base64，`include` 拿到的就不再是可执行的 PHP 代码、而是一段普通文本，于是它只能把这串文本**原样输出**出来 —— 这就是「有回显」的来源。

> 关键不是「绕过了什么限制」，而是 **Base64 从根上改变了 `include` 函数接收到的数据类型**：从「可执行的代码」变成「普通的文本数据」。

## 原理

### 场景 1：直接包含 `index.php`（无回显）

**你的 Payload：**

```text
?filename=../index
```

后端代码执行：

```php
include('/var/www/html/files/../index.php');
```

**发生了什么？**

1. **文件系统解析路径**：路径被解析为 `/var/www/html/index.php`。
2. **PHP 引擎介入**：`include` 函数找到了这个文件。
3. **关键步骤：执行而非显示**：`include` 的核心功能是**将目标文件的内容当作 PHP 代码来执行**。
4. **结果**：
   - `index.php` 文件里的所有 HTML 和文本会正常输出到浏览器。
   - 但是，**所有的 `<?php ... ?>` 代码块都被 PHP 引擎执行了**，执行后的结果（如果有 `echo` 或 `print`）会输出，而代码本身不会显示。
   - 如果 `index.php` 里没有输出任何内容的 PHP 代码（例如，它只有一些 `if/else` 逻辑、函数定义或数据库连接），那么你在浏览器上就看不到任何来自 PHP 代码的「回显」。你看到的只是它输出的 HTML 骨架。

**举个例子：** 假设 `index.php` 内容如下：

```php
<?php
$title = "My Homepage"; // 这行执行了，但无输出
$user = "Admin";        // 这行也执行了，但无输出
?>
<html>
<head><title><?php echo $title; ?></title></head>
<body>
    <h1>Welcome, <?php echo $user; ?>!</h1>
</body>
</html>
```

当你用 `include` 包含它时：

- 你会在浏览器看到：`Welcome, Admin!`
- 但你永远看不到 `<?php $title = "My Homepage"; ?>` 这行源代码

> **为什么会「无回显」**：PHP 解释器逐行读这个文件，遇到 `<?php ... ?>` 就执行、遇到 `?>` 外面的内容就原样吐出。执行 `$title = "..."` 只是往内存里写了个变量，没有任何 `echo`，所以浏览器上什么都没有。**页面看起来是空的，不代表文件是空的** —— 这正是新手在这里卡住的原因。

### 场景 2：使用 `php://filter` 读取 `index.php`（有回显）

**你的 Payload：**

```text
?filename=php://filter/read=convert.base64-encode/resource=../index
```

后端代码执行：

```php
include('php://filter/read=convert.base64-encode/resource=../index.php');
```

**发生了什么？**

1. **PHP 包装器介入**：`php://filter` 是一个包装器，它像一个「数据过滤器」或「处理管道」。
2. **改变数据流**：这个 Payload 的指令是：
   - **`resource=../index.php`**：首先，读取 `/var/www/html/index.php` 文件的**原始内容**（注意：是原始的字节流，还没有被当作 PHP 代码执行）。
   - **`convert.base64-encode`**：然后，将这个原始内容（包括所有的 `<?php ... ?>` 标签）全部进行 Base64 编码。
   - **传递给 `include`**：最后，将这个 Base64 编码后的字符串传递给 `include` 函数。
3. **关键步骤：执行的是 Base64 字符串，而不是 PHP 代码**：
   - `include` 函数拿到的不再是 `<?php ... ?>`，而是一串像 `PD9waHAg...` 这样的 Base64 编码文本。
   - PHP 引擎试图将这串 Base64 文本当作 PHP 代码来执行。
   - 由于这串 Base64 文本不是有效的 PHP 语法，**PHP 引擎执行失败，它所能做的就是将这串“无效代码”原样输出（Echo）到浏览器**。

**结果：**

- 你在浏览器上看到的，不再是渲染后的网页，而是 `index.php` 文件**完整的、经过 Base64 编码的源代码**。
- 你将这串 Base64 字符串解码，就能得到 `index.php` 的原始代码，包括所有被注释掉的内容、数据库密码、逻辑代码等。

### 核心区别总结

| 特性 | 直接包含 `index.php` | 使用 `php://filter` + Base64 |
| :--- | :--- | :--- |
| **数据处理方式** | 文件内容被当作 **PHP 代码执行** | 文件内容被当作 **普通数据流** 处理 |
| **PHP 引擎行为** | 解析并执行 `<?php ... ?>` 标签 | 不执行源文件中的 PHP 标签，只是读取它们 |
| **输出内容** | 执行代码后产生的 **结果**（HTML、echo 的输出） | 源文件的 **原始字节**（经过 Base64 编码） |
| **能看到源代码吗？** | **不能** | **能**（解码后） |
| **类比** | 让厨师（PHP 引擎）**做菜**，你吃到的是**成品**。 | 让厨师把**菜谱**（源代码）抄写一份给你。 |

### 为什么是 Base64，而不是明文直接输出

这是本题最容易被跳过的推理，展开讲清楚：

**第一步：为什么不能直接「读出来就显示」？**
`include` 的语义就是「执行」，它**没有「只显示不执行」的开关**。你想让服务端把文件内容交给你，就必须让 `include` 拿到的东西**天然不可执行**。所以问题变成了：**怎样把一段 PHP 源码变得没法被执行？**

**第二步：把这个需求翻译成技术条件。**
一段内容能被 PHP 执行，前提是它里面含 `<?php` 开标签（或短标签 `<?`）。所以只要**破坏掉开标签**，代码就失效了。有两种办法：

- **改字符本身**（ROT13 / `iconv` 字符集转换）；
- **整体换一种表示法**（Base64）。

**第三步：为什么「整体换表示法」比「改字符」更省心？**

| 方案 | 结果内容长什么样 | 副作用 |
| :--- | :--- | :--- |
| **Base64** | `PD9waHAKJHRpdGxlID0g...` | 输出是**严格可逆**的，一个 `base64 -d` 就还原，**没有任何乱码残留** |
| **ROT13** | `<?cuc $gvgyr = ...` | 字母被换掉，输出里**混着大量原始字符**，且只对字母生效 |

- Base64 的字母表是 `A-Za-z0-9+/=`，**不含 `<`、`?`、`>`、空白符**，所以编码后的整段文本里**绝不会出现 `<?php`**，`include` 100% 不会执行它；
- 反过来，**任何非法字节都不会出现在 Base64 输出里**，页面上不会出现乱码、不会被浏览器/终端吞掉；
- Base64 是**可无损还原**的，你能拿到 100% 原始的源码（包括注释、密码、逻辑）。

**第四步：还有一个不那么显然的好处 —— 抗特殊字节。**
如果直接明文输出源码，源码里可能有：
- `%00` / 空字节：可能被下游环节当成截断；
- 二进制内容（图片马、`phar` 包）：页面输出会乱码甚至被截断；
- 中文/非 UTF-8 字节：编码不一致时直接乱码。

Base64 之后，输出**一定是纯 ASCII**，完全规避了这些问题。

**一句话回答「为什么是 Base64 而不是明文」**：因为明文会被 `include` 当代码执行掉（要的就是它「不可执行」），而在所有能「让代码不可执行」的手法里，**Base64 是唯一同时满足「完全可逆、纯 ASCII 无乱码、不残留原字符」的那一种**。

### 那么什么时候可以直接回显

**直接回显**发生在被包含的文件内容**没有被当作代码执行**，而是被当作**纯文本数据**读取并输出。（原文追问，保留如下）

#### 1. 包含非 PHP 文本文件（最常见）

这是最直接的情况。如果后端使用的是 `readfile()`、`file_get_contents()` 或 `echo file_get_contents()` 这类函数，它们会直接输出文件的原始内容。

**示例代码：**

```php
<?php
$file = $_GET['filename'];
echo file_get_contents($file); // 直接读取并回显内容
?>
```

**可回显的文件类型：**

- `?filename=../../etc/passwd` —— Linux 密码文件
- `?filename=../../readme.txt` —— 文本文件
- `?filename=../../config.json` —— JSON 配置文件
- `?filename=../../image.jpg` —— 二进制文件（会显示乱码，但内容被输出）
- `?filename=../../.env` —— 环境配置文件
- `?filename=../../access.log` —— 日志文件

在这些情况下，文件内容**原样输出**，你可以直接看到源代码或文件内容。

#### 2. 文件包含函数包含非 PHP 文件

即使使用 `include` 或 `require`，如果被包含的文件**不是 PHP 文件**（没有 `<?php ... ?>` 标签），内容也会被直接回显。

**示例：**

```php
<?php
$file = $_GET['filename'];
include($file); // 包含用户指定的文件
?>
```

**可回显的情况：**

- `?filename=../../readme.txt` —— 纯文本文件，内容直接显示
- `?filename=../../test.html` —— HTML 文件，浏览器会渲染 HTML
- `?filename=../../config.ini` —— 配置文件，内容直接显示

**为什么？** 因为 `include` 遇到非 PHP 代码时，会直接将其作为 HTML/文本输出。

#### 3. 被包含的 PHP 文件中有 `echo`、`print` 等输出语句

如果被包含的是 PHP 文件，但该文件中包含输出语句，你会看到**执行结果的回显**，而不是源代码。

**示例：** 假设 `config.php` 内容如下：

```php
<?php
$db_host = "localhost";
$db_user = "root";
$db_pass = "password123";
echo "Database configuration loaded!";
// 注意：这里输出了字符串，但没有输出变量值
?>
```

当你包含它时：`?filename=../../config.php`

**回显结果：**

```text
Database configuration loaded!
```

你可以看到 `echo` 的输出，但**看不到变量值或源代码**。

## 利用条件

1. **存在可控的文件包含点**：`include($_GET['x'])` 这类；
2. **`php://` 包装器未被禁用**：`allow_url_include` 对 `php://input` 有影响，`php://filter` 一般不受它限制；
3. **目标文件进程可读**：`open_basedir` 外的文件读不到；
4. **要有输出通道**：`include` 会把「无法解析的文本」吐给浏览器，这就是回显；若中间有 `ob_*` 缓冲或 `die` 拦截，就需要另想办法。

## Payload 速查

| 目的 | Payload |
| :--- | :--- |
| 读源码（Base64，首选） | `?filename=php://filter/read=convert.base64-encode/resource=index.php` |
| 读源码（ROT13） | `?filename=php://filter/read=string.rot13/resource=index.php` |
| 读源码（iconv） | `?filename=php://filter/convert.iconv.utf-8.utf-16/resource=index.php` |
| 读非 PHP 文件直接回显 | `?filename=../../etc/passwd` |
| 读请求体 | `?filename=php://input`（配合 POST 体） |
| 解回 Base64 | `echo "PD9waHAK..." \| base64 -d` |

## 完整示例

一次完整的「包含 → 读源码 → 解码」流程：

**1. 确认包含点存在**

```http
GET /?filename=../../../etc/passwd HTTP/1.1
Host: 靶机地址
```

响应里出现 `root:x:0:0:...` → 包含点可用。

**2. 读首页源码**

```http
GET /?filename=php://filter/read=convert.base64-encode/resource=../../../var/www/html/index.php HTTP/1.1
Host: 靶机地址
```

响应体：

```text
PD9waHAKaW5jbHVkZSgkX0dFVFsnZmlsZW5hbWUnXSk7Cj8+Cg==
```

**3. 解码**

```bash
echo "PD9waHAKaW5jbHVkZSgkX0dFVFsnZmlsZW5hbWUnXSk7Cj8+Cg==" | base64 -d
```

得到：

```php
<?php
include($_GET['filename']);
?>
```

**这就是它的源码** —— 明文包含时你永远看不到这几行。

## 踩坑与备注

- **「无回显」的三种可能原因，要分清**：① 文件确实是空的；② 文件只有逻辑没有 `echo`（本文场景 1）；③ 包含成功但路径不对，实际没读到东西。做题时用 `?filename=../../etc/passwd` 打个样，先确认**包含链路本身是通的**。
- **Base64 是「读」方向的编码器**，写法必须是 `read=convert.base64-encode`；写到文件时才是 `write=convert.base64-decode`，两者不要写反（详见 `PHP文件读写函数对比.md`）。
- **`convert.base64-encode` 也可以简写成 `convert.base64-encode` 的省略形式 `convert.base64-encode`** —— 注意 `read=`/`write=` 可以省略，`php://filter/convert.base64-encode/resource=x` 默认作用在读方向。
- **原文的表格最后一格被截断**（「让厨师把菜谱抄写一份给你，他」），本文已补全为完整表述。
