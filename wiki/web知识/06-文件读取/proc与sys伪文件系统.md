---
title: proc 与 sys 伪文件系统
order: 6
category: 文件读取/伪文件系统
tags: [proc, /proc/self, sys, 信息泄露, 文件描述符, 容器]
source: geek 靶场 week2
---

## 一句话概括

`/proc` 和 `/sys` 是**内核暴露出来的伪文件系统**：磁盘上并不存在这些文件，读它们等于在**向内核查询运行时状态**。在文件读取类漏洞里，它们是「读进程自身信息、拿提权线索」的入口 —— 尤其是 `/proc/self/*`，读的是**目标进程自己**，而不是你所在的目录。

## 原理

### 1. `/proc` 是运行时信息的统一出口

Linux 把内核里成千上万的运行时状态，统一抽象成一批**可读的文本文件**放在 `/proc` 下：

- 每个进程有一个 `/proc/<PID>/` 目录，里面是该进程的全部信息；
- `/proc/self` 是一个**动态符号链接**，谁读它，它就指向谁 —— 所以 `/proc/self/xxx` 读的是「**执行这次读取的那个进程**」的 `xxx`。

Web 场景里这一点很关键：通过文件读取漏洞访问 `/proc/self/environ`，读到的是 **Web 服务进程（如 PHP-FPM）** 的环境变量，不是攻击者 shell 的。

### 2. 类别一：进程自身信息（`/proc/self/`）

这些文件用于**进程自我诊断**。

| 路径 | 内容 | 用途 | 示例命令 |
|---|---|---|---|
| `/proc/self/cmdline` | 启动当前进程的完整命令行，参数之间用**空字符**（`\0`）分隔 | 看进程是怎么被启动的。例如 Web 服务器可借此知道自己的配置文件路径 | `cat /proc/self/cmdline \| tr '\0' '\n'`（换行替换空字符，便于阅读） |
| `/proc/self/environ` | 当前进程的**环境变量**，同样以空字符分隔 | 看运行时的环境配置，如 `PATH`、`USER`、`HOME` 以及各种应用特定的密钥、配置路径。**安全场景下这里可能泄露敏感信息（如数据库密码）** | `cat /proc/self/environ \| tr '\0' '\n'` |
| `/proc/self/exe` | 一个符号链接，指向当前进程所执行的**二进制文件的绝对路径** | 找到程序本身的真实位置，甚至可以通过它重新运行自己（`/proc/self/exe`） | `ls -la /proc/self/exe` |
| `/proc/self/fd/` | 一个目录，包含当前进程打开的所有**文件描述符**（FD）的符号链接 | ① 诊断：看进程正在读写哪些文件、网络连接；② 恢复：文件被删除但进程还开着 fd 时，仍可通过 `/proc/self/fd/X` 读到内容。其中 `fd/0` 是标准输入、`fd/1` 标准输出、`fd/2` 标准错误 | `ls -la /proc/self/fd/` |
| `/proc/self/status` | 当前进程的各种状态信息，格式更易读 | 快速查看 PID、PPID（父进程 ID）、内存使用、权限、状态等 | `head -n 10 /proc/self/status` |
| `/proc/self/maps` | 当前进程的**内存映射**，即虚拟内存布局 | 高级调试，看程序代码、库、堆、栈在内存中的位置；安全研究人员常用来分析漏洞 | `cat /proc/self/maps` |
| `/proc/self/cwd` | 一个符号链接，指向进程的**当前工作目录** | 了解进程是在哪个目录下运行的 | `ls -la /proc/self/cwd` |

> `cwd` 的用法：`ls /proc/self/cwd` 就能**列出该进程当前工作目录下的所有文件** —— 注意，这里 `cwd` 是一个目录符号链接，`ls` 会跟随它并列出目标目录的内容，而不是打印链接本身。

`fd` 的具体数据结构和为什么它能**绕过路径过滤**，见 `06-文件读取\文件描述符fd与内核结构.md`。

### 3. 类别二：`/sys` 文件系统

`/sys` 是另一个虚拟文件系统，主要用于管理内核参数、硬件设备（**统一设备模型**）。

| 路径 | 内容 | 用途 | 示例命令 |
|---|---|---|---|
| `/sys/class/net/` | 一个目录，包含所有网络接口的符号链接 | 枚举系统上的网络接口（如 `eth0`、`lo`、`wlan0`） | `ls /sys/class/net/` |
| `/sys/block/` | 一个目录，包含所有块设备（硬盘、光盘驱动器等）的符号链接 | 枚举系统上的磁盘设备（如 `sda`、`sr0`） | `ls /sys/block/` |
| `/sys/devices/` | 系统的设备树，以层次结构展示所有物理和虚拟设备 | 了解硬件拓扑结构，非常复杂但信息量巨大 | `ls /sys/devices/` |

### 4. 总结与类比

下表把「伪文件路径」和「它等价于哪条命令」对应起来，方便记忆和现场替换：

| 文件路径 | 核心用途 | 类比命令 |
|---|---|---|
| `/proc/self/cmdline` | 查看自己的命令行 | `ps -p $$ -o args` |
| `/proc/self/environ` | 查看自己的环境变量 | `env` |
| `/proc/self/exe` | 找到自己的二进制文件 | `readlink /proc/self/exe` |
| `/proc/self/fd/` | 查看自己打开的文件 | `lsof -p $$` |
| `/proc/self/status` | 查看自己的进程状态 | `ps -p $$ -o pid,ppid,user,stat` |
| `/proc/cpuinfo` | 查看 CPU 信息 | `lscpu` |
| `/proc/meminfo` | 查看内存信息 | `free` |
| `/proc/mounts` | 查看挂载信息 | `mount` |

这就是「伪文件系统」这个说法的由来：**读写这些路径，本质上是在调用内核，而不是在操作磁盘上的字节**。`/proc/self/status` 就相当于 `ps`，`/proc/self/environ` 就相当于 `env`。

### 5. 讲通点一：`/proc/self/cwd/app.py` 和 `cat app.py` 到底差在哪

这两条命令读的**都叫 `app.py`**，但它们各自以**不同的「当前目录」**为参照系：

- **`cat app.py`**：相对路径，参照系是**你当前所在 shell 终端的 cwd**。终端在哪个目录，就读哪个目录下的 `app.py`。
- **`cat /proc/self/cwd/app.py`**：参照系是**进程自己的 cwd**（`/proc/self/cwd` 指向运行中进程的工作目录）。

注意这里有一个容易混淆的细节：`/proc/self` 中的 `self` 指的是**执行这次打开操作的进程**。在手工敲命令的场景下，`cat` 这个命令本身就是「执行者」，所以 `cat /proc/self/cwd/app.py` 里的 `self` 指的是 `cat` 自己（它继承了 shell 的 cwd），看起来和 `cat app.py` 差不多。**真正有价值的用法是在「文件读取漏洞」场景**：此时打开文件的是 Web 服务进程，`/proc/self/cwd/` 指向的就是那个服务进程的工作目录 —— **即使攻击者完全不知道服务器的目录结构，也能通过它定位到实际运行中的应用文件**。

这也解释了原笔记里的那句提醒：

> 「当前进程」指的是实际执行代码的那个程序，不一定是你打字的那个终端界面。

`ls -la`、`cat app.py`、`cat /proc/self/cwd/app.py` 的定位差异可以这样归纳：

| 命令 | 参照系 | 特点 / 风险 |
|---|---|---|
| `ls -la` | 你当前终端所在目录 | 取决于终端在哪，可能和进程目录不是同一个 |
| `cat app.py` | 你当前终端所在目录 | 终端不在进程目录时，可能找不到文件或读错文件 |
| `cat /proc/self/cwd/app.py` | **进程**的当前工作目录 | 确保读到的是**实际运行中的应用文件** |

### 6. 讲通点二：`/proc/self/environ` 为什么会泄露数据库密码

环境变量是**启动进程时由父进程（shell、容器运行时、systemd 等）传进去**的，进程启动后就一直挂在 `/proc/<PID>/environ` 里。而现实中的部署习惯是：**把配置从代码里拆出来，通过环境变量注入** —— 十二要素应用（12-Factor App）明确推荐这种做法，Docker Compose 的 `environment:` / `env_file:`、Kubernetes 的 `env:` 都是这个思路。

于是问题就来了：**数据库密码、Redis 密码、API Key、JWT 密钥、SMTP 凭据**这些最敏感的值，恰恰经常以环境变量的形式存在：

```bash
# 一次典型部署（容器/服务启动脚本里）
export DB_HOST=x.x.x.x
export DB_USER=webuser
export DB_PASS=<密码>          # ← 这个值会被进程继承
export FLAG=flag{...}          # CTF 里也常把 flag 直接放进环境变量
python /app/server.py
```

启动之后，这些值就完整地躺在 `/proc/self/environ` 里，只要该进程可读、且我们能通过任意文件读取触及这个路径，密码就裸奔了。相比之下 `cat /app/server.py` 只能看到源码，看不到运行时的注入配置。

> CTF 中这条路径往往比读源码更值钱：**flag 有时根本不在文件里，而是直接放在进程的环境变量里**。

## 利用条件

`/proc` 和 `/sys` 本身对所有人可读，能不能用只取决于**漏洞给了你多大的文件访问能力**：

1. **任意文件读取 / 本地文件包含（LFI）**：最典型的入口。`?file=/proc/self/environ`、`?file=/proc/self/cmdline`。LFI 场景下还可能配合日志投毒、`php://` 包装器使用，见 `05-文件包含\` 与 `06-文件读取\php伪协议读文件.md`。
2. **命令执行（RCE）**：直接 `cat` 即可，这是最舒服的情况，此时 `/proc` 主要价值在于**跨进程查看**（`/proc/<PID>/environ` 看别的服务）和**读取已删除文件**（`/proc/<PID>/fd/N`）。
3. **限制了读取目录时**：`/proc/self/cwd/` 是一个**不带原目录前缀的路径**，可用来绕过「只能读某个目录」的白名单（配合 `../` 归一化，或直接写绝对路径）。
4. **前提是 Linux 环境**：`/proc`、`/sys` 是 Linux 特有的虚拟文件系统，Windows 上没有。

## Payload 速查

| 目的 | Payload（以 `?file=` 为例） |
|---|---|
| 读进程环境变量（找密码 / flag） | `?file=/proc/self/environ` |
| 读进程启动命令（找配置文件路径） | `?file=/proc/self/cmdline` |
| 读进程状态（确认是哪个进程在读） | `?file=/proc/self/status` |
| 定位进程工作目录，再读应用源码 | `?file=/proc/self/cwd/app.py` |
| 读已打开（甚至已删除）的文件 | `?file=/proc/self/fd/3`（编号从 3 起逐个试） |
| 枚举网卡 / 磁盘（信息收集） | `?file=/sys/class/net/`、`?file=/sys/block/` |
| 查看其他进程 | `?file=/proc/<PID>/environ`（PID 需先枚举 `/proc/self/status` 或试） |

## 完整示例：同样一个 `app.py`，三种写法读到的可能不是同一份

以下命令在目标机的 shell 里执行（手工验证阶段）：

```bash
# 1) 列当前终端所在目录的文件
ls -la

# 2) 读当前终端所在目录的 app.py —— 终端不在进程目录时会找不到或读错
cat app.py

# 3) 读“进程”当前工作目录下的 app.py —— 定位到实际运行中的应用文件
cat /proc/self/cwd/app.py

# 列出进程工作目录下所有文件（cwd 是目录符号链接，ls 会跟随它）
ls /proc/self/cwd

# 进程的环境变量（空字符分隔，用 tr 换成换行才好读）
cat /proc/self/environ | tr '\0' '\n'

# 进程的启动命令
cat /proc/self/cmdline | tr '\0' '\n'
```

如果是容器化环境，想进到题目容器内部去看，先找容器 ID 再 `exec` 进去：

```bash
# 在服务器终端执行
# 1. 找到 CTF 容器的 ID
docker ps

# 2. 连接到容器内部
docker exec -it <容器ID> /bin/bash

# 3. 现在你就在 CTF 环境内部了，可以直接执行命令
cat /proc/self/cmdline
```

## 踩坑与备注

- **`self` 认的是「谁在读」**：在手工 shell 里 `/proc/self` 指你敲的命令；在文件读取漏洞里，指**后端服务进程**（PHP-FPM / python 等）。想确认自己读到的是谁的 `environ`，顺手读一下 `/proc/self/status`（能看到 `Name:` / `Pid:` / `PPid:`）或 `/proc/self/cmdline` 就对上了。
- **`environ` 要处理空字符**：`\0` 分隔，直接 `cat` 会挤成一坨；用 `tr '\0' '\n'` 展开。在 Web 漏洞里读到的原始响应可能也是 `\0` 分隔的长串。
- **`cmdline` 会暴露配置路径**：`/proc/self/cmdline` 常直接写着 `-c /path/to/config.py` 或 `--config=xxx`，顺着路径就能去读配置文件 —— 这是从「读进程」过渡到「读配置」的常见跳板。
- **`fd` 编号不固定**：`/proc/self/fd/` 里 `0/1/2` 是标准输入输出错误，目标文件一般从 `3` 往后；编号取决于进程此前打开过什么，实战要从 `3` 起逐个试。
- **容器里的 `/proc` 是容器视角**：`docker exec` 进去看到的 `/proc` 是**容器自己的**，`self` 指向你进入的这个 shell，不是宿主机或容器主进程 —— 想看主进程要按 PID 去 `/proc/<PID>/` 找。
- **原笔记里的疑问：「这个就直接给服务器原封不动地执行吗？」** —— 不是在你本机执行。`docker exec -it <容器ID> /bin/bash` 是在**服务器（宿主机）上**执行，进入的是**题目容器内部**；所以进去以后 `cat /proc/self/cmdline` 看到的是那个容器的进程信息。前提是你能登录宿主机并且有 `docker` 权限。
- **`/sys` 偏信息收集**：`/sys/class/net/`、`/sys/block/` 主要是枚举网卡和磁盘（判断是否有额外网段、挂载了什么盘），直接读敏感文件的价值不如 `/proc`。
- **原笔记在末尾标注了「原型链污染」但未展开**，与本篇无关，待后续补。
