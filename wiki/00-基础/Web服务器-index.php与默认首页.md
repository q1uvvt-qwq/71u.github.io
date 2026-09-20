---
title: Web 默认首页：index.php 是什么
category: 基础/Web服务器
tags: [index.php, 默认首页, DirectoryIndex, 目录扫描, 源码泄露]
order: 6
---

## 一句话概括

`index.php` 就是**网站的默认首页文件**，像一本书的目录页。当你只请求一个目录（如 `http://www.example.com/`）时，服务器会按配置好的顺序自动把它补成 `http://www.example.com/index.php` 再返回。

## 原理

### 1. 类比理解

- 书店：你走进书店，首先看到的是前台和推荐书架（`index.php`）
- 书本：打开书首先看到的是目录页（`index.php`）
- 公司：走进公司首先看到的是前台接待（`index.php`）

### 2. 技术上的作用

当你在浏览器访问一个网站时：

```http
GET / HTTP/1.1
Host: www.example.com
```

服务器会自动寻找并显示：

```http
GET /index.php HTTP/1.1
Host: www.example.com
```

### 3. 这套「自动补全」是谁在做的：DirectoryIndex

请求 `GET / HTTP/1.1` 时，服务器（Apache / Nginx / IIS）看到目标是一个**目录**而不是文件，它会去查自己配置里的 **默认文档顺序**：

```apache
# Apache httpd.conf / .htaccess
DirectoryIndex index.html index.php index.htm default.html
```

```nginx
# Nginx 的等价写法
index index.html index.php;
```

规则是：**从左到右，找到第一个真实存在的文件就用它**。

| 顺序 | 文件 | 结果 |
| :--- | :--- | :--- |
| 1 | `index.html` | 存在 → 直接返回，**根本不会轮到 `index.php`** |
| 2 | `index.php` | 只有第 1 个不存在时才被选中 |

> **这一点在做题时非常关键**：如果站点同时有 `index.html` 和 `index.php`，而你直接访问目录只看到静态首页，**不代表 `index.php` 不存在**。必须**显式请求 `/index.php`** 才能确认。很多「目录下明明有 PHP 却看不到」的情况就是这么来的。

### 4. `index.php` 里通常含有什么

| 内容类型 | 典型代码 | 做题时的意义 |
| :--- | :--- | :--- |
| **路由分发** | `include $_GET['page'].'.php';` | **文件包含漏洞**的源头 |
| **参数接收与过滤** | `$id = $_GET['id'];` | 找**注入 / XSS / 命令执行**的入口 |
| **数据库连接** | `$conn = mysqli_connect('localhost','root','密码');` | 读源码时能直接拿到**数据库凭据** |
| **会话判断** | `if(!isset($_COOKIE['user'])) header('Location: login.php');` | 决定是否要**伪造 Cookie / JWT** |
| **配置引入** | `require 'config.php';` | 指引你去找 `config.php` 这个**更值钱的文件** |
| **纯静态 HTML** | 只有 `<html>...</html>` | 说明真正的逻辑在别的文件里，该扫目录了 |

## 利用条件

知道「默认首页」这件事，在实战里能直接用上的场景：

1. **目录扫描的起点**：`dirsearch` 默认会把 `index.php`、`index.html` 作为字典的一批，就是因为几乎所有目录都拿它当门面。
2. **源码泄露的判据**：`index.php` 往往只是「外壳」，真正的漏洞在它 `include` / `require` 进来的文件里；读不到 `index.php` 时可以顺着它引用的路径去找。
3. **绕过首页跳转**：如果 `/` 会 302 到登录页，直接请求 `/index.php` 或 `/index.php.bak` 有时能拿到不一样的东西。
4. **备份文件**：`index.php.bak`、`index.php~`、`index.php.swp`、`index.php.old` 是源码泄露的高频目标。

## Payload 速查

| 目的 | 请求 |
| :--- | :--- |
| 访问默认首页 | `http://靶机地址/` |
| 显式确认 PHP 首页 | `http://靶机地址/index.php` |
| 找源码备份 | `/index.php.bak`、`/index.php~`、`/index.php.swp`、`/index.php.old`、`/.index.php.swp` |
| 读首页源码（含包含漏洞时） | `?file=php://filter/convert.base64-encode/resource=index.php` |
| 扫同目录其它入口 | `dirsearch -u http://靶机地址/ -e php,txt,bak -i 200,301,302` |

## 完整示例

服务器上的实际目录布局，以及一次请求的走向：

```text
/var/www/html/
├── index.html        ← 存在！会被优先返回
├── index.php         ← 被 index.html 挡住了，必须显式请求
├── config.php        ← 数据库凭据
├── login.php
└── static/
    └── logo.png
```

- 请求 `GET / HTTP/1.1` → 服务器按 `DirectoryIndex index.html index.php` 匹配 → 返回 **`index.html`**
- 请求 `GET /index.php HTTP/1.1` → 直接命中文件，走 PHP 解析 → 返回 **`index.php` 的执行结果**

## 踩坑与备注

- **默认首页的优先级是「先配置顺序，后存在性」**，不是「PHP 优先」或「HTML 优先」。不同服务器、不同站点配置可以完全相反，唯一可靠的判断方法就是**两个都显式请求一遍**。
- **访问目录看到 403 而不是首页**：说明目录存在但**被禁止列目录且没有匹配到默认文档**，这时那个目录里可能藏着别的文件，值得用 dirsearch 扫。
- **`index.php` 不是必须叫这个名**：框架常见入口还有 `app.php`、`public/index.php`、`admin/index.php`，Laravel 的站点根目录甚至指向 `public/`。
- **原文只有「类比 + 自动补全」两层内容**，本文补齐了「谁在做这件事（DirectoryIndex）」「文件里有什么」「配置顺序为什么会导致看不到」这三层推导。
