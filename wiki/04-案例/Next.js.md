---
title: Next.js
category: 蜜罐/案例
tags: [Next.js, React Server Components, RSC, Server Action]
order: 4
source: 03-漏洞专项蜜罐案例分析与最佳方案.md
---

## 一句话概括

Next.js / React RSC RCE 专项蜜罐模拟 Next.js 应用的常见外观，包括 `/_next/static/` 静态资源路径、Next.js 风格 HTML 和 RSC / Server Action 请求入口。采集侧重点记录 POST Body 与序列化结构中的可疑字段，仿真目标是让扫描器相信这是一个可能受影响的应用。

## 漏洞背景

React Server Components / Next.js 相关 RCE 是 Web 框架供应链和运行时攻击面的典型案例。公开资料显示，React 官方和 Next.js 生态曾披露过 React Server Components 相关的未认证远程代码执行风险，安全厂商也观察到利用尝试和自动化扫描活动。

## 要模拟什么

专项蜜罐应模拟 Next.js / React 应用常见外观：

- `/_next/static/` 静态资源路径
- Next.js 风格 HTML
- RSC / Server Action 相关请求入口
- 相关 Header 和 Content-Type
- 框架错误响应或流式响应特征
- 常见 API 路由

## 要采集什么

- 请求路径
- Header，尤其是和 RSC、Server Action、Content-Type 相关字段
- POST Body
- 序列化结构中的可疑字段
- 命令关键字
- Base64 字符串
- URL、域名、IP
- User-Agent 和扫描器指纹

## 仿真重点

注意：Next.js / React RSC 类漏洞的仿真重点不是复现真实漏洞，而是让扫描器相信这是一个可能受影响的应用。

- 首页、静态资源、构建 ID、脚本路径要像真实 Next.js 应用。
- 可疑入口要完整记录请求体。
- 对利用请求返回框架风格错误，而不是简单拒绝。
- 不引入真实受影响版本，不调用真实 React Server Components 解析链。

## 相关笔记

- [建模流程](建模流程.md)
- [Log4Shell](Log4Shell.md)
- [Confluence](Confluence.md)
