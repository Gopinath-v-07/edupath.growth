import PyPDF2
from fastapi import UploadFile
import io

async def extract_text_from_pdf(file: UploadFile) -> str:
    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    # Reset file pointer if needed, but not necessary since we read it all
    await file.seek(0)
    return text
