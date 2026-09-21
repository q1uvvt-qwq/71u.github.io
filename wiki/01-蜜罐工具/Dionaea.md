---
title: Dionaea
category: 蜜罐/工具
tags: [多协议, 恶意样本捕获, 低交互]
order: 3
source: 02-主流蜜罐工具对比.md
---

## 一句话概括
Dionaea 是多协议蜜罐，用于捕获恶意软件样本和记录网络攻击。

## 定位
Dionaea 支持多个常见网络协议，更偏向捕获恶意输入和样本：相比 OpenCanary 更适合放在研究型环境中观察攻击者投递内容，相比 Cowrie 不局限于 SSH/Telnet。

适合场景：

- 多协议攻击捕获
- 恶意样本下载和存储
- 自动化攻击采集
- 传统蠕虫、僵尸网络、扫描器行为观察

资料：

- GitHub：<https://github.com/DinoTools/dionaea>
- 文档：<https://dionaea.readthedocs.io/>

## 能力清单
- 多协议支持，协议面比 Cowrie 宽
- 样本捕获和 Payload 采集是强项
- 历史较久，常出现在集成式蜜罐平台中，适合作为 T-Pot 体系中的一个组件理解

## 局限
- 部署和维护复杂度高于 OpenCanary
- 样本处理需要更严格的安全流程
- 如果没有恶意样本分析能力，产出不如 OpenCanary、Cowrie 直观

## 相关笔记
- [T-Pot](./T-Pot.md)
- [Cowrie](./Cowrie.md)
- [模板生态](./模板生态.md)
