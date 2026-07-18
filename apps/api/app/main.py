"""
Qwearn API — FastAPI backend for the quantum computing learning platform.

This is the main application entry point. It configures:
- CORS middleware (for the Next.js frontend)
- MongoDB connection via Beanie ODM
- API router mounting

See docs/architecture/ for the full system design.
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from beanie import init_beanie
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.routers import circuits, health


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    On startup: connects to MongoDB and initializes Beanie ODM.
    On shutdown: closes the MongoDB connection.

    The MONGODB_URL environment variable defaults to a local Docker Compose
    MongoDB instance. Override it for production deployments.
    """
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB", "qwearn")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Initialize Beanie with all document models.
    # Models will be added here as they are built in subsequent phases.
    await init_beanie(
        database=db,
        document_models=[],  # Phase 1 will add CircuitSave, etc.
    )

    yield

    client.close()


app = FastAPI(
    title="Qwearn API",
    description=(
        "Backend API for Qwearn, an open-source interactive quantum computing "
        "learning platform. Provides circuit execution, lesson content, progress "
        "tracking, and challenge evaluation."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS: allow the Next.js frontend to call us.
# In production, restrict origins to the actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router)
app.include_router(circuits.router)
