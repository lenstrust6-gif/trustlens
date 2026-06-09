import httpx
import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class YouTubeFetcher:
    """YouTube Data API v3 comment fetcher."""

    SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
    COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"

    async def fetch_comments(self, product_name: str, locale: str) -> list[dict]:
        """
        Fetch YouTube comments for a product (optimized for quota).
        For India: tries English first, then Hindi only if needed.
        Returns list of comments with text, video_id, video_title, author, like_count, published_at.
        """
        logger.info(f"[YouTube Pipeline] Starting fetch for: {product_name} | Locale: {locale}")

        if not settings.youtube_api_key:
            logger.error("[YouTube Pipeline] ERROR: YouTube API key not configured!")
            return []

        # Step 1: Search for videos (try English first to save quota on Hindi searches)
        logger.info(f"[YouTube Pipeline] Searching English videos for '{product_name}'...")
        video_ids = await self._search_videos(product_name, locale, "en")
        logger.info(f"[YouTube Pipeline] English search returned {len(video_ids)} videos")

        # Only search Hindi if English returned < 2 videos (India locale only)
        if locale == "in" and len(video_ids) < 2:
            logger.info(f"[YouTube Pipeline] Searching Hindi videos for '{product_name}'...")
            hindi_videos = await self._search_videos(product_name, locale, "hi")
            video_ids.extend(hindi_videos)
            logger.info(f"[YouTube Pipeline] Hindi search returned {len(hindi_videos)} videos | Total: {len(video_ids)}")

        if not video_ids:
            logger.warning(f"[YouTube Pipeline] NO videos found for '{product_name}' - ending pipeline")
            return []

        # Step 2: Fetch comments from first 3-5 videos only (quota optimization)
        max_videos = 3
        comments = []
        for video_id, video_title in video_ids[:max_videos]:
            video_comments = await self._fetch_video_comments(video_id, video_title)
            comments.extend(video_comments)
            if len(comments) >= settings.youtube_fetch_limit:
                comments = comments[: settings.youtube_fetch_limit]
                break

        logger.info(f"YouTube: fetched {len(comments)} comments from {len(video_ids[:max_videos])} videos")
        return comments

    async def _search_videos(self, product_name: str, locale: str, lang: str = None) -> list[tuple[str, str]]:
        """Search for videos in specified language with enhanced parameters."""
        if not lang:
            lang = "hi" if locale == "in" else "en"

        # Build search query with review keywords
        search_query = f"{product_name} review"
        if lang == "hi":
            search_query = f"{product_name} review test unboxing"

        params = {
            "q": search_query,
            "type": "video",
            "maxResults": 5,  # Optimized: fetch only 5 videos (top results are usually best)
            "relevanceLanguage": lang,
            "regionCode": "IN" if locale == "in" else "US",  # Focus on region
            "key": settings.youtube_api_key,
            "order": "viewCount",  # Popular reviews first
            "safeSearch": "strict",  # Filter inappropriate content
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://trustlens.in/",
            }
            logger.info(f"[YouTube Search] Query: '{search_query}' | Lang: {lang} | Region: {params.get('regionCode')}")

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.SEARCH_URL, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()

                # Debug API response
                logger.info(f"[YouTube API] Status: {response.status_code} | Items found: {len(data.get('items', []))}")

                items = data.get("items", [])
                video_ids = [
                    (item["id"]["videoId"], item["snippet"]["title"])
                    for item in items
                    if item.get("id", {}).get("videoId")
                ]
                logger.info(f"[YouTube Search] Found {len(video_ids)} videos for '{product_name}'")
                return video_ids
        except httpx.TimeoutException:
            logger.error(f"[YouTube Error] Search timeout for '{product_name}'")
            return []
        except httpx.HTTPStatusError as e:
            logger.error(f"[YouTube Error] HTTP {e.response.status_code} | Body: {e.response.text[:200]}")
            if e.response.status_code == 403:
                logger.error("[YouTube Error] QUOTA EXCEEDED - Request higher quota in Google Cloud Console")
            return []
        except Exception as e:
            logger.error(f"[YouTube Error] Exception: {type(e).__name__} - {str(e)}")
            return []

    async def _fetch_video_comments(self, video_id: str, video_title: str) -> list[dict]:
        """Fetch top comments for a specific video."""
        params = {
            "videoId": video_id,
            "maxResults": 100,
            "textFormat": "plainText",
            "order": "relevance",  # Fetch most relevant (highest rated) comments
            "key": settings.youtube_api_key,
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://trustlens.in/",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.COMMENTS_URL, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                items = data.get("items", [])

                comments = []
                for item in items:
                    snippet = item.get("snippet", {})
                    top_level = snippet.get("topLevelComment", {}).get("snippet", {})

                    comment = {
                        "text": top_level.get("textDisplay", ""),
                        "video_id": video_id,
                        "video_title": video_title,
                        "author": top_level.get("authorDisplayName", ""),
                        "like_count": top_level.get("likeCount", 0),
                        "published_at": top_level.get("publishedAt", ""),
                        "source": "youtube",
                    }
                    comments.append(comment)

                logger.info(f"YouTube: fetched {len(comments)} comments from video {video_id}")
                return comments
        except httpx.TimeoutException:
            logger.error(f"YouTube comments timeout for video {video_id}")
            return []
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                logger.error("YouTube quota exceeded (403)")
            else:
                logger.error(f"YouTube comments error: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"YouTube comments error: {e}")
            return []


youtube_fetcher = YouTubeFetcher()
