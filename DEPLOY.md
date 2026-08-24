# 部署说明

fable-home-improvement（装册）：FastAPI + 前端工册，本地 wiki 知识库，默认端口 **8000**。

本机 Docker 是 Compose v2，请用 `docker compose`（中间空格）。

## 准备

- Python 3.11+（本地部署）
- Node 20+（本地构建前端）
- Docker Desktop / Docker Engine（容器部署）
- 一个 OpenAI 兼容接口的 API Key（OpenRouter、DeepSeek、Ollama 均可）

密钥有两种放法：

1. **推荐**：打开页面右侧「模型设置」填写，等状态变成 **已连通**。密钥保存在浏览器里，测试和提问时发给服务器调模型，不会写入文件。
2. 可选：复制 `.env.example` 为 `.env`，给服务器一个默认密钥。不要把填好的 `.env` 提交到 git。

```ini
LLM_API_KEY=你的密钥
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=deepseek/deepseek-v4-flash-0731
```

页面加载会自动测连接。改过配置后点「测试连接」。密钥必须和服务商一致，例如 OpenRouter 的密钥不能配 DeepSeek 的地址。

## 方式一：Docker（推荐）

```bash
docker compose up -d --build
```

打开 http://localhost:8000

没有 `.env` 也能启动，问答前在页面里填密钥并等到「已连通」即可。`docker-compose.yml` 里 `.env` 是可选文件。

| 操作 | 命令 |
|---|---|
| 看日志 | `docker compose logs -f` |
| 重启 | `docker compose restart` |
| 停止 | `docker compose down` |
| 改代码后重建 | `docker compose up -d --build` |

`wiki/` 和 `data/` 已挂进容器。改主题页后重启即可。改 `server.py` / `wiki_engine.py` / `llm_client.py` / `web/` 需要 `--build`。

换端口：改 `docker-compose.yml` 里的 `"8000:8000"`。

## 方式二：本地生产构建

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd web && npm install && npm run build && cd ..
python server.py
```

打开 http://localhost:8000

开发时用 `cd web && npm run dev`，前端在 5173，接口被代理到 8000。改了 `server.py` 或 `llm_client.py` 后要重启 Python 进程。

## 知识库

- 问答只读编译后的 `wiki/concepts/`、`wiki/comparisons/`
- 目录：`wiki/index.md`
- 原文：`wiki/raw/articles/`（只读，不直接检索）
- 没有向量库，不必配 embedding

新笔记不要只丢进 raw。写入对应主题页，并更新 `index.md`。自检：`python check_db.py`。

## 排错

| 现象 | 处理 |
|---|---|
| `zsh: command not found: docker-compose` | 改用 `docker compose` |
| 8000 被占用 | 先停掉旧进程，或改 `PORT` |
| 模型设置显示「连不上」 | 展开设置看原因；核对密钥、接口地址、模型名是否属于同一家服务 |
| 密钥无效 | 换对服务商的 Key，不要把 OpenRouter 的 Key 配到 DeepSeek 地址 |
| 找不到这个模型 | 核对模型名，或换一个预设 |
| 连不上接口地址 | 检查网络、Base URL，本机 Ollama 要先 `ollama serve` |
| 填了密钥仍提示未配置 | 刷新页面；开发模式确认 `python server.py` 已启动 |
| `env_file` 报错 | 复制 `cp .env.example .env` 后再启动 |
| 答案对不上新资料 | 把要点写进 `wiki/concepts/`，并在 `index.md` 加条目后重启 |
| 页面只有接口、没有界面 | 先 `cd web && npm run build`，确认存在 `web/dist` |
| 容器里还是旧知识 | 确认 `./wiki` 已挂载；只改 raw 不会生效 |
