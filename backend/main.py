import logging

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from backend.document_processor import extract_pdf_text
from backend.nlp_engine import extract_entities
from backend.relationship_engine import extract_relationships
from backend.graph_engine import build_knowledge_graph
from backend.semantic_engine import semantic_search
from backend.investigation_engine import investigate
from backend.database import (
    initialize_database,
    save_document,
    get_document,
    list_documents
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("synapse_ai")

app = FastAPI(
    title="SYNAPSE AI",
    description="Explainable Graph-Enhanced AI Investigation Platform",
    version="1.0.0"
)

initialize_database()


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)


class InvestigationRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=20)


@app.get("/")
def home():
    return {
        "project": "SYNAPSE AI",
        "status": "ONLINE",
        "message": "Intelligence Engine Initialized"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "system": "SYNAPSE AI Backend"
    }


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty"
        )

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 10 MB"
        )

    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF"
        )

    try:
        result = extract_pdf_text(file_bytes)

        for page in result["pages"]:
            page["nlp_analysis"] = extract_entities(page["text"])
            page["relationship_analysis"] = extract_relationships(
                page["text"],
                page["page_number"]
            )

        if result["total_characters"] == 0:
            return {
                "filename": file.filename,
                "status": "NO_TEXT_DETECTED",
                "message": "PDF opened successfully, but no extractable text was found. OCR may be required.",
                "document": result
            }

        saved_document = save_document(file.filename, result)

        return {
            "document_id": saved_document["document_id"],
            "filename": file.filename,
            "uploaded_at": saved_document["uploaded_at"],
            "status": "PROCESSED",
            "message": "Document processed, analyzed, and saved successfully",
            "document": result
        }

    except Exception as e:
        logger.exception("Document processing failed: %s", type(e).__name__)

        raise HTTPException(
            status_code=400,
            detail="Unable to process PDF document"
        ) from e


@app.get("/documents")
def get_all_documents():
    documents = list_documents()

    return {
        "status": "SUCCESS",
        "total_documents": len(documents),
        "documents": documents
    }


@app.get("/documents/{document_id}/graph")
def get_document_graph(document_id: str):
    document = get_document(document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    graph = build_knowledge_graph(document["document_data"])

    return {
        "status": "SUCCESS",
        "document_id": document_id,
        "filename": document["filename"],
        "graph": graph
    }


@app.post("/documents/{document_id}/search")
def search_document(document_id: str, request: SearchRequest):
    document = get_document(document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    try:
        results = semantic_search(
            query=request.query,
            document=document["document_data"],
            top_k=request.top_k
        )

        return {
            "status": "SUCCESS",
            "document_id": document_id,
            "filename": document["filename"],
            "search": results
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        ) from e


@app.post("/documents/{document_id}/investigate")
def investigate_document(
    document_id: str,
    request: InvestigationRequest
):
    document = get_document(document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    try:
        result = investigate(
            query=request.query,
            document=document["document_data"],
            top_k=request.top_k
        )

        return {
            "status": "SUCCESS",
            "document_id": document_id,
            "filename": document["filename"],
            "investigation": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        ) from e


@app.get("/documents/{document_id}")
def get_document_by_id(document_id: str):
    document = get_document(document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "status": "SUCCESS",
        "document": document
    }