import pytest
from app.core.config import settings
from app.services.rag_service import RAGService

def test_rag_indexing_and_retrieval():
    doc_path = settings.SAMPLES_DIR / "ai_architecture_guide.txt"
    assert doc_path.exists()

    doc_id = "test-rag-doc-1"
    num_chunks = RAGService.index_document(doc_id, "AI Architecture Guide", doc_path)
    assert num_chunks > 0

    # Query matching content
    results = RAGService.retrieve_relevant_chunks("What is the embedding architecture?", top_k=2, target_doc_id=doc_id)
    assert len(results) > 0
    top_chunk = results[0]
    assert "embedding" in top_chunk.text_content.lower() or "vector" in top_chunk.text_content.lower()
    assert top_chunk.page_number >= 1

@pytest.mark.asyncio
async def test_rag_unanswerable_query():
    doc_path = settings.SAMPLES_DIR / "ai_architecture_guide.txt"
    doc_id = "test-rag-doc-2"
    RAGService.index_document(doc_id, "Guide", doc_path)

    # Completely out of context query
    res = await RAGService.answer_rag_query("What is the average wingspan of an African swallow?", top_k=2, target_doc_id=doc_id)
    assert res.query is not None
