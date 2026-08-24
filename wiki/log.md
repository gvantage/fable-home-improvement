# Wiki Log

> 只追加，不改旧记录。格式：`## [YYYY-MM-DD] action | subject`

## [2026-08-23] create | Wiki initialized
- Domain: 家装避坑知识库
- Structure: SCHEMA.md, index.md, log.md, raw/articles, concepts, comparisons

## [2026-08-23] ingest | data/*.md → compiled wiki
- Copied 26 source notes into `raw/articles/` (immutable)
- Created 14 concept pages and 2 comparison pages
- Replaced app retrieval path: Chroma/BM25 chunk RAG → index + full wiki pages
- Files created:
  - concepts/xuan-zhuangxiu-gongsi.md
  - concepts/zhuangxiu-hetong.md
  - concepts/yusuan-kanjia.md
  - concepts/shui-dian.md
  - concepts/zengxiang-louxiang.md
  - concepts/jiangong-yanshou.md
  - concepts/zhuangxiu-liucheng.md
  - concepts/banbao.md
  - concepts/quanwu-dingzhi.md
  - concepts/chufang.md
  - concepts/keting.md
  - concepts/yangtai-menchuang.md
  - concepts/cailiao-xuangou.md
  - concepts/yanfang.md
  - comparisons/banbao-vs-quanbao.md
  - comparisons/touying-vs-zhankai.md

## [2026-08-23] delete | unused RAG leftovers
- Removed `data/*.md` (duplicates of `wiki/raw/articles/`)
- Removed `data/chroma_db/`
- Removed `rag_engine.py`, `xx.txt`, `curl_output.txt`
- Dropped `OPENROUTER_EMBEDDING_MODEL` from `.env`

## [2026-08-24] ingest | /Users/glace/Downloads/xhouse → wiki
- Copied 5 source notes into `raw/articles/` (immutable; 31 raw articles)
  - `60步超全装修流程.md`
  - `瓷砖选购指南.md`
  - `全屋装修避坑与流程整理.md`
  - `衣柜黄金尺寸.md`
  - `装修干货汇总.md`
- Created `concepts/cizhuan.md`；SCHEMA 材料词表增加「瓷砖」
- Updated compiled pages: `zhuangxiu-liucheng`, `shui-dian`, `jiangong-yanshou`, `banbao`, `quanwu-dingzhi`, `cailiao-xuangou`, `chufang`, `zhuangxiu-hetong`, `zengxiang-louxiang`, `yusuan-kanjia`
- Kept 两说：承重墙横槽、吊顶龙骨间距、管内截面积；收房仍以「三书一证一表」为主，并记物业备案表
