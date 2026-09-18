"""
Progress API Router — Endpoints for syncing user progress and metrics.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.user_progress import ChallengeProgressItem, LessonProgressItem, UserProgress

router = APIRouter(prefix="/api/progress", tags=["progress"])


class LessonProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    lesson_id: str = Field(..., min_length=1, max_length=100)
    quiz_score: int = Field(default=0, ge=0)
    total_questions: int = Field(default=0, ge=0)


class ChallengeProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    challenge_id: str = Field(..., min_length=1, max_length=100)
    score: float = Field(default=1.0, ge=0.0, le=1.0)


class QMLProgressRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    topic_id: str = Field(..., min_length=1, max_length=100)


class CircuitIncrementRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)


@router.get("/{session_id}")
async def get_progress(session_id: str) -> dict:
    """Fetch user progress for a given session ID."""
    try:
        progress = await UserProgress.find_one(UserProgress.session_id == session_id)
        if not progress:
            return {
                "session_id": session_id,
                "completed_lessons": [],
                "completed_challenges": [],
                "completed_qml_topics": [],
                "circuits_executed": 0,
            }
        return {
            "session_id": progress.session_id,
            "completed_lessons": [item.model_dump() for item in progress.completed_lessons],
            "completed_challenges": [item.model_dump() for item in progress.completed_challenges],
            "completed_qml_topics": progress.completed_qml_topics,
            "circuits_executed": progress.circuits_executed,
        }
    except Exception:
        # DB connection fallback
        return {
            "session_id": session_id,
            "completed_lessons": [],
            "completed_challenges": [],
            "completed_qml_topics": [],
            "circuits_executed": 0,
        }


@router.post("/lesson")
async def record_lesson(req: LessonProgressRequest) -> dict:
    """Record a completed lesson."""
    try:
        progress = await UserProgress.find_one(UserProgress.session_id == req.session_id)
        if not progress:
            progress = UserProgress(session_id=req.session_id)

        # Update or append lesson record
        existing = next(
            (item for item in progress.completed_lessons if item.lesson_id == req.lesson_id), None
        )
        if existing:
            existing.quiz_score = max(existing.quiz_score, req.quiz_score)
            existing.total_questions = req.total_questions
            existing.completed_at = datetime.now(UTC)
        else:
            progress.completed_lessons.append(
                LessonProgressItem(
                    lesson_id=req.lesson_id,
                    quiz_score=req.quiz_score,
                    total_questions=req.total_questions,
                )
            )

        progress.updated_at = datetime.now(UTC)
        await progress.save()
        return {"status": "ok", "lesson_id": req.lesson_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database unavailable: {e}") from e


@router.post("/challenge")
async def record_challenge(req: ChallengeProgressRequest) -> dict:
    """Record a completed challenge."""
    try:
        progress = await UserProgress.find_one(UserProgress.session_id == req.session_id)
        if not progress:
            progress = UserProgress(session_id=req.session_id)

        existing = next(
            (
                item
                for item in progress.completed_challenges
                if item.challenge_id == req.challenge_id
            ),
            None,
        )
        if existing:
            existing.score = max(existing.score, req.score)
            existing.completed_at = datetime.now(UTC)
        else:
            progress.completed_challenges.append(
                ChallengeProgressItem(challenge_id=req.challenge_id, score=req.score)
            )

        progress.updated_at = datetime.now(UTC)
        await progress.save()
        return {"status": "ok", "challenge_id": req.challenge_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database unavailable: {e}") from e


@router.post("/qml")
async def record_qml(req: QMLProgressRequest) -> dict:
    """Record a completed QML topic."""
    try:
        progress = await UserProgress.find_one(UserProgress.session_id == req.session_id)
        if not progress:
            progress = UserProgress(session_id=req.session_id)

        if req.topic_id not in progress.completed_qml_topics:
            progress.completed_qml_topics.append(req.topic_id)

        progress.updated_at = datetime.now(UTC)
        await progress.save()
        return {"status": "ok", "topic_id": req.topic_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database unavailable: {e}") from e


@router.post("/increment-circuits")
async def increment_circuits(req: CircuitIncrementRequest) -> dict:
    """Increment circuit execution count."""
    try:
        progress = await UserProgress.find_one(UserProgress.session_id == req.session_id)
        if not progress:
            progress = UserProgress(session_id=req.session_id)

        progress.circuits_executed += 1
        progress.updated_at = datetime.now(UTC)
        await progress.save()
        return {"status": "ok", "circuits_executed": progress.circuits_executed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database unavailable: {e}") from e
