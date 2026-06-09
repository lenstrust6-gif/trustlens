import asyncio
import logging
from groq import Groq
from backend.config import settings

logger = logging.getLogger(__name__)

# Initialize Groq client
groq_client = Groq(api_key=settings.groq_api_key)


async def groq_chat(prompt: str, model: str = "gemma-7b-it") -> str:
    """
    Call Groq Gemma via chat completion.

    Args:
        prompt: Full prompt text
        model: Groq model name (default: Gemma 7B)

    Returns:
        Raw response string
    """
    if not settings.groq_api_key:
        logger.warning("Groq API key not configured")
        return ""

    try:
        # Note: groq-python doesn't have async yet, so we wrap in a lambda
        def _call():
            return groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048,
            )

        # Run sync call in executor to avoid blocking
        loop = asyncio.get_event_loop()
        message = await loop.run_in_executor(None, _call)
        return message.choices[0].message.content

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return ""
