---
title: Web蜜罐
category: 蜜罐/工具
tags: [Web蜜罐, HTTP仿真, 单CVE, Sensor]
order: 6
source: 04-竞品调研报告.md、06-竞品适用场景与优劣对比矩阵.md
---

## 一句话概括
Web 蜜罐这一类项目把诱捕面放在 HTTP 上：Sensor 吸引并接收 Web 攻击流量，Analyzer 分类请求并组合响应，专项项目则针对单个 CVE 把 Payload 留在本地。

## 定位
这是与漏洞专项蜜罐最接近的一组开源项目。它们的架构分开成两块：轻量传感器负责生成攻击面、吸引 Web 恶意流量，中央分析服务负责评估、分类和响应编排。单 CVE 项目走的是另一条路，不为通用仿真，只为在漏洞热度期把一个漏洞的攻击流量收下来。

## 能力清单

### SNARE / TANNER
- SNARE 是 Web 应用蜜罐 Sensor，负责生成攻击面和吸引 Web 恶意流量
- SNARE 支持 clone 一个页面作为 Web 表面
- TANNER 是远程数据分析与分类服务，负责评估 HTTP 请求、分类并组合响应
- TANNER 支持多种应用漏洞类型仿真
- 架构上区分 Sensor 和 Master/分析器
- 判断：高仿真 Web 指纹明确支持页面表面生成和克隆思路，HTTP 流量采集明确支持 Web 请求进入分析服务，Payload/IOC 间接支持，检测规则输出未发现支持
- 资料：SNARE <https://github.com/mushorg/snare>，TANNER <https://github.com/mushorg/tanner>

### Log4Pot
- 针对 Log4Shell / CVE-2021-44228 的单漏洞专项蜜罐
- 在多个端口监听 Log4Shell 利用尝试，在请求行和 Header 中检测利用特征
- 递归下载利用 Payload
- 日志可写入文件和 Azure Blob Storage
- 提供日志分析脚本，可提取 Payload、解码 Base64、构建时间线
- 判断：HTTP 流量采集和 Payload 提取解码是明确的，CVE Profile 生成未发现通用支持，单 CVE 固定实现
- 资料：<https://github.com/thomaspatzke/Log4Pot>

### ToolShell-Honeypot
- 面向 Microsoft SharePoint ToolShell 相关 CVE 的专项蜜罐，定位是早期检测和威胁情报，不是完整 SharePoint 仿真
- Docker 化部署，Sensor + Analyzer + Dashboard 三服务架构
- 记录所有 HTTP 请求，做 IIS Header 仿真
- 捕获 POST Body，并以 SHA256 命名存储
- 对 Payload 做 YARA 检测、标签化、解压/解码分析
- 提供实时 Dashboard、过滤和导出
- 明确说明不模拟完整认证、Session、动态内容和后渗透交互
- 判断：Body Hash、异步分析、IOC/Pattern/Heuristic 标签化贴近漏洞专项蜜罐的目标；安全隔离上明确考虑不执行后渗透交互
- 资料：<https://github.com/bitsalv/ToolShell-Honeypot>

### Beelzebub
- 较新的开源 deception runtime，强调 LLM-powered decoy services
- 支持 SSH、HTTP、TCP、TELNET、MCP 等协议
- 多协议 decoy services，LLM 驱动的动态响应
- YAML/低代码配置，Docker 部署，与监控/日志平台集成
- 面向 AI agent、prompt injection 等新场景
- 资料：<https://github.com/beelzebub-labs/beelzebub>，文档仓库 <https://github.com/beelzebub-labs/beelzebub-docs>，Elastic Integration <https://www.elastic.co/docs/reference/integrations/beelzebub>

## 局限
- SNARE/TANNER 项目方向较旧，没有直接提供面向新 CVE 的 Profile 生成和情报输出规范
- SNARE/TANNER 缺少新 CVE Profile 生成和现代 IOC 管道，需要二次设计安全隔离
- Log4Pot 不是通用框架，难以直接应对 Next.js、Confluence、SharePoint 等不同漏洞，单漏洞硬编码使复用变弱
- ToolShell-Honeypot 仍是单漏洞/单产品实现，不是通用 Profile 框架
- ToolShell-Honeypot 自己也承认不是完整高仿真环境，攻击者可能在初始响应后识别蜜罐
- Beelzebub 第一版不建议依赖 LLM 生成关键安全响应，LLM 响应不稳定，可能引入提示注入、越权输出或仿真不可控，同时需要评估 LLM 交互风险

## 素材中的不确定处
- Glastopf 在 04、06 两份源文件中都没有出现，本笔记未收录。
- Datadog HASH 在 06 里被列在 Web 蜜罐与 HTTP 仿真项目一组，本笔记按分工放在 [模板生态](./模板生态.md) 里讲。

## 相关笔记
- [模板生态](./模板生态.md)
- [Cowrie](./Cowrie.md)
- [T-Pot](./T-Pot.md)
