"""Wiki health check. Replaces the old Chroma collection counter."""
import os
import re

WIKI = "wiki"
LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")


def check_wiki():
    index_path = os.path.join(WIKI, "index.md")
    if not os.path.exists(index_path):
        print(f"Missing {index_path}")
        return

    pages = {}
    for sub in ("concepts", "comparisons", "entities", "queries"):
        folder = os.path.join(WIKI, sub)
        if not os.path.isdir(folder):
            continue
        for name in os.listdir(folder):
            if name.endswith(".md"):
                pages[name[:-3]] = os.path.join(folder, name)

    with open(index_path, encoding="utf-8") as f:
        index = f.read()
    indexed = set(LINK_RE.findall(index))

    missing_from_index = sorted(set(pages) - indexed)
    missing_files = sorted(indexed - set(pages))
    print(f"Wiki pages: {len(pages)}")
    print(f"Index links: {len(indexed)}")
    if missing_from_index:
        print(f"Not in index: {missing_from_index}")
    if missing_files:
        print(f"Broken index links: {missing_files}")

    broken = []
    for slug, path in pages.items():
        text = open(path, encoding="utf-8").read()
        for target in LINK_RE.findall(text):
            if target not in pages:
                broken.append(f"{slug} -> [[{target}]]")
    if broken:
        print("Broken wikilinks:")
        for item in broken:
            print(f"  {item}")
    else:
        print("Wikilinks OK.")


if __name__ == "__main__":
    check_wiki()
