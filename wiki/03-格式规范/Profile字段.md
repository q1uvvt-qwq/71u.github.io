---
title: Profile字段
category: 蜜罐/规范
tags: [Profile 字段, 仿真配置, 匹配规则, YAML 结构]
order: 2
source: 09-CVE Profile 设计规范.md
---

## 一句话概括

CVE Profile 建议使用 YAML，顶层结构由固定的一组字段组成，具体字段再分基础元数据、漏洞信息、产品信息、来源证据、仿真配置、匹配规则几组。仿真配置声明监听端口、指纹路径和路由响应，匹配规则判断请求是否命中某个 Profile 或某类行为。每个字段都有明确的类型和枚举取值，Profile 只描述攻击面和流量特征，不写完整可执行的利用步骤。

## 文件命名与目录

建议目录：

```text
profiles/
  nextjs-rsc-rce-sim.yaml
  log4shell-sim.yaml
  confluence-rce-sim.yaml
  families/
    java-web-rce-base.yaml
    web-file-read-base.yaml
```

命名规则：

```text
{product-or-family}-{vuln-type}-sim.yaml
```

示例：

- `nextjs-rsc-rce-sim.yaml`
- `log4shell-sim.yaml`
- `confluence-rce-sim.yaml`
- `spring-web-rce-sim.yaml`

如果绑定明确 CVE，可加入 CVE 编号：

```text
cve-202x-xxxxx-{product}-sim.yaml
```

## 顶层结构

建议 Profile 使用 YAML。顶层结构如下：

```yaml
profile_version: "1.0"
id: nextjs-rsc-rce-sim
name: Next.js React RSC RCE Style Honeypot
status: draft
severity: critical
family: web-rce

metadata: {}
vulnerability: {}
product: {}
sources: []
simulation: {}
matching: {}
capture: {}
responses: {}
extractors: {}
classification: {}
safety: {}
outputs: {}
tests: []
changelog: []
```

## 字段规范

### 基础元数据

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| profile_version | string | 是 | Profile 规范版本 |
| id | string | 是 | Profile 唯一 ID |
| name | string | 是 | Profile 名称 |
| status | enum | 是 | draft/review/testing/active/deprecated/disabled/rejected |
| severity | enum | 是 | info/low/medium/high/critical |
| family | string | 是 | 漏洞家族，如 web-rce、file-read、command-injection |
| owner | string | 否 | 维护人或团队 |
| created_at | string | 否 | 创建时间 |
| updated_at | string | 否 | 更新时间 |

示例：

```yaml
profile_version: "1.0"
id: nextjs-rsc-rce-sim
name: Next.js React RSC RCE Style Honeypot
status: review
severity: critical
family: web-rce
owner: security-research
```

### 漏洞信息

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| vulnerability.cves | list[string] | 否 | CVE 编号，若无 CVE 可为空 |
| vulnerability.title | string | 是 | 漏洞标题 |
| vulnerability.summary | string | 是 | 简要说明 |
| vulnerability.impact | string | 否 | 影响描述 |
| vulnerability.vuln_type | string | 是 | RCE、file-read、auth-bypass 等 |
| vulnerability.attack_surface | list[string] | 是 | HTTP header、body、path、query 等 |
| vulnerability.preconditions | list[string] | 否 | 利用前置条件 |

注意：

- 不要在 Profile 中写完整可执行利用步骤。
- 可以描述攻击面和流量特征。
- 对高危 Payload 只记录检测/仿真所需特征，不写可直接复现的攻击链。

### 产品信息

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| product.name | string | 是 | 产品或框架名称 |
| product.vendor | string | 否 | 厂商 |
| product.category | string | 是 | web-framework、enterprise-app、java-web 等 |
| product.affected_versions | list[string] | 否 | 影响版本范围 |
| product.fingerprint_hint | list[string] | 否 | 指纹提示 |

示例：

```yaml
product:
  name: Next.js / React Server Components
  vendor: Vercel / Meta ecosystem
  category: web-framework
  fingerprint_hint:
    - "/_next/static/"
    - "Next.js style HTML"
```

### 来源证据

Profile 必须保留来源，方便后续审计。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| sources[].type | enum | 是 | official_advisory/nvd/nuclei/poc_analysis/vendor_blog/threat_report/rule/project |
| sources[].url | string | 是 | 来源链接 |
| sources[].authority | enum | 是 | high/medium/low |
| sources[].used_for | list[string] | 是 | 用于提取什么信息 |

示例：

```yaml
sources:
  - type: official_advisory
    url: "https://example.com/advisory"
    authority: high
    used_for:
      - affected_product
      - severity
  - type: nuclei
    url: "https://github.com/projectdiscovery/nuclei-templates/..."
    authority: medium
    used_for:
      - paths
      - matchers
```

## 仿真配置

### Listener

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| simulation.listener.protocol | enum | 是 | http/https |
| simulation.listener.ports | list[int] | 是 | 监听端口 |
| simulation.listener.tls | bool | 否 | 是否启用 TLS |

示例：

```yaml
simulation:
  listener:
    protocol: http
    ports: [8080]
    tls: false
```

### 指纹仿真

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| simulation.fingerprints.paths | list[string] | 是 | 产品常见路径 |
| simulation.fingerprints.headers | map | 否 | 响应 Header 指纹 |
| simulation.fingerprints.html_titles | list[string] | 否 | 页面标题 |
| simulation.fingerprints.static_assets | list[string] | 否 | 静态资源路径 |
| simulation.fingerprints.error_markers | list[string] | 否 | 错误页特征 |

示例：

```yaml
simulation:
  fingerprints:
    paths:
      - "/"
      - "/_next/static/"
      - "/_next/image"
    headers:
      x-powered-by: "Next.js"
    html_titles:
      - "Example App"
    static_assets:
      - "/_next/static/chunks/main.js"
```

### 路由规则

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| simulation.routes[].id | string | 是 | 路由 ID |
| simulation.routes[].match.method | string/list | 是 | 请求方法 |
| simulation.routes[].match.path | string | 是 | 路径 |
| simulation.routes[].match.type | enum | 是 | exact/prefix/regex/catch_all |
| simulation.routes[].capture_body | bool | 否 | 是否采集 Body |
| simulation.routes[].response_template | string | 是 | 响应模板 ID |

示例：

```yaml
simulation:
  routes:
    - id: home
      match:
        method: GET
        path: /
        type: exact
      capture_body: false
      response_template: nextjs_home

    - id: suspicious_post
      match:
        method: POST
        path: /*
        type: catch_all
      capture_body: true
      response_template: framework_error
```

## 匹配规则

匹配规则用于判断请求是否命中某个 Profile 或某类行为。

### 匹配对象

支持：

- method
- path
- query
- header
- cookie
- body_preview
- content_type
- user_agent

### 匹配类型

| 类型 | 说明 |
| --- | --- |
| exact | 精确匹配 |
| prefix | 前缀匹配 |
| contains | 包含 |
| regex | 正则 |
| exists | 字段存在 |
| size_gt | 大小超过 |
| any_of | 任意命中 |
| all_of | 全部命中 |

## 素材中的不确定处

- 顶层结构列出了 `metadata: {}`，但字段规范里没有对应的 metadata 字段定义，基础元数据（profile_version、id、name 等）实际写在顶层。复现时以字段规范为准。

## 相关笔记

- [Profile设计](Profile设计.md)
- [日志字段](日志字段.md)
- [IOC输出](IOC输出.md)
