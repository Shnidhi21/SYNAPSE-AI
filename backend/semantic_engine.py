import re
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(MODEL_NAME)


def split_into_chunks(text, chunk_size=500, overlap=100):
    text = text.strip()

    if not text:
        return []

    if overlap >= chunk_size:
        raise ValueError("Overlap must be smaller than chunk size")

    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        if len(current_chunk) + len(sentence) + 1 <= chunk_size:
            current_chunk = (
                f"{current_chunk} {sentence}".strip()
            )
        else:
            if current_chunk:
                chunks.append(current_chunk)

            if len(sentence) <= chunk_size:
                current_chunk = sentence
            else:
                current_chunk = ""

                step = chunk_size - overlap

                for start in range(0, len(sentence), step):
                    piece = sentence[start:start + chunk_size]

                    if piece:
                        chunks.append(piece)

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def prepare_document_chunks(document):
    chunks = []

    for page in document.get("pages", []):
        page_number = page.get("page_number", 1)
        text = page.get("text", "")

        page_chunks = split_into_chunks(text)

        for index, chunk in enumerate(page_chunks):
            chunks.append({
                "chunk_id": f"page_{page_number}_chunk_{index + 1}",
                "page_number": page_number,
                "text": chunk
            })

    return chunks


def semantic_search(query, document, top_k=5):
    if not query or not query.strip():
        raise ValueError("Search query cannot be empty")

    chunks = prepare_document_chunks(document)

    if not chunks:
        return {
            "query": query,
            "total_chunks": 0,
            "total_results": 0,
            "results": []
        }

    model = get_embedding_model()

    passages = [chunk["text"] for chunk in chunks]

    document_embeddings = model.encode(
        passages,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False
    )[0]

    similarities = np.dot(
        document_embeddings,
        query_embedding
    )

    ranked_indices = np.argsort(similarities)[::-1]

    results = []

    for index in ranked_indices[:top_k]:
        chunk = chunks[int(index)]

        results.append({
            "chunk_id": chunk["chunk_id"],
            "page_number": chunk["page_number"],
            "text": chunk["text"],
            "similarity_score": round(
                float(similarities[index]),
                4
            )
        })

    return {
        "query": query,
        "total_chunks": len(chunks),
        "total_results": len(results),
        "results": results
    }