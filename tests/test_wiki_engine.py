import unittest

from wiki_engine import WikiEngine


class WikiEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.wiki = WikiEngine("wiki")

    def test_loads_compiled_pages(self):
        self.assertEqual(len(self.wiki.pages), 17)
        self.assertIsNotNone(self.wiki.get_page("shui-dian"))
        self.assertIsNotNone(self.wiki.get_page("cizhuan"))
        self.assertIsNone(self.wiki.get_page("missing-page"))

    def test_list_pages_includes_section(self):
        pages = self.wiki.list_pages()
        slugs = {page.slug for page in pages}
        self.assertIn("shui-dian", slugs)
        self.assertIn("banbao-vs-quanbao", slugs)
        water = next(page for page in pages if page.slug == "shui-dian")
        self.assertEqual(water.section, "concepts")
        self.assertEqual(water.title, "水电改造")

    def test_selects_water_page_for_billing_question(self):
        picked = self.wiki.select_pages("水电怎么收费", n_results=4)
        self.assertTrue(picked)
        self.assertEqual(picked[0][0].slug, "shui-dian")

    def test_selects_tile_page_for_buying_question(self):
        picked = self.wiki.select_pages("瓷砖怎么选附录G", n_results=4)
        slugs = [page.slug for page, _score in picked]
        self.assertIn("cizhuan", slugs)

    def test_selects_comparison_for_package_question(self):
        picked = self.wiki.select_pages("半包和全包有什么区别", n_results=4)
        slugs = [page.slug for page, _score in picked]
        self.assertIn("banbao-vs-quanbao", slugs)

    def test_query_detailed_returns_citations(self):
        context, citations = self.wiki.query_detailed("第一次去装修公司谈什么")
        self.assertIn("选装修公司", context)
        self.assertTrue(citations)
        self.assertEqual(citations[0].slug, "xuan-zhuangxiu-gongsi")
        payload = citations[0].to_dict()
        self.assertEqual(payload["title"], "选装修公司")
        self.assertIn("score", payload)

    def test_web_markdown_rewrites_wikilinks(self):
        page = self.wiki.get_page("yusuan-kanjia")
        self.assertIsNotNone(page)
        markdown = self.wiki.to_web_markdown(page.body)
        self.assertIn("](/wiki/zhuangxiu-hetong)", markdown)
        links = self.wiki.outgoing_links(page.body)
        slugs = {item["slug"] for item in links}
        self.assertIn("zhuangxiu-hetong", slugs)
        self.assertTrue(all(item["exists"] for item in links))


if __name__ == "__main__":
    unittest.main()
