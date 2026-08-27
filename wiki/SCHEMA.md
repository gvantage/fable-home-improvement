# Wiki Schema

## Domain
家装避坑知识库：选公司、合同、预算、水电、施工监工、半包全包、材料、各空间做法。面向业主问答，不覆盖商业施工报价系统。

## Conventions
- 文件名：小写英文/拼音 + 连字符，无空格（如 `shui-dian.md`）
- 每页必须有 YAML frontmatter
- 用 `[[wikilinks]]` 互链，每页至少 2 个出链
- 更新页面时改 `updated` 日期
- 新页必须写入 `index.md` 对应分类
- 每次操作追加 `log.md`
- 正文用中文，保持可扫读；超过约 200 行拆页
- `raw/` 只读，禁止修改

## Frontmatter
```yaml
---
title: 页面标题
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary
tags: [必须来自下方词表]
aliases: [检索别名]
sources: [raw/articles/来源文件.md]
---
```

## Tag Taxonomy
- 流程: 验房, 流程, 首次装修
- 商务: 选公司, 合同, 预算, 砍价, 增项
- 模式: 半包, 全包, 清包, 全屋定制
- 施工: 水电, 防水, 瓦工, 木工, 油漆, 监工, 验收, 隐蔽工程
- 空间: 厨房, 客厅, 阳台, 卫生间, 玄关, 收纳
- 材料: 材料, 门窗, 开关插座, 板材, 瓷砖
- 元: 对比, 清单

规则：页面标签必须先出现在本词表。新标签先加到这里再使用。

## Page Thresholds
- **建页**：同一主题出现在 2 个以上来源，或某来源的核心主题
- **补页**：新来源提到已有主题，写入现有页并更新日期
- **不建页**：一次性提及、域外内容
- **拆页**：超过约 200 行
- **归档**：内容被完全替代时移到 `_archive/`，并从 index 删除

## Update Policy
新信息与旧文冲突时：
1. 看日期，新来源通常覆盖旧来源
2. 真冲突则两说并存，标注日期和来源
3. frontmatter 加 `contradictions: [page-name]`
4. lint 时提给用户
