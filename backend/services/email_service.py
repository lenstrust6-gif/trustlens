"""Email service for sending notifications via Resend API."""
import httpx
import logging
from backend.config import settings
from typing import Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Resend API."""

    RESEND_API_URL = "https://api.resend.com/emails"
    RESEND_FROM = "verdicts@trustlens.in"

    @staticmethod
    async def send_verdict_notification(
        recipient_email: str,
        product_name: str,
        verdict_summary: str,
        trust_score: float,
        verdict_url: str,
    ) -> Optional[str]:
        """Send verdict ready notification email."""
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not configured")
            return None

        subject = f"Your TrustLens verdict for {product_name} is ready! 🎉"

        html_body = f"""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Your Verdict is Ready!</h1>
                </div>

                <div style="background: #f9f9f9; padding: 40px 20px; border-radius: 0 0 12px 12px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        Hi there! We've analyzed reviews for <strong>{product_name}</strong> and created your TrustLens verdict.
                    </p>

                    <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="margin: 0; color: #999; font-size: 14px;">Trust Score</p>
                                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #667eea;">{trust_score}/10</p>
                            </div>
                            <div style="font-size: 48px;">⭐</div>
                        </div>
                    </div>

                    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                        <strong>Summary:</strong><br/>
                        {verdict_summary[:200]}...
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verdict_url}" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                            View Full Verdict →
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2026 TrustLens. All rights reserved.<br/>
                        <a href="{{unsubscribe_url}}" style="color: #667eea; text-decoration: none;">Unsubscribe from notifications</a>
                    </p>
                </div>
            </body>
        </html>
        """

        return await EmailService._send_via_resend(
            to=recipient_email,
            subject=subject,
            html=html_body,
        )

    @staticmethod
    async def _send_via_resend(
        to: str,
        subject: str,
        html: str,
        from_addr: str = RESEND_FROM,
    ) -> Optional[str]:
        """Send email via Resend API. Returns email ID on success, None on failure."""
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not configured")
            return None

        headers = {
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "from": from_addr,
            "to": to,
            "subject": subject,
            "html": html,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    EmailService.RESEND_API_URL,
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    email_id = data.get("id")
                    logger.info(f"Email sent successfully: {email_id}")
                    return email_id
                else:
                    error_msg = response.text
                    logger.error(f"Resend API error: {response.status_code} - {error_msg}")
                    return None

        except httpx.TimeoutException:
            logger.error("Resend API request timed out")
            return None
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return None
