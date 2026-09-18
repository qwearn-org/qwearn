"""
UserProgress — MongoDB document model for tracking user progress and achievements.

PURPOSE:
    Stores completed lessons, quiz scores, challenge submissions, QML module progress,
    and circuit execution metrics per session/user.

COLLECTION: user_progress
"""

from datetime import UTC, datetime

from beanie import Document
from pydantic import BaseModel, Field


class LessonProgressItem(BaseModel):
    """Completion record for a single lesson."""

    lesson_id: str
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    quiz_score: int = 0
    total_questions: int = 0


class ChallengeProgressItem(BaseModel):
    """Completion record for a single challenge."""

    challenge_id: str
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    score: float = 0.0


class UserProgress(Document):
    """
    User progress document in MongoDB.

    Attributes:
        session_id: Anonymous client UUID or user ID.
        completed_lessons: List of completed lessons with quiz scores.
        completed_challenges: List of completed challenges with scores.
        completed_qml_topics: List of completed QML topic IDs.
        circuits_executed: Counter of total circuits executed in playground.
        created_at: When the progress document was created.
        updated_at: When progress was last updated.
    """

    session_id: str = Field(..., min_length=1, max_length=64)
    completed_lessons: list[LessonProgressItem] = Field(default_factory=list)
    completed_challenges: list[ChallengeProgressItem] = Field(default_factory=list)
    completed_qml_topics: list[str] = Field(default_factory=list)
    circuits_executed: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "user_progress"
