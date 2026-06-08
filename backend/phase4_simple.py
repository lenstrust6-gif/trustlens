"""Phase 4 Simplified: Real YouTube verdicts (synchronous)."""
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import httpx
from groq import Groq
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from backend.db.models import ProductModel, VerdictModel

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def fetch_youtube_comments(product_name: str) -> list[str]:
    """Fetch YouTube comments (synchronous)."""
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return []

    search_params = {
        "q": f"{product_name} review",
        "type": "video",
        "maxResults": 3,
        "key": api_key,
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://trustlens.in/",
    }

    comments = []

    try:
        # Search for videos
        response = httpx.get(
            "https://www.googleapis.com/youtube/v3/search",
            params=search_params,
            headers=headers,
            timeout=10.0,
        )

        if response.status_code != 200:
            return []

        data = response.json()
        videos = [
            item["id"]["videoId"]
            for item in data.get("items", [])
            if item.get("id", {}).get("videoId")
        ]

        # Get comments from each video
        for video_id in videos:
            comment_params = {
                "videoId": video_id,
                "maxResults": 20,
                "textFormat": "plainText",
                "key": api_key,
            }

            comment_response = httpx.get(
                "https://www.googleapis.com/youtube/v3/commentThreads",
                params=comment_params,
                headers=headers,
                timeout=10.0,
            )

            if comment_response.status_code == 200:
                comment_data = comment_response.json()
                for item in comment_data.get("items", []):
                    text = (
                        item.get("snippet", {})
                        .get("topLevelComment", {})
                        .get("snippet", {})
                        .get("textDisplay", "")
                    )
                    if text and len(text) > 10:
                        comments.append(text)
                    if len(comments) >= 50:
                        return comments

    except Exception as e:
        pass

    return comments


def generate_verdict(product_name: str, comments: list[str]) -> dict | None:
    """Generate verdict from comments using Groq."""
    if not comments:
        return None

    comments_text = "\n".join(comments[:20])

    prompt = f"""Analyze these YouTube comments about "{product_name}" and generate a JSON verdict.

COMMENTS:
{comments_text}

Return JSON only (no markdown):
{{
  "trustScore": 8.5,
  "summary": "80-120 word verdict summary",
  "pros": ["list", "of", "positives"],
  "cons": ["list", "of", "negatives"],
  "bestFor": ["use", "cases"],
  "avoidIf": ["when", "not", "to", "buy"],
  "featureScores": {{"battery": 8, "sound": 9}},
  "specTags": {{"waterproof": "Yes"}},
  "confidenceTier": "established"
}}"""

    try:
        message = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )

        response_text = message.content[0].text.strip()

        # Extract JSON
        if "{" in response_text:
            json_str = response_text[response_text.find("{") : response_text.rfind("}") + 1]
            verdict = json.loads(json_str)
        else:
            return None

        return {
            "trustScore": verdict.get("trustScore", 7.5),
            "summary": verdict.get("summary", ""),
            "pros": verdict.get("pros", []),
            "cons": verdict.get("cons", []),
            "bestFor": verdict.get("bestFor", []),
            "avoidIf": verdict.get("avoidIf", []),
            "featureScores": verdict.get("featureScores", {}),
            "specTags": verdict.get("specTags", {}),
            "confidenceTier": verdict.get("confidenceTier", "established"),
            "sourcePanel": {
                "youtubeCount": len(comments),
                "amazonCount": 0,
                "authScoreAvg": 75,
            },
        }
    except Exception as e:
        return None


async def run_phase4():
    """Run Phase 4."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set")

    print("🎬 PHASE 4: Real YouTube Verdicts (Simplified)")
    print("=" * 80)

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            stmt = select(ProductModel).limit(50)
            result = await session.execute(stmt)
            products = result.scalars().all()

            print(f"Processing {len(products)} products...")
            print("=" * 80)

            success_count = 0

            for i, product in enumerate(products, 1):
                print(f"\n[{i}/{len(products)}] {product.name}")

                # Fetch YouTube comments (synchronous)
                comments = fetch_youtube_comments(product.name)
                if not comments:
                    print(f"  ⏭️  No YouTube comments")
                    continue

                print(f"  📝 {len(comments)} comments found")

                # Generate verdict
                verdict = generate_verdict(product.name, comments)
                if not verdict:
                    print(f"  ❌ Failed to generate verdict")
                    continue

                # Save to DB
                stmt = select(VerdictModel).where(
                    VerdictModel.product_id == product.id
                )
                result = await session.execute(stmt)
                existing = result.scalar()

                if existing:
                    existing.trust_score = verdict["trustScore"]
                    existing.summary = verdict["summary"][:500]
                    existing.pros = verdict["pros"]
                    existing.cons = verdict["cons"]
                    existing.best_for = verdict["bestFor"]
                    existing.avoid_if = verdict["avoidIf"]
                    existing.feature_scores = verdict["featureScores"]
                    existing.spec_tags = verdict["specTags"]
                    existing.confidence_tier = verdict["confidenceTier"]
                    existing.source_count_yt = verdict["sourcePanel"]["youtubeCount"]
                    existing.auth_score_avg = verdict["sourcePanel"]["authScoreAvg"]

                    await session.merge(existing)
                    await session.commit()

                score = verdict["trustScore"]
                summary = verdict["summary"][:50]
                print(f"  ✅ {score}/10 - {summary}...")
                success_count += 1

            print("\n" + "=" * 80)
            print(f"✅ Complete: {success_count} verdicts generated")
            print("=" * 80)

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_phase4())
