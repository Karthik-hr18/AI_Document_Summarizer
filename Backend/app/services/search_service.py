"""
PostgreSQL full-text search for documents and summaries.
Uses to_tsvector + plainto_tsquery + ts_rank.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app import models

TS_LANG = "english"
MAX_RESULTS = 50


def _ts_query(query: str):
    """Build plainto_tsquery() expression."""
    return func.plainto_tsquery(TS_LANG, query)


def search_documents(db: Session, query: str, limit: int = MAX_RESULTS) -> List[Dict[str, Any]]:
    """FTS search in title + content."""
    if not query.strip():
        return []

    tsq = _ts_query(query)

    tsvector_expr = func.to_tsvector(
        TS_LANG,
        func.coalesce(models.Document.title, '') + ' ' + func.coalesce(models.Document.content, '')
    )

    rank_expr = func.ts_rank(tsvector_expr, tsq).label("rank")

    rows = (
        db.query(models.Document, rank_expr)
          .filter(tsvector_expr.op('@@')(tsq))
          .order_by(desc("rank"))
          .limit(limit)
          .all()
    )

    return [{"document": doc, "rank": float(rank)} for doc, rank in rows]


def search_summaries(db: Session, query: str, limit: int = MAX_RESULTS) -> List[Dict[str, Any]]:
    """FTS search in summary."""
    if not query.strip():
        return []

    tsq = _ts_query(query)

    tsvector_expr = func.to_tsvector(
        TS_LANG,
        func.coalesce(models.Document.summary, '')
    )

    rank_expr = func.ts_rank(tsvector_expr, tsq).label("rank")

    rows = (
        db.query(models.Document, rank_expr)
          .filter(tsvector_expr.op('@@')(tsq))
          .order_by(desc("rank"))
          .limit(limit)
          .all()
    )

    return [{"document": doc, "rank": float(rank)} for doc, rank in rows]
