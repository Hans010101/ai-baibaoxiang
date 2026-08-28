#!/usr/bin/env python3
"""Validate the catalog before it reaches production."""

import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "catalog.json"
REQUIRED = {
    "slug", "name", "initial", "type", "category", "description", "summary",
    "officialUrl", "docsUrl", "sourceUrl", "auth", "free", "status",
    "verifiedAt", "accent", "tags", "useCases", "quickstart",
    "descriptionEn", "summaryEn", "tagsEn", "useCasesEn", "quickstartEn",
}


def validate(items: list[dict]) -> None:
    assert isinstance(items, list) and items, "catalog must be a non-empty list"
    slugs: set[str] = set()
    official_urls: set[str] = set()
    for index, item in enumerate(items):
        missing = REQUIRED - item.keys()
        assert not missing, f"item {index} missing: {', '.join(sorted(missing))}"
        assert item["slug"] not in slugs, f"duplicate slug: {item['slug']}"
        slugs.add(item["slug"])
        assert item["status"] in {"已验证", "待确认"}, f"invalid status: {item['slug']}"
        assert isinstance(item["free"], bool), f"free must be boolean: {item['slug']}"
        assert item["tags"] and item["useCases"], f"tags/useCases required: {item['slug']}"
        for key in ("description", "summary"):
            assert re.search(r"[\u4e00-\u9fff]", item[key]), f"{key} must contain Chinese: {item['slug']}"
        for key in ("descriptionEn", "summaryEn"):
            assert re.search(r"[A-Za-z]", item[key]) and not re.search(r"[\u4e00-\u9fff]", item[key]), f"{key} must be English: {item['slug']}"
        assert item["tagsEn"] and item["useCasesEn"], f"English tags/useCases required: {item['slug']}"
        for key in ("officialUrl", "docsUrl"):
            parsed = urlparse(item[key])
            assert parsed.scheme == "https" and parsed.netloc, f"insecure {key}: {item['slug']}"
        source = urlparse(item["sourceUrl"])
        assert source.scheme in {"http", "https"} and source.netloc, f"invalid sourceUrl: {item['slug']}"
        normalized_url = item["officialUrl"].lower().removesuffix("/")
        assert normalized_url not in official_urls, f"duplicate officialUrl: {item['slug']}"
        official_urls.add(normalized_url)


if __name__ == "__main__":
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    validate(data)
    print(f"catalog valid: {len(data)} items")
