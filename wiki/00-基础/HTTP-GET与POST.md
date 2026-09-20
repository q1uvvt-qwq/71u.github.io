---
title: HTTP GET 与 POST
category: 基础/HTTP
tags: [HTTP, GET, POST, 请求体, Content-Type, 参数传递]
order: 2
---

## 一句话概括

**GET** 把参数挂在 URL 上、没有请求体；**POST** 把参数放在请求体里、靠 `Content-Length` 描述长度。做题时两者经常共用同一段后端代码，但发包位置完全不同，**「参数在哪」直接决定了你怎么改包**。

## 原理

### 1. GET 请求的完整格式

```http
GET /path?参数名1=值1&参数名2=值2 HTTP/1.1
Host: 域名或IP
Header1: 值1
Header2: 值2
[空行]
```

- 参数以 `?` 起始，多个参数用 `&` 分隔，写在**请求行**里；
- 因为参数已经全在请求行，**GET 没有消息体**，所以不需要 `Content-Type` / `Content-Length`；
- 请求以「空行」结束，空行之后什么都没有。

### 2. POST 请求的完整格式

```http
POST /path HTTP/1.1
Host: 域名或IP
Content-Type: application/x-www-form-urlencoded
Content-Length: 数据长度
[其他头部...]
[空行]
参数名1=值1&参数名2=值2
```

- 请求行里**只有路径**，没有 `?参数`；
- `Content-Type` 告诉服务器「请求体该怎么解析」，表单提交用 `application/x-www-form-urlencoded`；传文件则是 `multipart/form-data`；
- `Content-Length` 是**请求体的字节数**，服务器靠它知道「体在哪里结束」；
- 空行之后才是参数。

> **为什么 POST 一定要 `Content-Length`？** 因为 TCP 是字节流，服务器读到一个空行时只知道「头结束了」，并不知道后面那块数据有多长。`Content-Length` 就是这块数据的长度声明。这个细节在实战里很关键：**改包改了请求体却没同步改 `Content-Length`，服务器可能只读旧长度，多出来的字节被丢掉或当成下一个请求。**

### 3. GET 与 POST 的对比

| 特性 | GET 请求 | POST 请求 |
| :--- | :--- | :--- |
| **参数位置** | URL 中 | 请求体中 |
| **参数格式** | `?name=value&name2=value2` | `name=value&name2=value2` |
| **有无请求体** | 无 | 有 |
| **数据长度** | 有限制（URL 长度限制） | 无限制 |
| **安全性** | 参数在 URL 中可见 | 参数在请求体中不可见 |
| **缓存** | 可缓存 | 不缓存 |

> **关于「安全性」这一行要澄清**：POST 的参数「不可见」仅仅是**不显示在地址栏**，在网络里依然是**明文**，抓一次包就全看到了。真正的安全要靠 HTTPS，而不是靠换成 POST。

## 利用条件

- **GET 参数**：只要能控制 URL，就能控制参数。适合 `?file=`、`?url=`、`?id=` 这类直接拼进后端的场景；也方便直接在浏览器地址栏试 payload。
- **POST 参数**：必须能改包（Burp / `curl -d` / `requests.post`）。传输大 payload、传文件、传 JSON 时更自然。
- **两者可同时存在**：PHP 里 `$_GET` 和 `$_POST` 是**两个独立数组**，同名参数互不覆盖。有些题会故意只过滤 `$_GET`，此时把参数改到 `POST` 里就能绕过。

## Payload 速查

### 简单 GET

```http
GET /index.php HTTP/1.1
Host: example.com
```

### 带参数的 GET

```http
GET /login.php?username=admin&password=123456 HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
```

### 带 Cookie 的 GET

```http
GET /target.php?username=test&password=test HTTP/1.1
Host: ctf.show
Cookie: user=O:11:"ctfShowUser":1:{s:5:"isVip";b:1;}
Content-Type: application/x-www-form-urlencoded
```

### 对应的 POST 请求

```http
POST /target.php HTTP/1.1
Host: ctf.show
Content-Type: application/x-www-form-urlencoded
Content-Length: 27
Cookie: user=O:11:"ctfShowUser":1:{s:5:"isVip";b:1;}

username=test&password=test
```

> 上面这一对 GET / POST 是同一道反序列化题（`Cookie` 里塞 `ctfShowUser` 对象、`isVip` 为 `true`）的两种发法，用来对比「同一份参数换个位置放」。

## 完整示例

用命令行的两种等价写法，方便脚本化：

```bash
# GET：参数拼在 URL 上
curl "http://靶机地址/login.php?username=admin&password=123456"

# POST：参数用 -d 放进请求体，curl 会自动补 Content-Type 和 Content-Length
curl -X POST "http://靶机地址/target.php" \
     -d "username=test&password=test"

# POST + 自定义 Cookie（对应上面的反序列化场景）
curl -X POST "http://靶机地址/target.php" \
     -H 'Cookie: user=O:11:"ctfShowUser":1:{s:5:"isVip";b:1;}' \
     -d "username=test&password=test"
```

## 踩坑与备注

- **GET 的长度限制来自浏览器 / 服务器，不是协议本身**。协议没有写死上限，是 IE、Nginx 的 `large_client_header_buffers` 之类的实现限制在实际卡你。
- **`Content-Length` 必须与实际体的字节数一致**，否则服务端按短读、按长等，都可能挂住连接或截断数据。
- **`$_REQUEST` 才是合并的**：PHP 的 `$_REQUEST` 默认同时收 GET、POST、Cookie，优先级由 `request_order` 决定；`$_GET` / `$_POST` 各自独立。
- **改包后别忘改 `Content-Length`**：这是新手改 POST 包最容易翻车的地方。
