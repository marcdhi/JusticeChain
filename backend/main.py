from fastapi import FastAPI
from app.api.cases.routes import router as cases_router
from app.websockets.routes import router as websocket_router

app = FastAPI(
    title="JusticeChain API",
)

@app.get("/")
def root():
    return {"message": "Welcome to JusticeChain API"}

# Include routers
app.include_router(cases_router, prefix="/cases", tags=["cases"])
app.include_router(websocket_router, tags=["websocket"])