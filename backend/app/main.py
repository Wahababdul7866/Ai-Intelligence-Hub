import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth,
    datasets,
    automl,
    models,
    predictions,
    explainability,
    documents,
    analyst,
    vision,
    system
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A 100% Free & Open-Source End-to-End AI/ML Intelligence Platform running locally.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Friendly Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path
        }
    )

# Register API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(datasets.router, prefix=api_prefix)
app.include_router(automl.router, prefix=api_prefix)
app.include_router(models.router, prefix=api_prefix)
app.include_router(predictions.router, prefix=api_prefix)
app.include_router(explainability.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(analyst.router, prefix=api_prefix)
app.include_router(vision.router, prefix=api_prefix)
app.include_router(system.router, prefix=api_prefix)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "mode": "offline-first local engine",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
