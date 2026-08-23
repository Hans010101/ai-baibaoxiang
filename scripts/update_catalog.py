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
    "Animals": "动物与自然", "Environment": "动物与自然",
    "Anime": "动漫与娱乐", "Entertainment": "动漫与娱乐", "Personality": "动漫与娱乐",
    "Anti-Malware": "安全与认证", "Authentication & Authorization": "安全与认证", "Security": "安全与认证",
    "Art & Design": "艺术与设计", "Photography": "艺术与设计",
    "Blockchain": "区块链与加密", "Cryptocurrency": "区块链与加密",
    "Books": "知识与内容", "Dictionaries": "知识与内容", "Documents & Productivity": "知识与内容", "Patent": "知识与内容",
    "Business": "商业与金融", "Currency Exchange": "商业与金融", "Finance": "商业与金融", "Jobs": "商业与金融", "Shopping": "商业与金融",
    "Calendar": "日历与活动", "Events": "日历与活动",
    "Cloud Storage & File Sharing": "云存储与文件",
    "Continuous Integration": "开发者工具", "Development": "开发者工具", "Open Source Projects": "开发者工具", "Programming": "开发者工具", "Test Data": "开发者工具",
    "Data Validation": "数据与校验", "Open Data": "数据与校验",
    "Email": "邮件与通信", "Phone": "邮件与通信",
    "Food & Drink": "科学与健康", "Health": "科学与健康", "Science & Math": "科学与健康",
    "Games & Comics": "游戏与体育", "Sports & Fitness": "游戏与体育",
    "Geocoding": "天气与地理", "Tracking": "天气与地理", "Transportation": "天气与地理", "Vehicle": "天气与地理", "Weather": "天气与地理",
    "Government": "政府与社会", "Social": "政府与社会",
    "Machine Learning": "模型与文本", "Text Analysis": "模型与文本",
    "Music": "音乐与视频", "Video": "音乐与视频",
    "News": "新闻与媒体", "URL Shorteners": "网络服务",
}

CATEGORY_CASES = {
    "动物与自然": ["自然数据应用", "科普内容服务", "AI 知识问答"],
    "动漫与娱乐": ["内容发现", "娱乐推荐", "互动应用"],
    "安全与认证": ["身份认证", "安全检测", "风险控制"],
    "艺术与设计": ["创意素材检索", "视觉内容应用", "设计工作流"],
    "区块链与加密": ["链上数据查询", "资产行情展示", "研究分析"],
    "知识与内容": ["内容检索", "知识库补充", "智能问答"],
    "商业与金融": ["商业数据分析", "行情与价格展示", "决策辅助"],
    "日历与活动": ["日程规划", "活动发现", "提醒服务"],
    "云存储与文件": ["文件管理", "内容同步", "自动化归档"],
    "开发者工具": ["开发自动化", "技术数据查询", "Agent 工具调用"],
    "数据与校验": ["数据补全", "格式校验", "开放数据分析"],
    "邮件与通信": ["消息通知", "地址或号码校验", "通信自动化"],
    "科学与健康": ["科研数据查询", "健康信息服务", "教育应用"],
    "游戏与体育": ["赛事与游戏数据", "内容社区", "数据可视化"],
    "天气与地理": ["位置服务", "出行规划", "天气与交通应用"],
    "政府与社会": ["公共信息查询", "社会数据分析", "便民服务"],
    "模型与文本": ["文本处理", "模型能力接入", "AI 应用开发"],
    "音乐与视频": ["媒体检索", "影音内容应用", "推荐服务"],
    "新闻与媒体": ["资讯聚合", "舆情跟踪", "内容分析"],
    "网络服务": ["链接管理", "营销追踪", "自动化工作流"],
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
    row = re.compile(r"^\|\s*\[([^]]+)]\((https?://[^)]+)\)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|")
    for line in markdown.splitlines():
        if line.strip() == "## Index":
            in_catalog = True
        elif in_catalog and line.startswith("### "):
            category = line[4:].strip()
        elif in_catalog and category:
            match = row.match(line)
            if match:
                name, url, description, auth, https, cors = (part.strip().strip("`") for part in match.groups())
                candidates.append({
                    "name": name, "url": url, "description": description,
                    "auth": "无需密钥" if auth.lower() == "no" else auth,
                    "category": CATEGORY_MAP.get(category, "公共数据"),
                    "source_category": category, "https": https, "cors": cors,
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
    item = {
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
    if candidate.get("origin") == "public-apis":
        item.update({
            "sourceCategory": candidate.get("source_category", ""),
            "https": candidate.get("https", "Unknown"),
            "cors": candidate.get("cors", "Unknown"),
        })
    return item


def source_enrichment(candidate: dict) -> dict:
    description = candidate["description"].strip().rstrip(".")
    https = {"yes": "支持", "no": "不支持"}.get(candidate.get("https", "").lower(), "未知")
    cors = {"yes": "支持", "no": "不支持"}.get(candidate.get("cors", "").lower(), "未知")
    use_case = CATEGORY_CASES.get(candidate["category"], ["数据查询"])[0]
    return {
        "description": f"面向{candidate['category']}场景的开放 API：{description}。",
        "summary": (
            f"{candidate['name']} 收录自 public-apis 的 {candidate.get('source_category', candidate['category'])} 分类。"
            f"上游核心说明：{description}。认证方式：{candidate['auth']}；HTTPS：{https}；CORS：{cors}。"
            "使用前请通过官方文档核对接口参数、调用限制与最新免费政策。"
        ),
        "tags": [candidate.get("source_category", candidate["category"]), candidate["auth"], "开放 API"],
        "useCases": CATEGORY_CASES.get(candidate["category"], ["数据查询", "产品能力扩展", "自动化工作流"]),
        "quickstart": (
            f"1. 打开官方文档：{candidate['url']}\n"
            f"2. 认证方式：{candidate['auth']}；按官方说明申请并配置所需凭证。\n"
            f"3. 连接能力：HTTPS {https}；CORS {cors}。\n"
            f"4. 从文档选择适合“{use_case}”的端点，按官方参数示例发起测试请求。\n"
            "5. 上线前核对速率限制、免费额度、数据许可和最新接口版本。"
        ),
    }


def main(bootstrap: bool = False, full_import: bool = False) -> None:
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

    if full_import:
        existing = {item["officialUrl"].rstrip("/") for item in catalog}
        public_by_url = {item["url"].rstrip("/"): item for item in public_items}
        used_slugs = {item["slug"] for item in catalog}
        additions = []
        for candidate in public_items:
            normalized_url = candidate["url"].rstrip("/")
            if normalized_url in existing:
                continue
            additions.append(assemble(candidate, source_enrichment(candidate), used_slugs))
            existing.add(normalized_url)
        updated = 0
        for item in catalog:
            candidate = public_by_url.get(item["officialUrl"].rstrip("/"))
            if candidate and item.get("quickstart") == "请先访问官方文档，确认接口地址与认证参数后，按照官方示例发起请求。":
                item["quickstart"] = source_enrichment(candidate)["quickstart"]
                updated += 1
        catalog.extend(additions)
        CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        state["publicApis"] = sorted(public_urls)
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        REPORT_PATH.write_text(json.dumps({
            "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "mode": "full-import", "addedCount": len(additions), "updatedCount": updated, "upstreamCount": len(public_items),
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"full import added {len(additions)} and updated {updated} components from {len(public_items)} upstream rows")
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
    assert parsed == [{"name": "Demo API", "url": "https://example.com/docs", "description": "Weather data", "auth": "无需密钥", "category": "天气与地理", "source_category": "Weather", "https": "Yes", "cors": "Yes", "type": "API", "source_url": SOURCE_URL, "origin": "public-apis"}]
    assert source_enrichment(parsed[0])["quickstart"].startswith("1. 打开官方文档：https://example.com/docs")
    assert slugify("Hello, API!") == "hello-api"
    print("self-check passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", action="store_true")
    parser.add_argument("--full-import", action="store_true")
    parser.add_argument("--self-check", action="store_true")
    args = parser.parse_args()
    self_check() if args.self_check else main(args.bootstrap, args.full_import)
