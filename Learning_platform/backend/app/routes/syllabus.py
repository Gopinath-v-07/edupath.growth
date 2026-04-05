from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from typing import Optional
from sqlalchemy.orm import Session
from app import models, auth, database
from app.services import pdf_parser, s3_service

router = APIRouter(
    prefix="/upload",
    tags=["Syllabus Upload"]
)

@router.post("/syllabus")
async def upload_syllabus(
    goal: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    s3_url = None
    extracted_text = ""
    
    if file:
        s3_url = s3_service.upload_to_s3(file, file.filename)
        if file.filename.endswith('.pdf'):
            try:
                extracted_text = await pdf_parser.extract_text_from_pdf(file)
            except Exception:
                extracted_text = ""

    course = models.Course(
        user_id=current_user.id,
        title=goal,
        extracted_text=extracted_text,
        s3_url=s3_url
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return {
        "course_id": course.id,
        "extracted_length": len(extracted_text),
        "s3_url": s3_url
    }
