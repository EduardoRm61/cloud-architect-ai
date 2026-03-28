from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import projects, generations
import os

app = FastAPI(title="Cloud Architect AI - Backend")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3005").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(generations.router)
app.include_router(generations.generate_router)

@app.get("/")
async def root():
    return {"message": "Cloud Architect AI Backend is running!"}
