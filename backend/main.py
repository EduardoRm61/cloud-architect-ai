from fastapi import FastAPI

app = FastAPI(title="Cloud Architect AI - Backend")

@app.get("/")
async def root():
    return {"message": "Cloud Architect AI Backend is running!"}
