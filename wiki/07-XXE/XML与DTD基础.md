---
title: XML 与 DTD 基础
category: XXE/基础
tags: [XML, DTD, 良构, DOMDocument, SimpleXML, 实体引用]
source: 课程笔记 2025-10-15
date: 2025-10-15
order: 1
---

## 一句话概括

XML 是**把数据结构化之后传输给对方读取**的标记语言；DTD 是写在 XML 里（或外部文件里）的一套「这个文档允许有哪些标签、标签里能放什么、能定义哪些实体」的声明规则。**XXE 的全部能力都来自 DTD 里的 `<!ENTITY>`**，所以想打通 XXE，先把这两样看懂。

## 原理

### 1. XML 和 HTML 是「兄弟」，但用途完全不同

两者同属**标记语言（Markup Language）**，都用 `<标签>内容</标签>` 的语法，但设计目标相反：

| 特性 | HTML | XML |
|:---:|---|---|
| **目的** | 网页展示、开发 | 数据存储和传输、数据读取 |
| **标签** | 预定义标签（`h1`、`p`、`div`） | 自定义标签 |
| **严格性** | 容错性强（标签未闭合也能解析） | 语法严格（必须良构） |
| **大小写** | 不敏感 | 敏感 |
| **应用场景** | 浏览器渲染网页 | 配置文件、API 数据交换 |
| **标签功能** | 有功能区分（`<h1>` 与 `<h2>` 渲染效果不同），标签有固定功能 | 标签无功能性，且标签可以随意定义 |
| **闭合** | 标签可以不闭合 | 标签必须闭合，嵌套顺序一定，且对大小写敏感 |
| **根元素** | 无强制要求 | 必须有根元素作为其他元素的父类 |
| **缩进** | 无要求 | 没有缩进要求，建议首行缩进 |

> 一句话记忆：HTML 是「给人看的」，标签长得丑浏览器也认；XML 是「给程序读的」，少一个闭合括号整个文档直接报废。

### 2. 为什么要有「实体」

因为 `<`、`>`、`&` 这些符号在 XML 里是**语法符号**，直接在内容里写会被解析器当成标签/引用处理（报 error）。所以要用时得写成「实体」（转义序列）：

| 实体引用 | 表示字符 | 说明 |
|:---:|:---:|---|
| `&lt;` | `<` | 小于号 |
| `&gt;` | `>` | 大于号 |
| `&amp;` | `&` | 和号 |
| `&apos;` | `'` | 单引号 |
| `&quot;` | `"` | 双引号 |

**要点：** 「实体」这个概念本来就是为了**转义**而生的 —— 「使用实体可以去掉符号的含义功能」。但 DTD 允许你**自己定义实体**，并且允许实体的值来自一个 URI（这就是 `<!ENTITY xxe SYSTEM "file:///...">`），于是「转义机制」被改造成了「文件读取机制」。XXE 的本质就是这一点。

### 3. XML 文档长什么样

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
    <body>
        <name>QIU</name>
        <age>1200</age>
    </body>
    <body>
        <name>Q1U</name>
        <age>1100</age>
    </body>
</root>
```

第一行 `<?xml version="1.0" encoding="utf-8"?>` 是 **XML 声明**（可选，但建议写，指定版本和编码），之后是唯一的根元素 `<root>`。

### 4. PHP 读取 XML 的两种常见方式

**方式一：SimpleXML** —— 把整棵文档树变成一个对象，用属性链取值。

```php
<?php
$xml = simplexml_load_file("ss.xml"); // 原笔记写的是 filename:"ss.xml"，是命名参数写法
print_r($xml);
```

输出（`print_r` 的结构就是下面这个对象树）：

```text
SimpleXMLElement Object ( [body] => Array ( [0] => SimpleXMLElement Object ( [name] => QIU [age] => 1200 ) [1] => SimpleXMLElement Object ( [name] => Q1U [age] => 1100 ) ) )
```

结构解读：

- 最外层是 `SimpleXMLElement Object`
- 往下到 `body`（作为成员属性存在，是一个**数组**）
- 数组内部有两个成员 `[0]` 和 `[1]`
- 每个成员内部又有两个成员属性（`name`、`age`）

取内部成员：

```php
<?php
$xml = simplexml_load_file("ss.xml");
echo $xml->body[0]->name;
```

**方式二：DOMDocument** —— 更像浏览器的 DOM 模型，可以遍历节点。

```php
<?php
$xml = file_get_contents("ss.xml"); // file_get_contents() 把文件内容读成字符串

$doc = new DOMDocument();           // 将 DOMDocument 实例化
$doc->loadXML($xml);                // 将字符串加载成 XML 文档
print_r($doc->saveXML());           // 再把整份文档序列化输出
```

也可以直接加载文件：

```php
<?php
$doc = new DOMDocument();
$doc->load("ss.xml");
print_r($doc->saveXML());
?>
```

输出内容就是文档里的文本节点：

```text
QIU 1200 Q1U 1100
```

> 通过查看源代码可以看到 XML 文件的完整内容（`saveXML()` 会把标签一起输出）。

按标签名取节点：

```php
<?php
$doc = new DOMDocument();
$doc->load("ss.xml");
// print_r($doc->saveXML());
echo $doc->getElementsByTagName('name')->item(0)->nodeValue;
```

- `getElementsByTagName('name')` —— 读取 XML 中所有名字为 `name` 的节点
- `item(0)` —— 指向第 0 个（也就是第一个）
- `nodeValue` —— 获取该节点的值

### 5. DTD 声明：给 XML 定规矩

**DTD（Document Type Definition，文档类型定义）** 就是这套规矩。写在 `<!DOCTYPE ...>` 里面。

**内部 DTD 声明** —— 直接写在 XML 文件里：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE root [
    <!ELEMENT root (man)>
    <!ELEMENT man (name,age,high)>
    <!ELEMENT name (#PCDATA)>
    <!ELEMENT age (#PCDATA)>
    <!ELEMENT high (#PCDATA)>
]>
<root>
    <man>
        <name>QIU</name>
        <age>18</age>
        <high>180cm</high>
        <waistline>50cm</waistline>
    </man>
    <man>
        <name>Q1U</name>
        <age>16</age>
        <high>180cm</high>
    </man>
</root>
```

逐条解释：

- `<!DOCTYPE root [ ... ]>` —— 定义约束，`root` 是根元素名，`[ ... ]` 内是内部子集
- `<!ELEMENT root (man)>` —— 即 **root 下面只能有 `man` 一个子节点**
- `<!ELEMENT man (name,age,high)>` —— **man 下面只能有 `name,age,high`**
- `<!ELEMENT name (#PCDATA)>` —— `#PCDATA` 设定 `name` 下面**只能是字符串**（可解析的字符数据，不能包含子元素，但可以包含实体引用）
- **`<!ELEMENT>` 是非强约束**，即使文档里写了没声明的标签（比如上面的 `<waistline>`），**也不会影响页面显示**

> 关键点：加了 DTD 之后，**能否定义标签就受约束了**；不加 DTD 时，XML 文件内可以添加无限定义的标签（上面例子里的 `<waistline>` 就是没声明的多余标签）。

DTD 里的四类声明：

| DTD 声明 | 用途说明 |
|:---:|---|
| `<!ELEMENT>` | 定义元素 |
| `<!ATTLIST>` | 定义元素的属性 |
| `<!NOTATION>` | 定义不被解释为元素或属性的符号 |
| `<!ENTITY>` | **定义实体，这些实体可以在 XML 文档中被引用** ← XXE 的入口 |

### 6. 外部引入 DTD

DTD 可以不写在 XML 里，而是单独放一个文件，用 `SYSTEM` 指向它：

`1.dtd`：

```xml
<!ELEMENT root (man)>
<!ELEMENT man (name,age,high)>
<!ELEMENT name (#PCDATA)>
<!ELEMENT age (#PCDATA)>
<!ELEMENT high (#PCDATA)>
```

`x.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE root SYSTEM "1.dtd">
<root>
    <man>
        <name>QIU</name>
        <age>18</age>
        <high>180cm</high>
        <waistline>50cm</waistline>
    </man>
    <man>
        <name>Q1U</name>
        <age>16</age>
        <high>180cm</high>
    </man>
</root>
```

**这就是 XXE 里「远程加载恶意 DTD」的原型**：`SYSTEM "1.dtd"` 换成 `SYSTEM "http://攻击者服务器/1.dtd"`，攻击者就能把实体声明放到自己服务器上，规避本地过滤。

> 此处原为「内部 DTD 声明」的截图，内容已还原为上面的代码块。

## 利用条件

这一篇是基础篇，谈「什么时候会被 XXE 打到」其实就是问：**哪些功能入口会把用户输入送进 XML 解析器？**

1. **接口按 XML 收报文**：`Content-Type: application/xml`、`text/xml`，后端用 `DOMDocument::loadXML`、`simplexml_load_string` 等解析
2. **能控制完整的 XML 文档**：至少要能控制 `<!DOCTYPE>`（很多框架只放行特定标签，那就打不了）
3. **解析器允许外部实体**：PHP < 8.0 默认允许，配合 `libxml_disable_entity_loader(false)`；PHP 8.0+ 默认禁止外部实体加载
4. **有回显或可外带**：解析结果的节点会被 `echo` 出来，或者可以用参数实体把数据外带到攻击者服务器

## Payload 速查

| 目的 | 写法 |
|---|---|
| XML 声明 | `<?xml version="1.0" encoding="utf-8"?>` |
| 根元素（必须有且唯一） | `<root> ... </root>` |
| 转义 `<` | `&lt;` |
| 转义 `>` | `&gt;` |
| 转义 `&` | `&amp;` |
| 内部 DTD 声明 | `<!DOCTYPE root [ ... ]>` |
| 外部 DTD 引用 | `<!DOCTYPE root SYSTEM "1.dtd">` |
| 声明一个元素 | `<!ELEMENT name (#PCDATA)>` |
| 元素只能包含文本 | `(#PCDATA)` |

## 完整示例

一个最小的、能跑通的 XML + DTD + PHP 组合：

`ss.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE root [
    <!ELEMENT root (body)>
    <!ELEMENT body (name,age)>
    <!ELEMENT name (#PCDATA)>
    <!ELEMENT age (#PCDATA)>
]>
<root>
    <body>
        <name>QIU</name>
        <age>1200</age>
    </body>
</root>
```

`index.php`：

```php
<?php
// 方式一：SimpleXML，直接取属性
$xml = simplexml_load_file("ss.xml");
echo $xml->body->name . "\n";   // 输出 QIU

// 方式二：DOMDocument，按标签名查
$doc = new DOMDocument();
$doc->load("ss.xml");
echo $doc->getElementsByTagName('age')->item(0)->nodeValue . "\n";  // 输出 1200
```

## 踩坑与备注

- **`<!ELEMENT>` 是非强约束**：文档里出现 DTD 没声明的标签（例中的 `<waistline>`）不会报错，也不影响页面显示。所以不要用它来做「输入过滤」的幻想。
- **命名参数写法要小心版本**：原笔记里 `simplexml_load_file(filename:"ss.xml")` 带 `filename:` 前缀，是 PHP 8.0+ 才支持的命名参数语法；PHP 版本过低会无法识别，直接写 `simplexml_load_file("ss.xml")` 即可。
- **`#PCDATA` 的含义**：表示这个元素包含「可解析的字符数据」—— 可以包含文本内容，不能包含其他子元素，**但可以包含实体引用**（如 `&amp;`、`&lt;`）。这一点是后面 XXE 能把文件内容塞进节点里的前提。
- **DTD 里的标签不是 XXE 的必需项**：如果只是为了打 XXE，`<!ELEMENT>` 可以一个都不写，只保留 `<!ENTITY>` 就够了 —— 因为 `<!ELEMENT>` 不强制校验，而实体是「有定义就会被展开」。
