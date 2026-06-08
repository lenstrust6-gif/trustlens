"""Phase 4: Real YouTube verdicts generator (simplified)."""
import asyncio
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import httpx
from groq import Groq

from backend.db.models import ProductModel, VerdictModel

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

async def fetch_youtube_comments(product_name: str, limit: int = 50) -> list[str]:
    """Fetch YouTube comments for a product."""
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
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get videos
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params=search_params,
                headers=headers,
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
                try:
                    comment_params = {
                        "videoId": video_id,
                        "maxResults": 20,
                        "textFormat": "plainText",
                        "key": api_key,
                    }

                    comment_response = await client.get(
                        "https://www.googleapis.com/youtube/v3/commentThreads",
                        params=comment_params,
                        headers=headers,
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
                            if len(comments) >= limit:
                                return comments
                except Exception as e:
                    continue

    except Exception as e:
        pass

    return comments


def generate_verdict_with_groq(product_name: str, comments: list[str]) -> dict | None:
    """Generate verdict from comments using Groq."""
    if not comments:
        return None

    # Combine comments for analysis
    comments_text = "\n".join(comments[:20])  # Use top 20 comments

    prompt = f"""Analyze these YouTube comments about the product "{product_name}" and generate a structured review verdict.

COMMENTS:
{comments_text}

Generate a JSON verdict with:
- trustScore (0-10): Overall quality/authenticity score
- summary (80-120 words): Product verdict summary
- pros (list): Key positive points
- cons (list): Key negative points
- bestFor (list): Best use cases
- avoidIf (list): When to avoid
- featureScores (dict): Feature ratings (e.g., {{"battery": 8.5, "sound": 9.0}})
- specTags (dict): Key specs mentioned
- confidenceTier: "established" or "emerging" based on comment volume

Return ONLY valid JSON, no markdown or extra text."""

    try:
        message = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )

        response_text = message.content[0].text.strip()

        # Try to extract JSON from response
        try:
            verdict = json.loads(response_text)
        except json.JSONDecodeError:
            # If response has markdown code blocks, extract the JSON
            if "```json" in response_text:
                verdict = json.loads(
                    response_text.split("```json")[1].split("```")[0].strip()
                )
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
        print(f"  Groq error: {e}")
        return None


async def run_phase4():
    """Run Phase 4: Generate real YouTube verdicts."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set")

    print("🎬 PHASE 4: Real YouTube Verdict Generation")
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
            skip_count = 0

            for i, product in enumerate(products, 1):
                print(f"\n[{i}/{len(products)}] {product.name}")

                # Fetch YouTube comments
                comments = await fetch_youtube_comments(product.name)
                if not comments:
                    print(f"  ⏭️  No YouTube comments found")
                    skip_count += 1
                    continue

                print(f"  📝 Found {len(comments)} comments")

                # Generate verdict
                verdict = generate_verdict_with_groq(product.name, comments)
                if not verdict:
                    print(f"  ❌ Failed to generate verdict")
                    skip_count += 1
                    continue

                # Save to database
                stmt = select(VerdictModel).where(
                    VerdictModel.product_id == product.id
                )
                result = await session.execute(stmt)
                existing = result.scalar()

                if existing:
                    existing.trust_score = verdict["trustScore"]
                    existing.summary = verdict["summary"]
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

                print(f"  ✅ Verdict: {verdict['trustScore']}/10 - {verdict['summary'][:60]}...")
                success_count += 1

            print("\n" + "=" * 80)
            print(f"✅ Complete: {success_count} succeeded, {skip_count} skipped")
            print("=" * 80)

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_phase4())
