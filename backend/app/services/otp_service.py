import os
import asyncio
import smtplib
import urllib.request
import urllib.parse
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple
from app.core.logging import get_logger

logger = get_logger("pitchmind.otp")

# Standard PitchMind Premium HTML email template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PitchMind Verification Code</title>
  <style>
    body {{
      background-color: #030712;
      color: #f3f4f6;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .email-container {{
      max-width: 600px;
      margin: 40px auto;
      background-color: #090e17;
      border: 1px solid #111c2e;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.7);
    }}
    .header-logo {{
      text-align: center;
      margin-bottom: 30px;
    }}
    .wicket-brand {{
      display: inline-block;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }}
    .brand-pitch {{ color: #d1d5db; }}
    .brand-mind {{ color: #0fa47f; }}
    .divider {{
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #111c2e 50%, transparent 100%);
      margin: 24px 0;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }}
    .intro {{
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 30px;
    }}
    .otp-card {{
      background: linear-gradient(135deg, #050811 0%, #0c1424 100%);
      border: 1px solid rgba(14, 165, 233, 0.15);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
      box-shadow: inset 0 0 15px rgba(14, 165, 233, 0.05);
    }}
    .otp-code {{
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 36px;
      font-weight: 800;
      color: #0ea5e9;
      letter-spacing: 8px;
      margin: 10px 0;
      text-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
    }}
    .otp-expiration {{
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .tip-box {{
      border-left: 3px solid #0fa47f;
      padding-left: 16px;
      margin: 28px 0;
    }}
    .tip-title {{
      font-size: 12px;
      font-weight: 700;
      color: #0fa47f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .tip-content {{
      font-size: 13px;
      color: #f3f4f6;
      font-style: italic;
      margin-top: 4px;
    }}
    .footer {{
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
      margin-top: 40px;
      border-top: 1px solid #111c2e;
      padding-top: 20px;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-logo">
      <div class="wicket-brand">
        <span class="brand-pitch">Pitch</span><span class="brand-mind">Mind</span>
      </div>
    </div>
    
    <div class="greeting">Secure OTP Verification Code</div>
    <div class="intro">
      Welcome to PitchMind Elite Cricket Biomechanics Intelligence! To authenticate your secure session and access your cricket netting video analysis, please input the following 6-digit verification code:
    </div>
    
    <div class="otp-card">
      <div class="otp-code">{otp_code}</div>
      <div class="otp-expiration">Expires in 5 minutes</div>
    </div>
    
    <div class="tip-box">
      <div class="tip-title">Biomechanical Pro Tip</div>
      <div class="tip-content">
        "Keep your lead shoulder pointing towards the target and lead elbow high through the swing arc for maximum power."
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      This is an automated security transmission. If you did not request this code, please ignore this email.<br>
      © 2026 PitchMind Biomechanics Engineering. All Rights Reserved.
    </div>
  </div>
</body>
</html>
"""

def _send_smtp_email_sync(to_email: str, otp_code: str) -> bool:
    """Synchronous implementation of SMTP email delivery."""
    host = os.getenv("SMTP_HOST")
    port_str = os.getenv("SMTP_PORT", "587")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", "noreply@pitchmind.com")
    use_tls_str = os.getenv("SMTP_USE_TLS", "True")

    if not host or not username or not password:
        logger.warning("SMTP settings missing. Falling back to local terminal/bypass verification.")
        return False

    try:
        port = int(port_str)
        use_tls = use_tls_str.lower() in ("true", "1", "yes")

        # Construct multi-part email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"PitchMind Secure OTP: {otp_code}"
        msg["From"] = from_email
        msg["To"] = to_email

        # Plaintext Fallback
        text_body = f"PitchMind Secure OTP: {otp_code}\n\nExpires in 5 minutes."
        html_body = HTML_TEMPLATE.format(otp_code=otp_code)

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Send via smtplib
        logger.info(f"Connecting to SMTP Server {host}:{port}...")
        if port == 465:
            # SSL Connection
            with smtplib.SMTP_SSL(host, port) as server:
                server.login(username, password)
                server.send_message(msg)
        else:
            # Standard TLS connection
            with smtplib.SMTP(host, port) as server:
                if use_tls:
                    server.starttls()
                server.login(username, password)
                server.send_message(msg)

        logger.info(f"Successfully sent email OTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"SMTP delivery failed to {to_email}: {str(e)}")
        return False

def _send_twilio_sms_sync(to_number: str, otp_code: str) -> bool:
    """Synchronous implementation of Twilio SMS delivery."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")

    if not account_sid or not auth_token or not from_number:
        logger.warning("Twilio settings missing. Falling back to local terminal/bypass verification.")
        return False

    try:
        # Standardize number format roughly if needed
        target_number = to_number.strip()
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        
        payload = {
            "To": target_number,
            "From": from_number,
            "Body": f"PitchMind Secure OTP Code: {otp_code}. Code expires in 5 minutes. Let's start netting!"
        }
        
        data = urllib.parse.urlencode(payload).encode("utf-8")
        
        req = urllib.request.Request(url, data=data, method="POST")
        
        # Add basic authorization header
        auth_str = f"{account_sid}:{auth_token}"
        auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        req.add_header("Authorization", f"Basic {auth_b64}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        
        logger.info(f"Posting SMS request to Twilio API...")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read()
            logger.info(f"Successfully sent Twilio SMS OTP to {to_number}")
            return True
    except Exception as e:
        logger.error(f"Twilio SMS delivery failed to {to_number}: {str(e)}")
        return False

class OtpService:
    """
    Production-grade OTP Delivery Service supporting automatic detection,
    non-blocking SMTP, lightweight Twilio SMS gateways, and local development fallbacks.
    """
    
    @staticmethod
    async def send_otp(target: str, otp_code: str, method: str) -> Tuple[bool, str]:
        """
        Sends the 6-digit OTP code to the target (email or phone number) asynchronously.
        Returns a tuple: (success: bool, status_message: str)
        """
        loop = asyncio.get_event_loop()
        
        config_method = os.getenv("PITCHMIND_OTP_METHOD", "auto").lower()
        
        # Resolve target channel
        if method == "email":
            # If explicit smtp configuration or auto
            smtp_configured = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USERNAME"))
            
            if config_method == "smtp" or (config_method == "auto" and smtp_configured):
                # Dispatch real email in thread pool
                success = await loop.run_in_executor(None, _send_smtp_email_sync, target, otp_code)
                if success:
                    return True, "Secure verification email sent successfully."
                else:
                    return False, "Failed to deliver email. Reverting to developer fallback codes."
            else:
                logger.info(f"Email configured to bypass real send for target={target}. Outputting code to server logs.")
                return True, "Logged to terminal console logs (development fallback)."
                
        elif method == "phone":
            # If explicit twilio configuration or auto
            twilio_configured = bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"))
            
            if config_method == "twilio" or (config_method == "auto" and twilio_configured):
                # Dispatch real SMS in thread pool
                success = await loop.run_in_executor(None, _send_twilio_sms_sync, target, otp_code)
                if success:
                    return True, "Secure verification text message sent successfully."
                else:
                    return False, "Failed to deliver text message. Reverting to developer fallback codes."
            else:
                logger.info(f"Phone configured to bypass real send for target={target}. Outputting code to server logs.")
                return True, "Logged to terminal console logs (development fallback)."
                
        return False, "Unknown auth method or configuration channel."
