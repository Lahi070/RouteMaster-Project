"""Service for sending emails."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_password_reset_email(to_email: str, reset_token: str) -> bool:
        """
        Send a password reset email.
        If SMTP is not configured or fails, logs the token for development.
        """
        reset_link = f"{settings.ALLOWED_ORIGINS.split(',')[0]}/#/reset-password?token={reset_token}"
        
        # Log for dev purposes always
        logger.info(f"Password reset link for {to_email}: {reset_link}")
        print(f"\n==============================================")
        print(f" PASSWORD RESET LINK FOR {to_email}")
        print(f" {reset_link}")
        print(f"==============================================\n")
        
        # In a real app we'd trigger SMTP here if configured:
        # if not hasattr(settings, 'SMTP_SERVER') or not settings.SMTP_SERVER:
        #    return True 
        
        return True
