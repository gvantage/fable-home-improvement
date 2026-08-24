import unittest

from llm_client import LLMClient


class LlmClientTests(unittest.TestCase):
    def test_request_credentials_override_env(self):
        client = LLMClient()
        resolved = client.resolve_credentials(
            api_key="sk-user",
            base_url="https://api.deepseek.com/v1",
            model="deepseek-chat",
        )
        self.assertEqual(resolved["api_key"], "sk-user")
        self.assertEqual(resolved["base_url"], "https://api.deepseek.com/v1")
        self.assertEqual(resolved["model"], "deepseek-chat")

    def test_blank_request_falls_back_to_defaults(self):
        client = LLMClient()
        resolved = client.resolve_credentials(api_key="  ", base_url="", model=None)
        self.assertEqual(resolved["base_url"], client.base_url)
        self.assertEqual(resolved["model"], client.model)
        self.assertEqual(resolved["api_key"], client.api_key)

    def test_missing_key_stream_explains_settings(self):
        client = LLMClient()
        client.api_key = ""
        chunks = list(
            client.generate_rag_response_stream(
                "水电怎么收费",
                "上下文",
                api_key="",
                base_url="https://openrouter.ai/api/v1",
                model="x",
            )
        )
        text = "".join(chunks)
        self.assertIn("模型设置", text)
        self.assertNotIn("OPENROUTER_API_KEY", text)

    def test_http_headers_are_latin1(self):
        from llm_client import REQUEST_HEADERS

        for key, value in REQUEST_HEADERS.items():
            key.encode("ascii")
            value.encode("latin-1")

    def test_connection_without_key_fails_cleanly(self):
        client = LLMClient()
        client.api_key = ""
        result = client.test_connection(api_key="")
        self.assertFalse(result["ok"])
        self.assertIn("密钥", result["error"])
