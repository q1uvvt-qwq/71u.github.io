---
title: T-Pot
category: 蜜罐/工具
tags: [集成平台, 可视化, 集中日志, 开源]
order: 4
source: 02-主流蜜罐工具对比.md、04-竞品调研报告.md
---

## 一句话概括
T-Pot 是 Deutsche Telekom Security 开源的集成式蜜罐平台，把多个蜜罐、日志处理、可视化和管理组件整合在一起。

## 定位
T-Pot 是 All-in-One 多蜜罐平台，集成多个蜜罐、Elastic Stack、Attack Map、CyberChef、Suricata 等工具。它的优势不是单个协议模拟，而是集成：通常包含多个蜜罐组件、日志采集组件和可视化界面，可以较快形成平台效果。

适合场景：

- 多蜜罐集中部署
- 公网攻击态势观测
- 安全演示和汇报
- 多协议采集和可视化分析
- 蜜罐平台化运营验证

资料：

- GitHub：<https://github.com/telekom-security/tpotce>
- T-Pot 24.04 发布说明：<https://github.security.telekom.com/2024/04/honeypot-tpot-24.04-released.html>

## 能力清单
- 集成 20+ 蜜罐，覆盖多类蜜罐
- Elastic Stack 存储和展示事件
- Attack Map 可视化，适合汇报展示
- 集成 CyberChef、SpiderFoot 等分析辅助工具
- 通过 Docker Compose 管理不同蜜罐组合
- 支持日志持久化和集中化
- 能快速理解蜜罐平台的整体形态

## 局限
- 资源消耗高于单点工具，部署复杂度更高
- 需要独立环境，不适合随意部署在办公机或生产网
- 组件较多，排障成本高
- 容器化但整体暴露面大
- 不是漏洞专项生成框架，高仿真 Web 指纹、HTTP 流量采集都依赖其中具体组件
- 不适合作为第一次理解蜜罐原理的唯一入口

## 相关笔记
- [OpenCanary](./OpenCanary.md)
- [Cowrie](./Cowrie.md)
- [Dionaea](./Dionaea.md)
