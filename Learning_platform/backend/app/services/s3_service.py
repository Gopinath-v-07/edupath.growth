import boto3
import os
from fastapi import UploadFile
import uuid
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def upload_to_s3(file: UploadFile, original_filename: str) -> str:
    if not AWS_ACCESS_KEY_ID or not AWS_S3_BUCKET:
        # Fallback to local storage
        if not os.path.exists("uploads"):
            os.makedirs("uploads")
        filename = f"{uuid.uuid4()}_{original_filename}"
        with open(f"uploads/{filename}", "wb") as f:
            f.write(file.file.read())
        return f"http://localhost:8000/uploads/{filename}"

    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    unique_filename = f"{uuid.uuid4()}_{original_filename}"
    
    try:
        s3_client.upload_fileobj(
            file.file,
            AWS_S3_BUCKET,
            unique_filename,
            ExtraArgs={"ContentType": "application/pdf"}
        )
        return f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None
