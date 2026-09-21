---
title: Log4Shell
category: 蜜罐/案例
tags: [Log4Shell, JNDI, 单 CVE 专项蜜罐, Log4Pot]
order: 2
source: 03-漏洞专项蜜罐案例分析与最佳方案.md
---

## 一句话概括

Log4Shell 专项蜜罐不需要运行真实脆弱 Log4j，重点是模拟常见 Java Web 服务入口和 Header 接收面，完整记录包含 JNDI 特征的字符串。采集侧关注被注入字段位置、JNDI 协议类型和回连地址，用于还原扫描与利用行为。

## 漏洞背景

Log4Shell，即 CVE-2021-44228，是 Apache Log4j 2 中的高危远程代码执行漏洞。攻击者通过向会被 Log4j 记录的字段注入特定 JNDI 字符串，诱导服务发起 LDAP/RMI/DNS 等外部解析或加载行为。

## 要模拟什么

Log4Shell 蜜罐不需要运行真实脆弱 Log4j。它应重点模拟：

- 常见 Java Web 服务入口
- 常见 Header 接收面，例如 User-Agent、X-Forwarded-For、Referer 等
- 常见请求参数和请求体
- 能完整记录包含 JNDI 特征的字符串
- 可选的 DNS/LDAP 回连观测，但必须严格控制出网和回连行为

## 要采集什么

- 请求来源 IP
- 被注入字段位置
- JNDI 协议类型
- 回连域名/IP/URL
- User-Agent
- 扫描器特征
- 是否存在二阶段下载地址
- 重复扫描频率

## 可借鉴项目

Log4Pot 是一个面向 Log4Shell 的专项蜜罐项目，说明了单 CVE 蜜罐的基本模式：监听 HTTP 请求，记录疑似 Log4j 利用载荷，并为后续分析保留上下文。

注意：可以借鉴它"针对单漏洞快速捕获"的思路，但不建议只做 Log4Shell，因为目标是形成可扩展框架。

## 相关笔记

- [建模流程](建模流程.md)
- [Confluence](Confluence.md)
- [Next.js](Next.js.md)
