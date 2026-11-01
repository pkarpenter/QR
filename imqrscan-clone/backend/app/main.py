from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import redirect, qr, links, analytics

app = FastAPI(
    title="IMPRscan",
    description="Dynamic QR Code Management System",
    version="1.0.0",
)



app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*",
    allow_origins=[settings.ADMIN_ORIGIN, "https://admin.yourbrand.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public redirect route (no prefix)
app.include_router(redirect.router)

# Protected API routes
app.include_router(qr.router, prefix="/api")
app.include_router(links.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "IMPRscan"}


