from fastapi import FastAPI

from app.routers.vessels import router as vessels_router

app = FastAPI(title="vessel-ops API")

app.include_router(vessels_router)

@app.get("/health")
def health():
    return {"status": "ok"}
