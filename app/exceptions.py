from fastapi import HTTPException

class SummarizationError(HTTPException):
    def __init__(self, detail="Error during summarization"):
        super().__init__(status_code=500, detail=detail)

class FileUploadError(HTTPException):
    def __init__(self, detail="File processing failed"):
        super().__init__(status_code=400, detail=detail)
