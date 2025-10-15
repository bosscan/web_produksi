from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import prisma
from .routers.money.pendapatan import router as pendapatan_router
from .routers.money.gaji import router as gaji_router

app = FastAPI(title="ERP Sakura API", version="0.1.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
	await prisma.connect()

@app.on_event("shutdown")
async def on_shutdown():
	await prisma.disconnect()

@app.get("/health")
async def health():
	return {"status": "ok"}

app.include_router(pendapatan_router)
app.include_router(gaji_router)

