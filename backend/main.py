from fastapi import FastAPI
from .app.api.router import api_router

app = FastAPI(
    title="CredKit CRM API",
    description="API for the CredKit CRM, a SaaS-style Credit Repair CRM.",
    version="0.1.0",
)

@app.get("/")
async def read_root():
    return {"message": "CredKit CRM API is running"}

app.include_router(api_router, prefix="/api/v1")
