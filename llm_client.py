import os

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-v4-flash-0731"
REQUEST_HEADERS = {
    "HTTP-Referer": "http://localhost:8000",
    "X-Title": "fable-home-improvement",
}

SYSTEM_PROMPT = """你是「装册」里的装修助手，依据本地装修 wiki 页面回答业主问题。
优先使用页面里的具体数字、条款和清单，并点明依据的页面名称。
如果用户附带了工册报价摘要，可以评论分项是否可疑或遗漏，但必须说明：
这不是城市行情库，不能当作精确报价。
如果 wiki 里没有相关信息，可以补充通用知识，但要说明不是来自本地知识库。
回答用中文，简洁、可执行。"""


def _friendly_error(exc: Exception, api_key: str = "") -> str:
    text = str(exc)
    if api_key:
        text = text.replace(api_key, "***")
    lowered = text.lower()
    if "codec can't encode" in lowered or "ordinal not in range" in lowered:
        return "请求头含有无法发送的字符，请更新装册后重试。"
    if "401" in text or "unauthorized" in lowered or "invalid_api_key" in lowered:
        return "密钥无效，请核对 API 密钥。"
    if "403" in text or "forbidden" in lowered:
        return "模型服务拒绝了请求。请核对密钥、模型名，以及这个模型是否对当前账号开放。"
    if "402" in text or "insufficient" in lowered:
        return "账户余额不足，请到模型服务商处充值。"
    if "404" in text or ("model" in lowered and "not found" in lowered):
        return "找不到这个模型，请核对模型名。"
    if "connect" in lowered or "connection" in lowered or "timed out" in lowered:
        return "连不上接口地址，请检查网络和 Base URL。"
    return text[:180]


class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENROUTER_API_KEY") or ""
        self.model = os.getenv("LLM_MODEL") or os.getenv("OPENROUTER_MODEL") or DEFAULT_MODEL
        self.base_url = (
            os.getenv("LLM_BASE_URL") or os.getenv("OPENROUTER_BASE_URL") or DEFAULT_BASE_URL
        )

        if not self.api_key:
            print("Warning: no LLM API key in environment. Users can set one in the web UI.")

        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key or "missing",
            default_headers=REQUEST_HEADERS,
            timeout=20.0,
        )

    def resolve_credentials(self, api_key=None, base_url=None, model=None):
        key = (api_key or "").strip() or (self.api_key or "")
        url = (base_url or "").strip() or self.base_url
        mdl = (model or "").strip() or self.model
        return {
            "api_key": key,
            "base_url": url.rstrip("/"),
            "model": mdl,
        }

    def _build_messages(self, query, context, quote_summary=None, history=None):
        parts = [f"上下文信息：\n{context}"]
        if quote_summary:
            parts.append(f"当前工册摘要：\n{quote_summary}")
        parts.append(f"用户问题：\n{query}")
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for turn in history[-8:]:
                role = turn.get("role")
                content = (turn.get("content") or "").strip()
                if role in {"user", "assistant"} and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": "\n\n".join(parts)})
        return messages

    def _openai(self, api_key: str, base_url: str) -> OpenAI:
        return OpenAI(
            base_url=base_url,
            api_key=api_key,
            default_headers=REQUEST_HEADERS,
            timeout=20.0,
        )

    def test_connection(self, api_key=None, base_url=None, model=None):
        creds = self.resolve_credentials(api_key, base_url, model)
        if not creds["api_key"]:
            return {"ok": False, "error": "还没有 API 密钥。"}
        try:
            completion = self._openai(creds["api_key"], creds["base_url"]).chat.completions.create(
                model=creds["model"],
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=8,
            )
            if completion and completion.choices:
                return {"ok": True, "model": creds["model"]}
            return {"ok": False, "error": "接口没有返回内容。"}
        except Exception as exc:
            print(f"Error testing LLM: {exc}")
            return {"ok": False, "error": _friendly_error(exc, creds["api_key"])}

    def get_chat_response(self, messages, api_key=None, base_url=None, model=None):
        creds = self.resolve_credentials(api_key, base_url, model)
        if not creds["api_key"]:
            return "抱歉，还没有 API 密钥。请打开「模型设置」填写，或在项目根目录的 .env 写入密钥。"
        try:
            completion = self._openai(creds["api_key"], creds["base_url"]).chat.completions.create(
                model=creds["model"],
                messages=messages,
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return f"抱歉，模型暂时连不上。请检查「模型设置」里的密钥、接口地址和模型名。错误：{_friendly_error(e, creds['api_key'])}"

    def generate_rag_response(self, query, context, quote_summary=None, history=None, **kwargs):
        messages = self._build_messages(query, context, quote_summary, history)
        return self.get_chat_response(messages, **kwargs)

    def generate_rag_response_stream(
        self,
        query,
        context,
        quote_summary=None,
        history=None,
        api_key=None,
        base_url=None,
        model=None,
    ):
        creds = self.resolve_credentials(api_key, base_url, model)
        if not creds["api_key"]:
            yield "抱歉，还没有 API 密钥。请打开右侧「模型设置」填写密钥，或在项目根目录的 .env 写入密钥。"
            return

        messages = self._build_messages(query, context, quote_summary, history)
        try:
            stream = self._openai(creds["api_key"], creds["base_url"]).chat.completions.create(
                model=creds["model"],
                messages=messages,
                stream=True,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Error calling LLM stream: {e}")
            yield f"抱歉，模型暂时连不上。请检查「模型设置」。错误：{_friendly_error(e, creds['api_key'])}"
