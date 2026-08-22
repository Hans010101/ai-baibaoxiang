#!/usr/bin/env python3
"""Discover new components and enrich a small daily batch with Workers AI."""

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
STATE_PATH = ROOT / "data" / "sync-state.json"
REPORT_PATH = ROOT / "data" / "update-report.json"
PUBLIC_APIS_URL = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md"
SOURCE_URL = "https://github.com/public-apis/public-apis"
MAX_NEW = int(os.getenv("MAX_NEW_COMPONENTS", "8"))
PALETTE = ["#315bea", "#18a87b", "#e48743", "#6f63d9", "#2877c7", "#d4634a"]

CATEGORY_MAP = {
    "Machine Learning": "模型与推理", "Text Analysis": "模型与推理",
    "Development": "开发者工具", "Programming": "开发者工具", "Open Source Projects": "开发者工具",
    "Weather": "天气与地理", "Geocoding": "天气与地理", "Transportation": "天气与地理",
    "Books": "知识与内容", "Dictionaries": "知识与内容", "News": "知识与内容",
    "Science & Math": "科学与研究", "Environment": "科学与研究",
    "Finance": "金融数据", "Cryptocurrency": "金融数据", "Currency Exchange": "金融数据",
    "Security": "安全与认证", "Authentication & Authorization": "安全与认证", "Anti-Malware": "安全与认证",
}


def fetch_text(url: str, token: str = "") -> str:
    headers = {"User-Agent": "ai-baibaoxiang/1.0", "Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-GitHub-Api-Version"] = "2022-11-28"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        return response.read().decode("utf-8")


def parse_public_apis(markdown: str) -> list[dict]:
    candidates: list[dict] = []
    category = ""
    in_catalog = False
    row = re.compile(r"^\|\s*\[([^]]+)]\((https?://[^)]+)\)\s*\|\s*([^|]+)\|\s*([^|]+)\|")
    for line in markdown.splitlines():
        if line.strip() == "## Index":
            in_catalog = True
        elif in_catalog and line.startswith("### "):
            category = line[4:].strip()
        elif in_catalog and category:
            match = row.match(line)
            if match:
                name, url, description, auth = (part.strip().strip("`") for part in match.groups())
                candidates.append({
                    "name": name, "url": url, "description": description,
                    "auth": "无需密钥" if auth.lower() == "no" else auth,
                    "category": CATEGORY_MAP.get(category, "公共数据"),
                    "type": "API", "source_url": SOURCE_URL, "origin": "public-apis",
                })
    return candidates


def discover_github(token: str) -> list[dict]:
    since = (dt.date.today() - dt.timedelta(days=8)).isoformat()
    queries = [("mcp-server", "MCP", "MCP 服务"), ("ai-agent-framework", "SDK", "Agent 框架")]
    found: list[dict] = []
    for topic, component_type, category in queries:
        query = urllib.parse.quote(f"topic:{topic} created:>={since} stars:>=10")
        payload = json.loads(fetch_text(f"https://api.github.com/search/repositories?q={query}&sort=stars&per_page=10", token))
        for repo in payload.get("items", []):
            found.append({
                "name": repo["name"], "url": repo["html_url"],
                "description": repo.get("description") or repo["name"],
                "auth": "以官方文档为准", "category": category,
                "type": component_type, "source_url": repo["html_url"], "origin": "github",
            })
    return found


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return slug or hashlib.sha1(value.encode()).hexdigest()[:10]


def enrich_with_cloudflare(candidates: list[dict]) -> list[dict]:
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    token = os.getenv("CLOUDFLARE_API_TOKEN", "")
    if not account or not token:
        print("Workers AI credentials missing; candidates will be retried next run")
        return []

    model = os.getenv("CF_AI_MODEL") or "@cf/meta/llama-3.1-8b-instruct"
    prompt = f"""你是 AI 工具黄页编辑。把下面候选组件整理为严格 JSON 数组，顺序和数量必须完全一致。
每项只返回 description、summary、tags、useCases、quickstart 五个字段。
要求：简体中文；description 30-55 字；summary 60-120 字；tags 3 个短词；useCases 3 个具体场景；quickstart 只在候选信息足以确认时给一条可复制命令，否则写“请先阅读官方文档并按项目说明安装。”。不得虚构免费额度、密钥、命令或功能。
候选：{json.dumps(candidates, ensure_ascii=False)}"""
    body = json.dumps({"messages": [{"role": "user", "content": prompt}], "max_tokens": 3500}).encode()
    endpoint = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    request = urllib.request.Request(endpoint, data=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json",
        "User-Agent": "ai-baibaoxiang/1.0",
    })
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.loads(response.read().decode("utf-8"))
    text = payload.get("result", {}).get("response", "")
    start, end = text.find("["), text.rfind("]")
    if start < 0 or end < start:
        raise ValueError("Workers AI did not return a JSON array")
    enriched = json.loads(text[start:end + 1])
    if len(enriched) != len(candidates):
        raise ValueError("Workers AI returned a different item count")
    return enriched


def assemble(candidate: dict, ai: dict, used_slugs: set[str]) -> dict:
    slug = slugify(candidate["name"])
    base, suffix = slug, 2
    while slug in used_slugs:
        slug, suffix = f"{base}-{suffix}", suffix + 1
    used_slugs.add(slug)
    tags = ai.get("tags") if isinstance(ai.get("tags"), list) else [candidate["category"], candidate["type"], "新收录"]
    cases = ai.get("useCases") if isinstance(ai.get("useCases"), list) else ["产品能力扩展", "自动化工作流", "AI Agent 工具调用"]
    return {
        "slug": slug, "name": candidate["name"], "initial": candidate["name"][:1].upper(),
        "type": candidate["type"], "category": candidate["category"],
        "description": str(ai.get("description") or candidate["description"]).strip(),
        "summary": str(ai.get("summary") or candidate["description"]).strip(),
        "officialUrl": candidate["url"], "docsUrl": candidate["url"], "sourceUrl": candidate["source_url"],
        "auth": candidate["auth"], "free": True, "status": "待确认", "verifiedAt": dt.date.today().isoformat(),
        "accent": PALETTE[int(hashlib.sha1(slug.encode()).hexdigest(), 16) % len(PALETTE)],
        "tags": [str(value)[:20] for value in tags[:4]],
        "useCases": [str(value)[:40] for value in cases[:3]],
        "quickstart": str(ai.get("quickstart") or "请先阅读官方文档并按项目说明安装。").strip(),
    }


def main(bootstrap: bool = False) -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
    public_items = parse_public_apis(fetch_text(PUBLIC_APIS_URL))
    public_urls = {item["url"] for item in public_items}
    github_token = os.getenv("GITHUB_TOKEN", "")
    github_items = discover_github(github_token) if github_token else []

    if bootstrap or not state:
        state = {"publicApis": sorted(public_urls), "githubRepos": sorted(item["url"] for item in github_items)}
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"baseline saved: {len(public_urls)} public APIs")
        return

    known = set(state.get("publicApis", [])) | set(state.get("githubRepos", []))
    existing = {item["officialUrl"] for item in catalog}
    candidates = [item for item in public_items + github_items if item["url"] not in known and item["url"] not in existing][:MAX_NEW]
    if not candidates:
        print("no new components")
        return

    enriched = enrich_with_cloudflare(candidates)
    if not enriched:
        return
    used_slugs = {item["slug"] for item in catalog}
    additions = [assemble(candidate, ai, used_slugs) for candidate, ai in zip(candidates, enriched)]
    catalog.extend(additions)
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for candidate in candidates:
        key = "githubRepos" if candidate["origin"] == "github" else "publicApis"
        state.setdefault(key, []).append(candidate["url"])
        state[key] = sorted(set(state[key]))
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(json.dumps({
        "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "added": [{"name": item["name"], "slug": item["slug"], "status": item["status"]} for item in additions],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"added {len(additions)} components")


def self_check() -> None:
    sample = """## Index\n### Weather\nAPI | Description | Auth | HTTPS | CORS\n|:---|:---|:---|:---|:---|\n| [Demo API](https://example.com/docs) | Weather data | No | Yes | Yes |"""
    parsed = parse_public_apis(sample)
    assert parsed == [{"name": "Demo API", "url": "https://example.com/docs", "description": "Weather data", "auth": "无需密钥", "category": "天气与地理", "type": "API", "source_url": SOURCE_URL, "origin": "public-apis"}]
    assert slugify("Hello, API!") == "hello-api"
    print("self-check passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", action="store_true")
    parser.add_argument("--self-check", action="store_true")
    args = parser.parse_args()
    self_check() if args.self_check else main(args.bootstrap)
