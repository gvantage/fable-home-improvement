from wiki_engine import WikiEngine


def test_wiki(query):
    print(f"--- Wiki query: {query} ---")
    engine = WikiEngine()
    print(f"Pages loaded: {len(engine.pages)}")
    print(f"Titles: {list(engine.list_titles())}")
    picked = engine.select_pages(query, n_results=4)
    for page, score in picked:
        print(f"  {page.title} ({page.slug}) score={score:.1f}")
    print()
    print(engine.query(query, n_results=2)[:400])
    print("...\n")


if __name__ == "__main__":
    for q in ("第一次去装修公司谈什么", "水电怎么收费", "半包和全包有什么区别", "封阳台选什么窗"):
        test_wiki(q)
