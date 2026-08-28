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
MAX_NEW = int(os.getenv("MAX_NEW_COMPONENTS", "0"))
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

CATEGORY_EN = {
    "智能体框架": "Agent Frameworks", "MCP 服务": "MCP Services", "云存储与文件": "Cloud Storage & Files",
    "公共数据": "Public Data", "动漫与娱乐": "Anime & Entertainment", "动物与自然": "Animals & Nature",
    "区块链与加密": "Blockchain & Crypto", "商业与金融": "Business & Finance", "天气与地理": "Weather & Geography",
    "安全与认证": "Security & Authentication", "开发者工具": "Developer Tools", "政府与社会": "Government & Society",
    "数据与校验": "Data & Validation", "新闻与媒体": "News & Media", "日历与活动": "Calendar & Events",
    "模型与推理": "Models & Inference", "模型与文本": "Models & Text", "游戏与体育": "Games & Sports",
    "知识与内容": "Knowledge & Content", "科学与健康": "Science & Health", "科学与研究": "Science & Research",
    "网络服务": "Web Services", "艺术与设计": "Art & Design", "邮件与通信": "Email & Communication",
    "金融数据": "Financial Data", "音乐与视频": "Music & Video",
}

SOURCE_CATEGORY_ZH = {
    "Animals": "动物", "Anime": "动漫", "Anti-Malware": "恶意软件防护", "Art & Design": "艺术与设计",
    "Authentication & Authorization": "身份认证与授权", "Blockchain": "区块链", "Books": "图书",
    "Business": "商业", "Calendar": "日历", "Cloud Storage & File Sharing": "云存储与文件共享",
    "Continuous Integration": "持续集成", "Cryptocurrency": "加密货币", "Currency Exchange": "汇率兑换",
    "Data Validation": "数据校验", "Development": "开发工具", "Dictionaries": "词典",
    "Documents & Productivity": "文档与效率", "Email": "电子邮件", "Entertainment": "娱乐",
    "Environment": "环境", "Events": "活动", "Finance": "金融", "Food & Drink": "餐饮",
    "Games & Comics": "游戏与漫画", "Geocoding": "地理编码", "Government": "政府公共服务",
    "Health": "健康", "Jobs": "招聘", "Machine Learning": "机器学习", "Music": "音乐",
    "News": "新闻", "Open Data": "开放数据", "Open Source Projects": "开源项目", "Patent": "专利",
    "Personality": "趣味测试", "Phone": "电话", "Photography": "摄影", "Programming": "编程",
    "Science & Math": "科学与数学", "Security": "安全", "Shopping": "购物", "Social": "社交",
    "Sports & Fitness": "体育与健身", "Test Data": "测试数据", "Text Analysis": "文本分析",
    "Tracking": "追踪", "Transportation": "交通", "URL Shorteners": "短链接", "Vehicle": "车辆",
    "Video": "视频", "Weather": "天气",
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

CATEGORY_CASES_EN = {
    "动物与自然": ["nature data products", "educational content", "AI knowledge assistants"],
    "动漫与娱乐": ["content discovery", "entertainment recommendations", "interactive experiences"],
    "艺术与设计": ["creative asset search", "design automation", "content production"],
    "安全与认证": ["identity verification", "risk controls", "account security"],
    "区块链与加密": ["market dashboards", "on-chain research", "asset alerts"],
    "商业与金融": ["business research", "financial analysis", "operational automation"],
    "日历与活动": ["calendar integration", "event discovery", "reminder workflows"],
    "云存储与文件": ["file synchronization", "asset management", "document workflows"],
    "开发者工具": ["developer tooling", "test automation", "engineering analytics"],
    "数据与校验": ["data validation", "data enrichment", "quality control"],
    "邮件与通信": ["message automation", "notification services", "contact workflows"],
    "科学与健康": ["research data queries", "health information services", "education products"],
    "游戏与体育": ["scores and statistics", "game content", "fan experiences"],
    "天气与地理": ["location services", "travel planning", "weather and transport apps"],
    "政府与社会": ["public data research", "civic services", "social insights"],
    "知识与内容": ["knowledge retrieval", "content enrichment", "research assistants"],
    "模型与文本": ["text processing", "model integration", "AI application development"],
    "音乐与视频": ["media discovery", "content production", "audio and video products"],
    "新闻与媒体": ["news aggregation", "topic monitoring", "research briefs"],
    "网络服务": ["link management", "web automation", "traffic analysis"],
    "MCP 服务": ["AI tool integration", "agent workflows", "context enrichment"],
    "智能体框架": ["agent applications", "retrieval-augmented generation", "multi-tool orchestration"],
    "模型与推理": ["model evaluation", "inference prototypes", "AI product development"],
    "公共数据": ["data lookup", "product enrichment", "analytics"],
    "科学与研究": ["research data queries", "scientific visualization", "education products"],
    "金融数据": ["market dashboards", "price alerts", "investment research"],
}

CURATED_DESCRIPTIONS_EN = {
    "open-library": "Search open bibliographic data for books, authors, editions, and cover images.",
    "github-rest-api": "Read and manage GitHub repositories, issues, pull requests, Actions, and related development data.",
    "coingecko-api": "Access cryptocurrency prices, markets, exchanges, and historical market data.",
    "context7": "Bring current, version-matched development documentation into AI coding contexts.",
    "playwright-mcp": "Let AI agents control browsers through structured page state and accessible browser actions.",
    "mcp-typescript-sdk": "The official TypeScript SDK for building MCP servers and clients.",
    "langchain-js": "A JavaScript and TypeScript framework for building agent and LLM applications.",
    "nominatim": "OpenStreetMap-powered geocoding and reverse-geocoding services.",
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
    queries = [("mcp-server", "MCP", "MCP 服务"), ("ai-agent-framework", "SDK", "智能体框架")]
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


def parse_editorial_response(value: object) -> list[dict]:
    if isinstance(value, str):
        value = json.loads(value.strip().removeprefix("```json").removesuffix("```").strip())
    items = value.get("items") if isinstance(value, dict) else value
    if not isinstance(items, list) or not all(isinstance(item, dict) for item in items):
        raise ValueError("Workers AI did not return editorial items")
    return items


def enrich_with_cloudflare(candidates: list[dict]) -> list[dict]:
    endpoint = os.getenv("CLOUDFLARE_EDITORIAL_ENDPOINT", "")
    token = os.getenv("EDITORIAL_API_TOKEN", "")
    if not endpoint or not token:
        raise RuntimeError("CLOUDFLARE_EDITORIAL_ENDPOINT and EDITORIAL_API_TOKEN are required")

    prompt = f"""你是 AI 工具黄页编辑。把下面候选组件整理为严格 JSON 对象：{{"items": [...]}}，items 顺序和数量必须完全一致。
items 每项只返回 description、summary、tags、useCases、quickstart、descriptionEn、summaryEn、tagsEn、useCasesEn、quickstartEn 十个字段。
要求：前五个字段使用简体中文，后五个字段使用自然、专业的英文且语义一致；description/descriptionEn 30-55 字或 12-24 words；summary/summaryEn 60-120 字或 25-55 words；tags/tagsEn 各 3 个短词；useCases/useCasesEn 各 3 个具体场景。quickstart 只在候选信息足以确认时给一条可复制命令，否则写“请先阅读官方文档并按项目说明安装。”；quickstartEn 对应写 “Read the official documentation and follow the project setup guide.”。不得虚构免费额度、密钥、命令或功能。
候选：{json.dumps(candidates, ensure_ascii=False)}"""
    body = json.dumps({"prompt": prompt}, ensure_ascii=False).encode()
    request = urllib.request.Request(endpoint, data=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json",
        "User-Agent": "ai-baibaoxiang/1.0",
    })
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.loads(response.read().decode("utf-8"))
    enriched = parse_editorial_response(payload.get("response"))
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
    english = candidate_english_enrichment(candidate)
    tags_en = ai.get("tagsEn") if isinstance(ai.get("tagsEn"), list) else english["tagsEn"]
    cases_en = ai.get("useCasesEn") if isinstance(ai.get("useCasesEn"), list) else english["useCasesEn"]
    item = {
        "slug": slug, "name": candidate["name"], "initial": candidate["name"][:1].upper(),
        "type": candidate["type"], "category": candidate["category"],
        "description": str(ai.get("description") or candidate["description"]).strip(),
        "summary": str(ai.get("summary") or candidate["description"]).strip(),
        "officialUrl": candidate["url"], "docsUrl": candidate["url"], "sourceUrl": candidate["source_url"],
        "auth": auth_zh(candidate["auth"]) if candidate.get("origin") == "public-apis" else candidate["auth"],
        "free": True, "status": "待确认", "verifiedAt": dt.date.today().isoformat(),
        "accent": PALETTE[int(hashlib.sha1(slug.encode()).hexdigest(), 16) % len(PALETTE)],
        "tags": [str(value)[:20] for value in tags[:4]],
        "useCases": [str(value)[:40] for value in cases[:3]],
        "quickstart": str(ai.get("quickstart") or "请先阅读官方文档并按项目说明安装。").strip(),
        "descriptionEn": str(ai.get("descriptionEn") or english["descriptionEn"]).strip(),
        "summaryEn": str(ai.get("summaryEn") or english["summaryEn"]).strip(),
        "tagsEn": [str(value)[:40] for value in tags_en[:4]],
        "useCasesEn": [str(value)[:80] for value in cases_en[:3]],
        "quickstartEn": str(ai.get("quickstartEn") or english["quickstartEn"]).strip(),
    }
    if candidate.get("origin") == "public-apis":
        item.update({
            "sourceCategory": SOURCE_CATEGORY_ZH.get(candidate.get("source_category", ""), candidate["category"]),
            "https": connection_zh(candidate.get("https", "")),
            "cors": connection_zh(candidate.get("cors", "")),
        })
    return item


def auth_zh(value: str) -> str:
    if value == "无需密钥":
        return value
    return value.replace("apiKey", "API 密钥").replace("OAuth", "开放授权")


def connection_zh(value: str) -> str:
    return {"yes": "支持", "no": "不支持"}.get(value.lower(), "未知")


def auth_en(value: str) -> str:
    return {
        "无需密钥": "No key required", "API 密钥": "API key", "开放授权": "OAuth",
        "以官方文档为准": "See official docs", "取决于模型": "Depends on model",
        "可选 API Key": "Optional API key", "可选 Token": "Optional token",
    }.get(value, value.replace("apiKey", "API key"))


def connection_en(value: str) -> str:
    return {"yes": "supported", "no": "not supported", "支持": "supported", "不支持": "not supported"}.get(value.lower(), "unknown")


def candidate_english_enrichment(candidate: dict) -> dict:
    category = CATEGORY_EN.get(candidate["category"], candidate["category"])
    cases = CATEGORY_CASES_EN.get(candidate["category"], ["data lookup", "product integration", "automated workflows"])
    description = candidate["description"].strip().rstrip(".")
    auth = auth_en(auth_zh(candidate["auth"]))
    https = connection_en(candidate.get("https", ""))
    cors = connection_en(candidate.get("cors", ""))
    return {
        "descriptionEn": f"{description}.",
        "summaryEn": f"{candidate['name']} provides {category.lower()} capabilities for {cases[0]}, {cases[1]}, and {cases[2]}. Authentication: {auth}; HTTPS: {https}; CORS: {cors}. Check the official documentation for current parameters, limits, and terms.",
        "tagsEn": [candidate.get("source_category", category), auth, "Open API"],
        "useCasesEn": cases,
        "quickstartEn": f"1. Open the official documentation: {candidate['url']}\n2. Authentication: {auth}; configure credentials as documented.\n3. Connectivity: HTTPS {https}; CORS {cors}.\n4. Choose an endpoint for {cases[0]} and test it with the official parameter examples.\n5. Before launch, confirm rate limits, free-tier terms, data licensing, and the latest API version.",
    }


def existing_english_enrichment(item: dict) -> dict:
    category = CATEGORY_EN.get(item["category"], item["category"])
    cases = CATEGORY_CASES_EN.get(item["category"], ["product integration", "automated workflows", "AI applications"])
    description = CURATED_DESCRIPTIONS_EN.get(item["slug"], f"{item['name']} provides {category.lower()} capabilities for AI products and workflows.")
    quickstart = item["quickstart"] if not re.search(r"[\u4e00-\u9fff]", item["quickstart"]) else f"Read the official documentation at {item['docsUrl']} and follow the project setup guide."
    return {
        "descriptionEn": description,
        "summaryEn": f"{description} Use it for {cases[0]}, {cases[1]}, and {cases[2]}. Review the official documentation for current setup requirements, limits, and terms.",
        "tagsEn": [category, type_label_en(item["type"]), auth_en(item["auth"])],
        "useCasesEn": cases,
        "quickstartEn": quickstart,
    }


def type_label_en(value: str) -> str:
    return {"模型": "Model", "MCP": "MCP Service"}.get(value, value)


def source_enrichment(candidate: dict) -> dict:
    source_category = SOURCE_CATEGORY_ZH.get(candidate.get("source_category", ""), candidate["category"])
    cases = CATEGORY_CASES.get(candidate["category"], ["数据查询", "产品能力扩展", "自动化工作流"])
    auth = auth_zh(candidate["auth"])
    https = connection_zh(candidate.get("https", ""))
    cors = connection_zh(candidate.get("cors", ""))
    return {
        "description": f"提供{source_category}相关的数据查询与能力接入，可用于{cases[0]}等场景。",
        "summary": (
            f"{candidate['name']} 是一个{source_category}类开放接口，可用于{cases[0]}、{cases[1]}和{cases[2]}。"
            f"认证方式为{auth}，加密连接{https}，跨域调用{cors}。接入前请阅读官方文档，核对参数、调用限制与最新免费政策。"
        ),
        "tags": [source_category, auth, "开放接口"],
        "useCases": cases,
        "quickstart": (
            f"1. 打开官方文档：{candidate['url']}\n"
            f"2. 认证方式：{auth}；按官方说明申请并配置所需凭证。\n"
            f"3. 连接能力：加密连接{https}；跨域调用{cors}。\n"
            f"4. 从文档选择适合“{cases[0]}”的端点，按官方参数示例发起测试请求。\n"
            "5. 上线前核对速率限制、免费额度、数据许可和最新接口版本。"
        ),
        **candidate_english_enrichment(candidate),
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
            if candidate:
                localized = source_enrichment(candidate)
                item.update(localized)
                item.update({
                    "auth": auth_zh(candidate["auth"]),
                    "sourceCategory": SOURCE_CATEGORY_ZH.get(candidate["source_category"], candidate["category"]),
                    "https": connection_zh(candidate["https"]),
                    "cors": connection_zh(candidate["cors"]),
                })
                updated += 1
        for item in catalog:
            if not all(item.get(key) for key in ("descriptionEn", "summaryEn", "tagsEn", "useCasesEn", "quickstartEn")):
                item.update(existing_english_enrichment(item))
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
        REPORT_PATH.write_text(json.dumps({
            "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "mode": "daily", "status": "no-changes", "addedCount": 0,
            "upstreamCount": len(public_items),
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("no new components")
        return

    enriched = enrich_with_cloudflare(candidates)
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
    localized = source_enrichment(parsed[0])
    assert localized["quickstart"].startswith("1. 打开官方文档：https://example.com/docs")
    assert localized["description"] == "提供天气相关的数据查询与能力接入，可用于位置服务等场景。"
    assert localized["descriptionEn"] == "Weather data."
    assert localized["useCasesEn"][0] == "location services"
    assert parse_editorial_response('{"items":[{"description":"demo"}]}')[0]["description"] == "demo"
    assert slugify("Hello, API!") == "hello-api"
    print("self-check passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", action="store_true")
    parser.add_argument("--full-import", action="store_true")
    parser.add_argument("--self-check", action="store_true")
    args = parser.parse_args()
    self_check() if args.self_check else main(args.bootstrap, args.full_import)
