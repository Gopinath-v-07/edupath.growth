from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app import models, auth, database
from pydantic import BaseModel
from typing import List, Optional
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

router = APIRouter(prefix="/email", tags=["Email"])


class TopicSummary(BaseModel):
    title: str
    notes: Optional[str] = ""
    order: Optional[int] = 0


class SendReportRequest(BaseModel):
    course_title: str
    topics: List[TopicSummary]
    target_email: Optional[str] = None


def build_html_email(user_name: str, course_title: str, topics: List[TopicSummary]) -> str:
    days_html = ""
    for i, topic in enumerate(topics):
        # Convert simple markdown to lightweight HTML
        notes_html = topic.notes or "No notes available."
        # Replace markdown bold
        import re
        notes_html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', notes_html)
        # Replace markdown headers
        notes_html = re.sub(r'### (.*)', r'<h4 style="color:#1e40af;margin:1rem 0 0.25rem;">\1</h4>', notes_html)
        notes_html = re.sub(r'## (.*)', r'<h3 style="color:#1e40af;margin:1rem 0 0.25rem;">\1</h3>', notes_html)
        # Replace bullet points
        notes_html = re.sub(r'\n[-•] (.*)', r'<li>\1</li>', notes_html)
        notes_html = notes_html.replace('\n', '<br>')

        days_html += f"""
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #2563EB;
                    border-radius:8px;padding:1.5rem;margin-bottom:1rem;">
            <div style="font-size:1.05rem;font-weight:800;color:#1D4ED8;margin-bottom:0.75rem;">
                ▶ {topic.title}
            </div>
            <div style="color:#334155;font-size:0.9rem;line-height:1.7;">
                {notes_html}
            </div>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:Inter,sans-serif;background:#f1f5f9;">
        <div style="max-width:680px;margin:2rem auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);padding:2.5rem;color:white;">
                <div style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;">
                    🎓 Edu<span style="color:#93C5FD;">Path</span>
                </div>
                <h1 style="margin:0 0 0.75rem;font-size:1.6rem;line-height:1.3;color:white;">{course_title}</h1>
                <div>
                    <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);
                                 border-radius:20px;padding:0.3rem 0.8rem;font-size:0.8rem;font-weight:600;margin-right:0.5rem;">
                        📅 {len(topics)} Days
                    </span>
                    <span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);
                                 border-radius:20px;padding:0.3rem 0.8rem;font-size:0.8rem;font-weight:600;">
                        🗓 {max(1, (len(topics)+6)//7)} Weeks
                    </span>
                </div>
            </div>

            <!-- Greeting -->
            <div style="padding:1.5rem 2rem 0;">
                <p style="color:#374151;font-size:0.95rem;">Hi <strong>{user_name}</strong>, here is your personalized AI-generated curriculum report!</p>
            </div>

            <!-- Stats row -->
            <div style="padding:1rem 2rem;display:flex;gap:1rem;">
                <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1rem;">
                    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:0.25rem;">Duration</div>
                    <div style="font-size:1rem;font-weight:700;color:#0F172A;">{len(topics)} Days</div>
                </div>
                <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1rem;">
                    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:0.25rem;">Total Weeks</div>
                    <div style="font-size:1rem;font-weight:700;color:#0F172A;">{max(1, (len(topics)+6)//7)}</div>
                </div>
                <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1rem;">
                    <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#94A3B8;margin-bottom:0.25rem;">Level</div>
                    <div style="font-size:1rem;font-weight:700;color:#0F172A;">Beginner</div>
                </div>
            </div>

            <!-- Curriculum -->
            <div style="padding:1rem 2rem 2rem;">
                <h2 style="font-size:1.1rem;font-weight:800;color:#0F172A;margin:0 0 0.25rem;
                            padding-bottom:0.5rem;border-bottom:2px solid #2563EB;display:inline-block;">
                    Course Curriculum
                </h2>
                <p style="font-size:0.88rem;color:#64748B;margin:0.25rem 0 1.25rem;">Day-by-day learning plan</p>
                {days_html}
            </div>

            <!-- Footer -->
            <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:1rem 2rem;text-align:right;
                        font-size:0.78rem;color:#94A3B8;">
                Generated by EduPath AI · Sent with ❤️
            </div>
        </div>
    </body>
    </html>
    """


@router.post("/send-report")
def send_report(
    body: SendReportRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured. Add SMTP_EMAIL and SMTP_PASSWORD to .env")

    # Use the target email if provided, otherwise fallback to their account email
    recipient = body.target_email if body.target_email else current_user.email
    user_name = current_user.name or "Learner"

    html_content = build_html_email(user_name, body.course_title, body.topics)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"📚 Your Learning Plan: {body.course_title}"
    msg["From"] = f"EduPath AI <{SMTP_EMAIL}>"
    msg["To"] = recipient

    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, recipient, msg.as_string())
        return {"success": True, "message": f"Report sent to {recipient}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/send-pdf")
async def send_pdf_report(
    file: UploadFile = File(...),
    course_title: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured. Add SMTP_EMAIL and SMTP_PASSWORD to .env")

    recipient = current_user.email
    user_name = current_user.name or "Learner"

    # Read the PDF generated by the frontend
    pdf_bytes = await file.read()

    msg = MIMEMultipart()
    msg["Subject"] = f"📚 Your Personalize Curriculum: {course_title}"
    msg["From"] = f"EduPath AI <{SMTP_EMAIL}>"
    msg["To"] = recipient

    # Add body text
    body = f"Hi {user_name},\n\nHere is your requested AI-generated curriculum for: {course_title}.\n\nPlease find the PDF attached.\n\nHappy Learning!\nEduPath AI Team"
    msg.attach(MIMEText(body, "plain"))

    # Attach the PDF
    pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    pdf_attachment.add_header("Content-Disposition", f"attachment; filename=Curriculum_Report.pdf")
    msg.attach(pdf_attachment)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, recipient, msg.as_string())
        return {"success": True, "message": f"Report sent to {recipient}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

