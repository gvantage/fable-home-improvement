# fable-home-improvement

装册：给业主用的装修工册。左边改预算，右边问本地 wiki。知识按整页检索，不依赖向量库。

仓库：https://github.com/gvantage/fable-home-improvement

打开 http://localhost:5173（开发）或 http://localhost:8000（生产构建）。

## 模型设置

问答走 OpenAI 兼容接口，密钥**不必写进仓库**。

1. 打开页面右侧「模型设置」
2. 选 OpenRouter / DeepSeek / Ollama，或自己填接口地址和模型名
3. 填入对应服务的 API 密钥（服务商和密钥要匹配）
4. 等状态变成 **已连通**，或点「测试连接」

页面加载时会自动测一次。状态含义：

| 状态 | 含义 |
|---|---|
| 已连通 | 当前配置可以提问 |
| 连不上 | 密钥、地址或模型有问题，展开设置看原因 |
| 检测中 | 正在向接口发一条短请求 |
| 未测试 | 改过配置，还没再测 |
| 未配置 | 页面和服务器都还没有密钥 |

密钥保存在你的浏览器本地。提问和测试时会发给本机服务器去调模型，服务器不会把密钥写进文件。公开仓库请不要提交填好的 `.env`。

| 服务 | 接口地址 | 示例模型 |
|---|---|---|
| [OpenRouter](https://openrouter.ai/) | `https://openrouter.ai/api/v1` | `deepseek/deepseek-v4-flash-0731` |
| [DeepSeek](https://platform.deepseek.com/) | `https://api.deepseek.com/v1` | `deepseek-chat` |
| [Ollama](https://ollama.com/)（本机） | `http://127.0.0.1:11434/v1` | `qwen2.5` |

改了密钥、地址或模型后，状态会回到「未测试」，再点一次「测试连接」。

## 快速开始

需要 Python 3.11+ 和 Node 20+。

```bash
git clone https://github.com/gvantage/fable-home-improvement.git
cd fable-home-improvement
cp .env.example .env
# 密钥可以现在写进 .env，也可以稍后在页面里填

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd web && npm install && cd ..
```

同时开后端和前端：

```bash
source .venv/bin/activate
python server.py
```

另一个终端：

```bash
cd web && npm run dev
```

浏览器打开 http://localhost:5173

生产模式先构建前端，再只跑 Python：

```bash
cd web && npm run build && cd ..
python server.py
```

然后打开 http://localhost:8000

用 Docker：

```bash
docker compose up -d --build
```

部署细节见 [DEPLOY.md](DEPLOY.md)。

## 怎么回答问题

1. `wiki_engine.py` 读 `wiki/index.md`，按标题 / 标签 / 别名给主题页打分
2. 取出得分最高的几整页作为上下文
3. `llm_client.py` 用你在页面或 `.env` 里配的模型流式生成回答，并返回引用页

工册模板在 `data/yyyjson.json`。单价、数量和 API 密钥存在浏览器本地，不会上传。单价和数量为 `0` 时，鼠标移上去或点进去会清空，方便直接输入。

## 知识库

共 20 页，目录在 `wiki/index.md`。

加新资料：

1. 原文放进 `wiki/raw/articles/`（不要改已有 raw 文件）
2. 要点写进对应的 `wiki/concepts/` 或 `wiki/comparisons/` 页面
3. 新页补到 `wiki/index.md`，并在 `wiki/log.md` 记一笔

约定见 `wiki/SCHEMA.md`。自检：

```bash
python check_db.py
python -m unittest discover -s tests -v
```

## 目录

```
server.py            FastAPI：工册模板、wiki、对话、模型探测
wiki_engine.py       按 wiki 目录选页
llm_client.py        OpenAI 兼容接口
web/                 装册前端
wiki/                知识库
data/yyyjson.json    预算条目模板
.env.example         可选的服务器密钥模板（不要提交填好的 .env）
```

## 环境变量

都是可选。页面「模型设置」里填的密钥、地址、模型优先于这些变量。

| 变量 | 说明 |
|---|---|
| `LLM_API_KEY` | 服务器默认密钥；也认 `OPENROUTER_API_KEY` |
| `LLM_BASE_URL` | 默认 `https://openrouter.ai/api/v1` |
| `LLM_MODEL` | 默认 `deepseek/deepseek-v4-flash-0731` |
| `PORT` | 可选，默认 `8000` |
