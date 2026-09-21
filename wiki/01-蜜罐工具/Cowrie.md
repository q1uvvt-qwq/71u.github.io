---
title: Cowrie
category: 蜜罐/工具
tags: [SSH蜜罐, Telnet, 中交互, 弱口令爆破, 命令记录]
order: 1
source: 02-主流蜜罐工具对比.md、04-竞品调研报告.md
---

## 一句话概括
Cowrie 是模拟 SSH/Telnet 服务与受控类 Unix Shell 的中交互蜜罐，用来记录暴力破解、登录会话、Shell 命令、文件上传下载和攻击者交互行为。

## 定位
定义：Cowrie 会模拟 SSH/Telnet 服务和一个受控的类 Unix Shell 环境。攻击者登录后看到的不是系统真实 Shell，而是 Cowrie 模拟的文件系统和命令环境。

它是传统蜜罐领域非常常用的工具，适合观察互联网弱口令攻击和命令执行链。

适合场景：

- SSH/Telnet 弱口令爆破观测
- 攻击者登录后的命令记录
- 恶意脚本下载链捕获
- 常见僵尸网络和挖矿脚本行为观察
- 公网自动化攻击趋势研究

资料：

- GitHub：<https://github.com/cowrie/cowrie>
- 文档：<https://docs.cowrie.org/>

## 能力清单
- 采集用户名和密码尝试、登录成功或失败、会话持续时间
- 采集交互式命令、下载 URL、上传文件、文件 Hash、攻击者来源 IP
- 保存 wget、curl 下载的文件，支持 SFTP/SCP 上传
- 支持 JSON 等格式输出，便于接入日志平台
- 支持高交互代理和实验性 LLM 响应
- 会话日志、命令记录、文件下载记录是同类里较强的部分，日志格式成熟，社区使用广

## 局限
- 主要聚焦 SSH/Telnet，协议面没有 OpenCanary 广
- 不适合 HTTP/Web CVE 专项，不能当作 Web 漏洞专项蜜罐的直接替代
- 需要注意端口转发和权限隔离
- 放公网会持续收到大量爆破，需要做好资源限制

## 素材中的不确定处
- 交互程度标注不一致：02 写中交互，04 写中高交互。

## 相关笔记
- [OpenCanary](./OpenCanary.md)
- [T-Pot](./T-Pot.md)
- [蜜网工具](./蜜网工具.md)
