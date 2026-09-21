---
title: IOC输出
category: 蜜罐/规范
tags: [IOC, 归一化, JSON, CSV]
order: 4
source: 10-日志字段与 IOC 输出规范.md
---

## 一句话概括

IOC 从事件日志中提取后单独归一化输出，不留在事件里当摘要。每条 IOC 记录类型、原始值与归一化值、首末次出现时间、出现次数、关联 Profile 和关联事件、置信度、风险等级、标签和证据片段。输出格式支持 JSON 单对象和 CSV 平铺两种。

## IOC 输出规范

IOC 应从事件日志中提取后单独归一化输出。

### IOC JSON 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ioc.id | string | 是 | IOC 唯一 ID |
| ioc.type | string | 是 | ip/domain/url/hash/user_agent/command/file_name/base64/callback_hint |
| ioc.value | string | 是 | 原始值 |
| ioc.normalized_value | string | 否 | 归一化值 |
| ioc.first_seen | string | 是 | 首次出现时间 |
| ioc.last_seen | string | 是 | 最近出现时间 |
| ioc.count | int | 是 | 出现次数 |
| ioc.profile_ids | list[string] | 是 | 关联 Profile |
| ioc.source_event_ids | list[string] | 是 | 关联事件 |
| ioc.confidence | string | 是 | low/medium/high |
| ioc.risk_level | string | 是 | low/medium/high/critical |
| ioc.tags | list[string] | 否 | 标签 |
| ioc.evidence | list[object] | 否 | 证据片段 |

### IOC 类型

| 类型 | 说明 |
| --- | --- |
| ip | IP 地址 |
| domain | 域名 |
| url | URL |
| hash | 文件或 Body Hash |
| user_agent | User-Agent |
| command | 命令片段 |
| file_name | 文件名 |
| base64 | Base64 候选 |
| callback_hint | 回连线索 |

### IOC JSON 示例

```json
{
  "ioc": {
    "id": "ioc-url-000001",
    "type": "url",
    "value": "http://example.invalid/payload",
    "normalized_value": "http://example.invalid/payload",
    "first_seen": "2026-08-16T10:00:00+08:00",
    "last_seen": "2026-08-16T10:05:00+08:00",
    "count": 3,
    "profile_ids": ["nextjs-rsc-rce-sim"],
    "source_event_ids": ["evt-20260816-000001"],
    "confidence": "medium",
    "risk_level": "high",
    "tags": ["external_url", "suspected_payload"],
    "evidence": [
      {
        "event_id": "evt-20260816-000001",
        "field": "body.preview",
        "context": "benign test body with external-url-placeholder"
      }
    ]
  }
}
```

### IOC CSV 字段

建议 CSV 字段：

```text
ioc_id,type,value,normalized_value,first_seen,last_seen,count,profile_ids,confidence,risk_level,tags
```

## 相关笔记

- [日志字段](日志字段.md)
- [风险评分](风险评分.md)
- [Profile字段](Profile字段.md)
