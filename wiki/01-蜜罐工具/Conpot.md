---
title: Conpot
category: 蜜罐/工具
tags: [工控蜜罐, ICS, SCADA, 协议仿真]
order: 5
source: 04-竞品调研报告.md、05-现有方案差距分析.md、06-竞品适用场景与优劣对比矩阵.md
---

## 一句话概括
Conpot 是工控蜜罐，用工业协议和工业场景仿真来诱捕 ICS/SCADA 方向的攻击。

## 定位
定义：工控蜜罐仿真的是工业控制系统里的设备和协议，不是通用 Web 服务。它属于传统开源蜜罐这一组，但换了一个行业场景。

- 类型：ICS/工控蜜罐
- 最适用场景：工控/SCADA/ICS 协议诱捕
- 核心优点：工控协议与工业场景仿真
- 对比矩阵评分：精准 高、高仿真 中、流量侧 中、Payload/IOC 中
- 项目：<https://github.com/mushorg/conpot>

## 能力清单
- 工控协议与工业场景仿真
- 行业场景化仿真，这一点是它相对通用协议蜜罐的差异
- 协议专用模板
- 商业侧有对应方向可对照：FortiDeceptor 支持 Windows、Linux、SCADA、IoT 等 Decoy VM，并支持部署 Decoy VM 网络来诱捕和监控攻击者活动

## 局限
- 不适合 Web 漏洞专项，除非做工控 CVE
- 面向固定协议和服务，SSH、Telnet、FTP、数据库、SMB 这类固定协议更成熟
- 新曝框架、中间件、企业应用漏洞需要模拟路径、Header、响应和产品指纹，工控蜜罐不覆盖这条线
- 缺少 CVE 情报输入，没有从公告、PoC、Nuclei 模板生成蜜罐 Profile 的机制
- 高仿真 Web 表面不足，简单 Banner 或固定响应容易被扫描器识别

## 素材中的不确定处
- Conpot 在 02、04、05 里都没有独立段落，本笔记对它的描述只来自 06 的对比矩阵单行，其余内容是对工控蜜罐这一类的说明。

## 相关笔记
- [OpenCanary](./OpenCanary.md)
- [蜜网工具](./蜜网工具.md)
- [Web蜜罐](./Web蜜罐.md)
