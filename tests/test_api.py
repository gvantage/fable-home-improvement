import json
import unittest

from fastapi.testclient import TestClient

from server import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_spa_serves_chinese_shell(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("装册", response.text)

    def test_spa_accepts_head(self):
        home = self.client.head("/")
        self.assertEqual(home.status_code, 200)
        wiki = self.client.head("/wiki")
        self.assertEqual(wiki.status_code, 200)

    def test_catalog_has_space_categories(self):
        response = self.client.get("/api/catalog")
        self.assertEqual(response.status_code, 200)
        names = [category["name"] for category in response.json()["categories"]]
        self.assertIn("卫生间", names)
        self.assertIn("厨房", names)
        bathroom = next(
            cat for cat in response.json()["categories"] if cat["name"] == "卫生间"
        )
        self.assertTrue(bathroom["items"])
        self.assertTrue(bathroom["items"][0]["id"].startswith("卫生间:"))
        names = {item["name"] for item in bathroom["items"]}
        self.assertTrue({"马桶", "浴霸", "浴室柜"} <= names)

    def test_wiki_list_and_page(self):
        listing = self.client.get("/api/wiki")
        self.assertEqual(listing.status_code, 200)
        slugs = {page["slug"] for page in listing.json()["pages"]}
        self.assertIn("shui-dian", slugs)

        page = self.client.get("/api/wiki/shui-dian")
        self.assertEqual(page.status_code, 200)
        body = page.json()
        self.assertEqual(body["title"], "水电改造")
        self.assertIn("/wiki/zengxiang-louxiang", body["markdown"])
        self.assertTrue(body["links"])

        missing = self.client.get("/api/wiki/not-a-page")
        self.assertEqual(missing.status_code, 404)

    def test_llm_status_does_not_leak_key(self):
        response = self.client.get("/api/llm")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("configured", body)
        self.assertIn("default_model", body)
        self.assertIn("default_base_url", body)
        self.assertNotIn("api_key", body)
        self.assertNotIn("OPENROUTER_API_KEY", json.dumps(body))

    def test_llm_test_reports_missing_key(self):
        import server

        original = server.llm.api_key
        server.llm.api_key = ""
        try:
            response = self.client.post("/api/llm/test", json={"api_key": "", "model": "x"})
        finally:
            server.llm.api_key = original
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["ok"])
        self.assertIn("密钥", body["error"])

    def test_llm_test_uses_posted_settings(self):
        import server

        captured = {}

        def fake_test(api_key=None, base_url=None, model=None):
            captured.update(api_key=api_key, base_url=base_url, model=model)
            return {"ok": True, "model": model}

        original = server.llm.test_connection
        server.llm.test_connection = fake_test
        try:
            response = self.client.post(
                "/api/llm/test",
                json={
                    "api_key": "sk-user",
                    "base_url": "https://api.deepseek.com/v1",
                    "model": "deepseek-chat",
                },
            )
        finally:
            server.llm.test_connection = original
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(captured.get("api_key"), "sk-user")
        self.assertEqual(captured.get("base_url"), "https://api.deepseek.com/v1")
        self.assertEqual(captured.get("model"), "deepseek-chat")

    def test_llm_test_rejects_invalid_base_url(self):
        response = self.client.post(
            "/api/llm/test",
            json={"api_key": "sk-test", "base_url": "file:///etc/passwd", "model": "x"},
        )
        self.assertEqual(response.status_code, 400)

    def test_llm_test_reports_missing_key(self):
        import server

        original = server.llm.api_key
        server.llm.api_key = ""
        try:
            response = self.client.post("/api/llm/test", json={"api_key": "", "model": "x"})
        finally:
            server.llm.api_key = original
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertFalse(body["ok"])
        self.assertIn("密钥", body["error"])

    def test_llm_test_uses_posted_settings(self):
        import server

        captured = {}

        def fake_test(api_key=None, base_url=None, model=None):
            captured.update(api_key=api_key, base_url=base_url, model=model)
            return {"ok": True, "model": model}

        original = server.llm.test_connection
        server.llm.test_connection = fake_test
        try:
            response = self.client.post(
                "/api/llm/test",
                json={
                    "api_key": "sk-user",
                    "base_url": "https://api.deepseek.com/v1",
                    "model": "deepseek-chat",
                },
            )
        finally:
            server.llm.test_connection = original
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(captured.get("api_key"), "sk-user")
        self.assertEqual(captured.get("base_url"), "https://api.deepseek.com/v1")
        self.assertEqual(captured.get("model"), "deepseek-chat")

    def test_llm_test_rejects_invalid_base_url(self):
        response = self.client.post(
            "/api/llm/test",
            json={"api_key": "sk-test", "base_url": "file:///etc/passwd", "model": "x"},
        )
        self.assertEqual(response.status_code, 400)

    def test_chat_rejects_invalid_llm_base_url(self):
        response = self.client.post(
            "/api/chat",
            json={
                "message": "水电怎么收费",
                "llm": {
                    "api_key": "sk-test",
                    "base_url": "file:///etc/passwd",
                    "model": "x",
                },
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_chat_passes_client_llm_settings(self):
        import server

        captured = {}

        def fake_stream(_query, _context, quote_summary=None, history=None, **kwargs):
            captured.update(kwargs)
            yield "按点收费更清楚。"

        original = server.llm.generate_rag_response_stream
        server.llm.generate_rag_response_stream = fake_stream
        try:
            with self.client.stream(
                "POST",
                "/api/chat",
                json={
                    "message": "水电怎么收费",
                    "llm": {
                        "api_key": "sk-user",
                        "base_url": "https://openrouter.ai/api/v1",
                        "model": "deepseek/deepseek-chat",
                    },
                },
            ) as response:
                self.assertEqual(response.status_code, 200)
                body = "".join(response.iter_text())
        finally:
            server.llm.generate_rag_response_stream = original

        self.assertEqual(captured.get("api_key"), "sk-user")
        self.assertEqual(captured.get("base_url"), "https://openrouter.ai/api/v1")
        self.assertEqual(captured.get("model"), "deepseek/deepseek-chat")
        self.assertIn('"type": "done"', body)

    def test_chat_rejects_empty_question(self):
        response = self.client.post("/api/chat", json={"message": "   "})
        self.assertEqual(response.status_code, 400)

    def test_chat_streams_citations_then_tokens(self):
        import server

        def fake_stream(_query, _context, quote_summary=None, history=None, **_kwargs):
            self.assertIn("水电", _query)
            yield "按点收费更清楚。"

        original = server.llm.generate_rag_response_stream
        server.llm.generate_rag_response_stream = fake_stream
        try:
            with self.client.stream(
                "POST",
                "/api/chat",
                json={"message": "水电怎么收费", "quote_summary": "总计 0"},
            ) as response:
                self.assertEqual(response.status_code, 200)
                body = "".join(response.iter_text())
        finally:
            server.llm.generate_rag_response_stream = original

        self.assertIn('"type": "citations"', body)
        self.assertIn("shui-dian", body)
        self.assertIn("按点收费更清楚", body)
        self.assertIn('"type": "done"', body)


if __name__ == "__main__":
    unittest.main()
