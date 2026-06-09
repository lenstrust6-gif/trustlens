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
        Fetch YouTube comments for a product (multi-language support).
        For India: fetches both Hindi and English comments.
        Returns list of comments with text, video_id, video_title, author, like_count, published_at.
        """
        if not settings.youtube_api_key:
            logger.warning("YouTube API key not configured")
            return []

        # Step 1: Search for videos in all relevant languages
        languages = ["hi", "en"] if locale == "in" else ["en"]
        video_ids = []
        for lang in languages:
            lang_videos = await self._search_videos(product_name, locale, lang)
            video_ids.extend(lang_videos)
            if len(video_ids) >= 10:  # Cap at 10 videos total
                video_ids = video_ids[:10]
                break

        if not video_ids:
            logger.info(f"YouTube: no videos found for '{product_name}'")
            return []

        # Step 2: Fetch comments from each video
        comments = []
        for video_id, video_title in video_ids:
            video_comments = await self._fetch_video_comments(video_id, video_title)
            comments.extend(video_comments)
            if len(comments) >= settings.youtube_fetch_limit:
                comments = comments[: settings.youtube_fetch_limit]
                break

        logger.info(f"YouTube: fetched {len(comments)} comments from {len(video_ids)} videos")
        return comments

    async def _search_videos(self, product_name: str, locale: str, lang: str = None) -> list[tuple[str, str]]:
        """Search for videos in specified language and return (video_id, title) tuples."""
        if not lang:
            lang = "hi" if locale == "in" else "en"

        params = {
            "q": product_name,
            "type": "video",
            "maxResults": 5,
            "relevanceLanguage": lang,
            "key": settings.youtube_api_key,
            "order": "relevance",
        }

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://trustlens.in/",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.SEARCH_URL, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                items = data.get("items", [])
                video_ids = [
                    (item["id"]["videoId"], item["snippet"]["title"])
                    for item in items
                    if item.get("id", {}).get("videoId")
                ]
                logger.info(f"YouTube: found {len(video_ids)} videos for '{product_name}'")
                return video_ids
        except httpx.TimeoutException:
            logger.error(f"YouTube search timeout for '{product_name}'")
            return []
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                logger.error("YouTube quota exceeded (403)")
            else:
                logger.error(f"YouTube search error: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"YouTube search error: {e}")
            return []

    async def _fetch_video_comments(self, video_id: str, video_title: str) -> list[dict]:
        """Fetch comments for a specific video."""
        params = {
            "videoId": video_id,
            "maxResults": 100,
            "textFormat": "plainText",
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
