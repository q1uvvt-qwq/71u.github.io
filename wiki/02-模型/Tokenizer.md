---
title: Tokenizer
category: 日志检测/模型
tags: [分词, 子词, 词表, 特殊token, OOV]
order: 4
---

## 一句话概括

Tokenizer 是模型的第一层表示，把一条原始日志消息压成定长的 token id 序列。日志分词主要有两条路线：词级词表和子词词表。两套的 token id 空间不重叠，也不能互相喂。

## 两条分词路线

定义：分词就是把文本切成模型词表里的最小单位，再查表换成整数 id。切得粗，一个 token 带的信息多但表大；切得细，表小但序列长。

词级路线。按正则切分，词表就是一个穷举的字符串清单。一条够用的正则：

```text
[a-z0-9_]+|[^\s]
```

连续的小写字母、数字、下划线算一个 token，其余每个非空白字符各自成一个 token。词表大小是固定的，加载时要硬校验长度，对不上应当直接抛错而不是静默截断。

子词路线。用 SentencePiece 之类工具在语料上训练 BPE，从字符出发反复合并最常相邻的两个符号。关键训练参数决定了它的行为：

```text
split_by_whitespace = false
no_whitespace_pretokenization = true
normalization_rule_name = identity
byte_fallback = true
character_coverage = 1.0
add_dummy_prefix = false
```

`byte_fallback` 是日志场景里最要紧的一项，它保证任何字节序列都有切法。`normalization_rule_name = identity` 表示 BPE 内部不做归一化，文本规范化要在更前面一步完成。

两者共享同一组 special token，ID 永久固定：

```text
[PAD]  = 0
[CLS]  = 1
[SEP]  = 2
[UNK]  = 3
[MASK] = 4
```

ID 固定是硬约束。模型权重、缓存键、Golden 都按这些数字对齐，改动等于换了整个输入契约。

## 一条消息怎么变成定长 id 序列

词级路线的 normalizer 四步：

- 反斜杠 `\` 转成正斜杠 `/`
- 去掉首尾空白
- 压缩连续空白为一个空格
- 全部小写

然后编码：

- 第一位 `[CLS]`
- 中间最多 `max_length - 2` 个正文 token，超出部分从右边截断
- 一位 `[SEP]`
- 右边补 `[PAD]` 到 `max_length`，同时把 mask 的对应位置置 0

`max_length` 取 64 时，正文预算就是 62。`padding_side` 和 `truncation_side` 都取 `right` 是现代 tokenizer 库的默认值，与上面这套手工流程一致。

子词路线的输入契约不一样：它不按空格预切分，normalizer 是 identity，靠 `byte_fallback` 兜底。所以词级那套四步规范化不能直接套到 BPE 上，规范化要在 tokenizer 之外单独做一层，且这一层的行为要跟着 tokenizer 版本一起冻结。

注意：两套的截断都在右侧。日志的尾部通常是命令行参数和路径，右截断丢掉的就是这些，而它们往往正是异常判据所在。

## 为什么日志里的变量要单独处理

词级切分在自然语言上够用，在日志上会立刻碰到开放集合。看正则切出来的结果：

- `127.0.0.1` 拆成 `127` `.` `0` `.` `0` `.` `1`，7 个 token
- `c:/windows/system32/cmd.exe` 拆成 `c` `/` `windows` `/` `system32` `/` `cmd` `.` `exe`，10 个 token

IP、路径这类变量会成倍吃掉 62 个 token 的预算，而它们在 EDR 日志里几乎每条都不一样。词级词表碰到这种值只有两条路：进 `[UNK]`，或者把词表撑爆。BPE 的解法是常见词整体进词表，罕见值拆成子词，再配合 `byte_fallback` 保证任何输入都有切法，不落 `[UNK]`。

OOV 指词表里没有的 token，`[UNK]` 是它在表里的替身。UNK 率是衡量词表质量的直接指标，数据侧把它当成剪枝的质量门槛，见 [词表与剪枝](../01-数据工程/词表与剪枝.md)。

词表大小还会落到参数量上。Message Encoder 的 embedding 表是 `词表 × d_model`，按 50,000 词表和 64 维算就是 3,200,000 个数，比 Transformer 那几层加起来还多一个量级。把 hidden 减半、层数减半，总参数几乎不动；词表大小才是压参数量的那根主杠杆。这也是为什么子词路线的 8,192 词表在参数量上天然占优。

## 交付与冻结

两套 route 落成文件的形态不同：

| 维度 | 子词 BPE | 词级 |
| --- | --- | --- |
| Tokenizer 产物 | 1 个模型文件 | 4–5 个 JSON（词表、配置、normalizer、special tokens） |
| 词表本体 | 随模型文件走 | 作为独立资产交付 |
| Normalizer 位置 | 内建于模型文件 | 独立一层，需单独冻结 |

词级路线的大词表要作为独立资产交付和冻结，因为它本身就是几 MB 的资产；子词表小得多，跟着模型文件走即可。

无论哪条路线，Validation、Test 和线上输入必须复用 Train 包里的同一份 normalizer、tokenizer 和 vocab，禁止重新拟合、重新排序或改动 token ID。换 tokenizer 或词表算接口变更，换模型权重不算。接口变更要走完整流程：新建契约 ID、重新生成输入 Golden、重跑 PyTorch 与量化后的等价验证、不覆盖旧版本产物。

原因在 id 的语义。同一个 id 在 50,000 表和 8,192 表里指向完全不同的 token。一旦混用，embedding 查表会静默取到错的行，不报错，只是分数全乱。所以两套模型各自持有自己的 tokenizer Golden 和 Point reference，reference 与 Message Encoder 绑定，不能跨模型复用。

## 相关笔记

- [ContraLog架构](ContraLog架构.md)
- [变体与蒸馏](变体与蒸馏.md)
- [语义表示](../01-数据工程/语义表示.md)
- [词表与剪枝](../01-数据工程/词表与剪枝.md)
