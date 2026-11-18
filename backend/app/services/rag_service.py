import os
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

# Text Extraction
try:
    import pymupdf as fitz
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

# Embeddings & Vector Search
try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except (ImportError, OSError, Exception):
    HAS_ST = False

try:
    import faiss
    HAS_FAISS = True
except (ImportError, OSError, Exception):
    HAS_FAISS = False

from app.core.config import settings
from app.services.ollama_service import OllamaService
from app.schemas.schemas import SourceChunkOut, RAGQueryResponse

class RAGService:
    _embedder = None
    _vector_indices: Dict[str, Any] = {}
    _chunk_metadata: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def get_embedder(cls):
        if cls._embedder is None and HAS_ST:
            try:
                cls._embedder = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            except Exception as e:
                print(f"Failed to load SentenceTransformer: {e}")
                cls._embedder = None
        return cls._embedder

    @classmethod
    def extract_text_from_file(cls, file_path: str | Path) -> List[Dict[str, Any]]:
        path = Path(file_path)
        pages_content = []

        if path.suffix.lower() == ".pdf":
            if HAS_PYMUPDF:
                doc = fitz.open(str(path))
                for i, page in enumerate(doc):
                    text = page.get_text("text").strip()
                    if text:
                        pages_content.append({"page_number": i + 1, "text": text})
                doc.close()
            else:
                pages_content.append({"page_number": 1, "text": "PyMuPDF not available to parse PDF."})
        else:
            # Plain text, markdown, csv, etc.
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read().strip()
                pages_content.append({"page_number": 1, "text": raw_text})

        return pages_content

    @classmethod
    def chunk_document(
        cls,
        pages_content: List[Dict[str, Any]],
        chunk_size: int = 500,
        chunk_overlap: int = 60
    ) -> List[Dict[str, Any]]:
        chunks = []
        global_chunk_idx = 0

        for p in pages_content:
            text = p["text"]
            page_num = p["page_number"]
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                # Adjust end to nearest whitespace if not at the end
                if end < len(text):
                    last_space = text.rfind(" ", start, end)
                    if last_space > start + chunk_size // 2:
                        end = last_space
                
                chunk_str = text[start:end].strip()
                if chunk_str:
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "text": chunk_str
                    })
                    global_chunk_idx += 1
                
                start = end - chunk_overlap if end < len(text) else len(text)

        return chunks

    @classmethod
    def index_document(
        cls,
        doc_id: str,
        doc_title: str,
        file_path: str | Path
    ) -> int:
        pages = cls.extract_text_from_file(file_path)
        chunks = cls.chunk_document(pages)
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        embedder = cls.get_embedder()

        if embedder is not None and HAS_FAISS:
            embeddings = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            dim = embeddings.shape[1]
            index = faiss.IndexFlatIP(dim)  # Inner Product on normalized vectors = Cosine Similarity
            index.add(embeddings.astype(np.float32))
            cls._vector_indices[doc_id] = index
        else:
            # Fallback simple bag-of-words / substring index if FAISS or ST is absent
            cls._vector_indices[doc_id] = None

        # Store metadata
        meta_list = []
        for c in chunks:
            meta_list.append({
                "document_id": doc_id,
                "document_title": doc_title,
                "chunk_index": c["chunk_index"],
                "page_number": c["page_number"],
                "text": c["text"]
            })
        cls._chunk_metadata[doc_id] = meta_list
        return len(chunks)

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        query: str,
        top_k: int = 4,
        target_doc_id: Optional[str] = None
    ) -> List[SourceChunkOut]:
        embedder = cls.get_embedder()
        results: List[SourceChunkOut] = []

        # Find candidate doc IDs
        doc_ids = [target_doc_id] if target_doc_id and target_doc_id in cls._chunk_metadata else list(cls._chunk_metadata.keys())
        if not doc_ids:
            return results

        if embedder is not None and HAS_FAISS:
            q_emb = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True).astype(np.float32)
            
            for d_id in doc_ids:
                index = cls._vector_indices.get(d_id)
                meta = cls._chunk_metadata.get(d_id, [])
                if index is not None and len(meta) > 0:
                    k = min(top_k, index.ntotal)
                    scores, indices = index.search(q_emb, k)
                    for score, idx in zip(scores[0], indices[0]):
                        if idx >= 0 and idx < len(meta):
                            item = meta[idx]
                            results.append(SourceChunkOut(
                                document_id=item["document_id"],
                                document_title=item["document_title"],
                                page_number=item["page_number"],
                                chunk_index=item["chunk_index"],
                                score=round(float(score), 4),
                                text_content=item["text"]
                            ))
            results.sort(key=lambda x: x.score, reverse=True)
            return results[:top_k]
        else:
            # Lightweight lexical overlap fallback
            q_terms = set(query.lower().split())
            scored = []
            for d_id in doc_ids:
                for item in cls._chunk_metadata.get(d_id, []):
                    c_terms = set(item["text"].lower().split())
                    overlap = len(q_terms.intersection(c_terms))
                    score = overlap / max(len(q_terms), 1)
                    if score > 0:
                        scored.append((score, item))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            for sc, item in scored[:top_k]:
                results.append(SourceChunkOut(
                    document_id=item["document_id"],
                    document_title=item["document_title"],
                    page_number=item["page_number"],
                    chunk_index=item["chunk_index"],
                    score=round(float(sc), 4),
                    text_content=item["text"]
                ))
            return results

    @classmethod
    async def answer_rag_query(
        cls,
        query: str,
        top_k: int = 4,
        target_doc_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> RAGQueryResponse:
        start_t = time.time()
        sources = cls.retrieve_relevant_chunks(query, top_k, target_doc_id)

        if not sources:
            return RAGQueryResponse(
                query=query,
                answer="I couldn't find this information in the provided documents.",
                sources=[],
                model_used="None",
                inference_time_sec=round(time.time() - start_t, 3)
            )

        # Construct Grounded Prompt
        context_str = "\n\n".join([
            f"[Source: {s.document_title}, Page: {s.page_number}]:\n{s.text_content}"
            for s in sources
        ])

        system_prompt = (
            "You are a helpful and strictly grounded Document Intelligence assistant. "
            "Answer the user query based ONLY on the provided document excerpts. "
            "Do NOT extrapolate or hallucinate facts not present in the context. "
            "If the answer cannot be found in the uploaded documents, reply with exactly: "
            "'I couldn't find this information in the provided documents.' "
            "Always cite the source title and page number where appropriate."
        )

        user_prompt = f"Context:\n{context_str}\n\nQuestion: {query}\n\nAnswer:"

        gen_result = await OllamaService.generate_response(
            prompt=user_prompt,
            system_prompt=system_prompt,
            model=model
        )

        answer_text = gen_result.get("response", "")
        if not gen_result.get("is_local_ollama"):
            # If Ollama is offline, provide synthesis directly from retrieved chunks
            answer_text = (
                f"Retrieved {len(sources)} relevant document excerpt(s):\n\n" + 
                "\n\n".join([f"• (Page {s.page_number}): \"{s.text_content[:200]}...\"" for s in sources[:2]]) +
                "\n\n(Local Ollama engine is offline. Start 'ollama run llama3.2' for full generative synthesis.)"
            )

        return RAGQueryResponse(
            query=query,
            answer=answer_text,
            sources=sources,
            model_used=gen_result.get("model", "ollama-local"),
            inference_time_sec=round(time.time() - start_t, 3)
        )
