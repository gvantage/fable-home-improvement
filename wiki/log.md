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

## [2026-08-25] ingest | 瓷砖选购、辨别、验收与避坑全指南
- Added `raw/articles/瓷砖选购辨别验收与避坑全指南.md`（immutable）
- Updated `concepts/cizhuan.md`：店测六步、空间选型、核心参数、损耗批次、全瓷上墙、维护、六类避坑
- Updated compiled pages: `jiangong-yanshou`, `cailiao-xuangou`, `zhuangxiu-liucheng`, `chufang`, `keting`, `zhuangxiu-hetong`
- Kept 两说：墙砖附录 H vs 全瓷上墙必须背胶；空鼓国标每间 ≤5%仅限边角 vs 旧文超 5% 重贴 / 单块不超过 15%；坡度 1%–3% vs 1%–5%；靠尺 ≤2 mm vs 旧文不超过 5 mm

## [2026-08-25] ingest | 全屋装修与收纳知识整理
- Added `raw/articles/全屋装修与收纳知识整理.md`（immutable）
- Created `concepts/shouna.md`；SCHEMA 空间词表增加「收纳」
- Updated compiled pages: `xuan-zhuangxiu-gongsi`, `zhuangxiu-hetong`, `cailiao-xuangou`, `quanwu-dingzhi`, `yusuan-kanjia`, `cizhuan`, `chufang`, `keting`, `yangtai-menchuang`, `shui-dian`, `zengxiang-louxiang`
- Kept 两说：逾期万分之几 vs 千分之二；厨台 850 mm vs 身高÷2+5 cm；坐姿桌 750 mm vs 按身高 80/85/90 cm；直线柜抽屉 vs 拉篮易卡；水电人工面积×45 vs 强电 30–35 元/㎡

## [2026-08-25] ingest | xfx-house/raw（里可、小李、龚强）
- Copied 4 source notes into `wiki/raw/articles/`（immutable）
  - `里可半包七阶段与合同50问.md`
  - `里可半包31问.md`（缺问 11–16、23–25，未脑补）
  - `小李半包准备流程与报价.md`
  - `龚强做与不做细部卡.md`
- Created `comparisons/zuo-vs-buzuo.md`
- Updated compiled pages: `banbao`, `zhuangxiu-liucheng`, `zhuangxiu-hetong`, `shui-dian`, `xuan-zhuangxiu-gongsi`, `quanwu-dingzhi`, `shouna`, `chufang`, `keting`, `yangtai-menchuang`, `yanfang`, `yusuan-kanjia`, `cailiao-xuangou`, `cizhuan`, `jiangong-yanshou`, `zengxiang-louxiang`, `banbao-vs-quanbao`
- Kept 两说：18 步木工在贴砖前 vs 七阶段先瓦工后木工；龙骨 80/25 vs 里可 1000/400；线径底价 1.5/2.5/4 vs 合同 6/4/4/2.5；网线六类 vs 超六类；板材 E0 vs ENF；应急金 20% vs 10%–15%；涂料 2–3 遍 vs 一底两面

## [2026-08-26] ingest | xfx-house 柜体工艺六图（高星莫干山）
- Added `raw/articles/柜体工艺六看验收.md`（immutable）
- Copied 6 JPEGs into `raw/assets/`
- Created `concepts/guigui-gongyi.md`
- Updated compiled pages: `quanwu-dingzhi`, `jiangong-yanshou`, `zhuangxiu-liucheng`, `cailiao-xuangou`, `chufang`
- Kept 两说：询价「EVA、PUR 均可，激光封边别被噱头带跑」vs 到货「优先 PUR 或激光封边」
