import PyPDF2
import sys

def main():
    try:
        with open("sample_summary_pdf.pdf", 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            print("PDF CONTENT PREVIEW:")
            print(text[:3000])
    except Exception as e:
        print("Error reading PDF:", e)

if __name__ == "__main__":
    main()
