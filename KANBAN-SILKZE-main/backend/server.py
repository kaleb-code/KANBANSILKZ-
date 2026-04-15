from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'silkze-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
COOKIE_NAME = "silkze_session"

# Password hash (senha: silkze1990)
PASSWORD_HASH = bcrypt.hashpw("silkze1990".encode(), bcrypt.gensalt()).decode()

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class ItemOrcamento(BaseModel):
    descricao: str = ""
    quantidade: float = 0
    unitario: float = 0
    total: float = 0

class LinhaGrade(BaseModel):
    cor: str = ""
    molde: str = ""
    malha: str = ""
    pp: int = 0
    p: int = 0
    m: int = 0
    g: int = 0
    gg: int = 0
    xg: int = 0
    xxg: int = 0
    xxxg: int = 0

class LinhaGradeInfantil(BaseModel):
    cor: str = ""
    molde: str = ""
    malha: str = ""
    t1: int = 0
    t2: int = 0
    t4: int = 0
    t6: int = 0
    t8: int = 0
    t10: int = 0
    t12: int = 0
    t14: int = 0
    t16: int = 0

class Checklist(BaseModel):
    layout: bool = False
    grade: bool = False
    fotolito: bool = False
    nota: bool = False
    entregue: bool = False

class Pedido(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero: int
    status: str = "Orçamento"
    cliente: str = ""
    razaoSocial: str = ""
    cnpjCpf: str = ""
    material: str = ""
    detalhes: str = ""
    contato: str = ""
    data: str = ""
    prioridade: str = "media"
    checklist: Checklist = Field(default_factory=Checklist)
    grade: List[LinhaGrade] = Field(default_factory=list)
    gradeInfantil: List[LinhaGradeInfantil] = Field(default_factory=list)
    orcamento: List[ItemOrcamento] = Field(default_factory=list)
    imagem: Optional[str] = None
    descontoPct: float = 5.0
    entradaValor: float = 0.0
    layout: str = ""
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PedidoCreate(BaseModel):
    status: str = "Orçamento"
    cliente: str = ""
    material: str = ""

class PedidoUpdate(BaseModel):
    status: Optional[str] = None
    cliente: Optional[str] = None
    razaoSocial: Optional[str] = None
    cnpjCpf: Optional[str] = None
    material: Optional[str] = None
    detalhes: Optional[str] = None
    contato: Optional[str] = None
    data: Optional[str] = None
    prioridade: Optional[str] = None
    checklist: Optional[Checklist] = None
    grade: Optional[List[LinhaGrade]] = None
    gradeInfantil: Optional[List[LinhaGradeInfantil]] = None
    orcamento: Optional[List[ItemOrcamento]] = None
    descontoPct: Optional[float] = None
    entradaValor: Optional[float] = None
    layout: Optional[str] = None

class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    authenticated: bool = True

class BackupData(BaseModel):
    versao: str = "2.0"
    data: str
    pedidos: List[Dict[Any, Any]]
    proximoNumero: int


# ==================== AUTH FUNCTIONS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def verify_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """Verify JWT from httpOnly cookie or Authorization header."""
    token = None

    # 1. Try httpOnly cookie
    token = request.cookies.get(COOKIE_NAME)

    # 2. Fallback to Authorization header
    if not token and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def _clear_auth_cookie(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")


def _serialize_datetime(pedido: dict):
    for key in ("createdAt", "updatedAt"):
        if key in pedido and isinstance(pedido[key], datetime):
            pedido[key] = pedido[key].isoformat()


# ==================== PDF HELPERS ====================

def _draw_pdf_header(c, width, height):
    c.setFont("Helvetica-Bold", 16)
    c.drawString(30, height - 40, "SILKZÉ SERVIÇOS DE SERIGRAFIA LTDA - ME")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 55, "CNPJ: 17.325.714/0001-72 | IE: 90648800-01 | (41) 3363-9072")
    c.drawString(30, height - 68, "RUA 25 DE DEZEMBRO, 149 - PINHAIS/PR")
    c.drawString(30, height - 81, "Chave Pix: 41988718830 (ITAÚ)")


def _draw_pdf_client_info(c, pedido, height):
    y = height - 110
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, y, f"Orçamento #{pedido.get('numero', 'N/A')}")
    y -= 20
    c.setFont("Helvetica", 10)
    for label, key in [("Cliente", "cliente"), ("Razão Social", "razaoSocial"),
                       ("CNPJ/CPF", "cnpjCpf"), ("Material", "material")]:
        c.drawString(30, y, f"{label}: {pedido.get(key, '')}")
        y -= 15
    return y


def _draw_pdf_items(c, pedido, y, width, height):
    y -= 15
    c.setFont("Helvetica-Bold", 11)
    c.drawString(30, y, "Itens do Orçamento:")
    y -= 20
    c.setFont("Helvetica", 9)
    c.drawString(30, y, "Descrição")
    c.drawString(300, y, "Qtd")
    c.drawString(370, y, "Unit.")
    c.drawString(450, y, "Total")
    y -= 3
    c.line(30, y, width - 30, y)

    total_geral = 0
    y -= 15
    for item in pedido.get("orcamento", []):
        if y < 100:
            c.showPage()
            y = height - 40
        c.setFont("Helvetica", 9)
        c.drawString(30, y, str(item.get("descricao", ""))[:40])
        c.drawString(300, y, str(item.get("quantidade", 0)))
        c.drawString(370, y, f"R$ {item.get('unitario', 0):.2f}")
        c.drawString(450, y, f"R$ {item.get('total', 0):.2f}")
        total_geral += item.get("total", 0)
        y -= 15
    return y, total_geral


def _draw_pdf_totals(c, pedido, y, width, total_geral):
    y -= 10
    c.line(30, y, width - 30, y)
    y -= 20
    c.setFont("Helvetica-Bold", 10)
    c.drawString(370, y, "Subtotal:")
    c.drawString(450, y, f"R$ {total_geral:.2f}")

    desconto_pct = pedido.get("descontoPct", 0)
    if desconto_pct > 0:
        y -= 15
        desconto_valor = total_geral * desconto_pct / 100
        c.drawString(370, y, f"Desconto ({desconto_pct}%):")
        c.drawString(450, y, f"- R$ {desconto_valor:.2f}")
        total_geral -= desconto_valor

    y -= 15
    c.setFont("Helvetica-Bold", 12)
    c.drawString(370, y, "TOTAL:")
    c.drawString(450, y, f"R$ {total_geral:.2f}")

    entrada = pedido.get("entradaValor", 0)
    if entrada > 0:
        y -= 15
        c.setFont("Helvetica-Bold", 10)
        c.drawString(370, y, "Entrada:")
        c.drawString(450, y, f"R$ {entrada:.2f}")
        y -= 15
        c.drawString(370, y, "Restante:")
        c.drawString(450, y, f"R$ {total_geral - entrada:.2f}")

    c.setFont("Helvetica", 8)
    c.drawString(30, 30, f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}")


# ==================== ROUTES ====================

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    if not bcrypt.checkpw(request.password.encode(), PASSWORD_HASH.encode()):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    token = create_access_token(data={"sub": "silkze_user"})
    _set_auth_cookie(response, token)
    return {"authenticated": True}


@api_router.get("/auth/verify")
async def verify_auth(user=Depends(verify_token)):
    return {"authenticated": True}


@api_router.post("/auth/logout")
async def logout(response: Response):
    _clear_auth_cookie(response)
    return {"authenticated": False}


@api_router.get("/pedidos")
async def get_pedidos(busca: Optional[str] = None, user=Depends(verify_token)):
    query = {}
    if busca:
        query["$or"] = [
            {"cliente": {"$regex": busca, "$options": "i"}},
            {"material": {"$regex": busca, "$options": "i"}},
            {"detalhes": {"$regex": busca, "$options": "i"}},
            {"razaoSocial": {"$regex": busca, "$options": "i"}},
        ]
    pedidos = await db.pedidos.find(query, {"_id": 0}).sort("numero", -1).to_list(1000)
    for p in pedidos:
        _serialize_datetime(p)
    return pedidos


@api_router.get("/pedidos/{pedido_id}")
async def get_pedido(pedido_id: str, user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    _serialize_datetime(pedido)
    return pedido


@api_router.post("/pedidos", response_model=Pedido)
async def create_pedido(pedido_create: PedidoCreate, user=Depends(verify_token)):
    config = await db.config.find_one({"key": "proximo_numero"})
    proximo_numero = config.get("value", 1) if config else 1

    pedido_dict = pedido_create.model_dump()
    pedido_dict["id"] = str(uuid.uuid4())
    pedido_dict["numero"] = proximo_numero
    pedido_dict["checklist"] = Checklist().model_dump()
    pedido_dict["grade"] = []
    pedido_dict["gradeInfantil"] = []
    pedido_dict["orcamento"] = []
    pedido_dict["imagem"] = None
    pedido_dict["descontoPct"] = 5.0
    pedido_dict["entradaValor"] = 0.0
    pedido_dict["layout"] = ""
    pedido_dict["razaoSocial"] = ""
    pedido_dict["cnpjCpf"] = ""
    pedido_dict["detalhes"] = ""
    pedido_dict["contato"] = ""
    pedido_dict["data"] = ""
    pedido_dict["prioridade"] = "media"
    pedido_dict["createdAt"] = datetime.now(timezone.utc).isoformat()
    pedido_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()

    pedido = Pedido(**pedido_dict)
    await db.pedidos.insert_one(pedido.model_dump())
    await db.config.update_one(
        {"key": "proximo_numero"},
        {"$set": {"value": proximo_numero + 1}},
        upsert=True,
    )
    return pedido


@api_router.put("/pedidos/{pedido_id}")
async def update_pedido(pedido_id: str, pedido_update: PedidoUpdate, user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    update_data = pedido_update.model_dump(exclude_unset=True)
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.pedidos.update_one({"id": pedido_id}, {"$set": update_data})
    return {"message": "Pedido atualizado com sucesso"}


@api_router.delete("/pedidos/{pedido_id}")
async def delete_pedido(pedido_id: str, user=Depends(verify_token)):
    result = await db.pedidos.delete_one({"id": pedido_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"message": "Pedido deletado com sucesso"}


@api_router.post("/pedidos/{pedido_id}/image")
async def upload_image(pedido_id: str, file: UploadFile = File(...), user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    max_size = (1200, 1200)
    if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
    if img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background

    filename = f"{pedido_id}.jpg"
    img.save(UPLOAD_DIR / filename, "JPEG", quality=85, optimize=True)
    await db.pedidos.update_one(
        {"id": pedido_id},
        {"$set": {"imagem": filename, "updatedAt": datetime.now(timezone.utc).isoformat()}},
    )
    return {"filename": filename}


@api_router.delete("/pedidos/{pedido_id}/image")
async def delete_image(pedido_id: str, user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if pedido.get("imagem"):
        filepath = UPLOAD_DIR / pedido["imagem"]
        if filepath.exists():
            filepath.unlink()
    await db.pedidos.update_one(
        {"id": pedido_id},
        {"$set": {"imagem": None, "updatedAt": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Imagem deletada com sucesso"}


@api_router.get("/pedidos/{pedido_id}/image")
async def get_image(pedido_id: str, user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido or not pedido.get("imagem"):
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    filepath = UPLOAD_DIR / pedido["imagem"]
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Arquivo de imagem não encontrado")
    return FileResponse(filepath, media_type="image/jpeg")


@api_router.post("/pedidos/backup")
async def create_backup(user=Depends(verify_token)):
    pedidos = await db.pedidos.find({}, {"_id": 0}).to_list(10000)
    config = await db.config.find_one({"key": "proximo_numero"})
    proximo_numero = config.get("value", 1) if config else 1
    for p in pedidos:
        _serialize_datetime(p)
    return BackupData(
        data=datetime.now(timezone.utc).isoformat(),
        pedidos=pedidos,
        proximoNumero=proximo_numero,
    )


@api_router.post("/pedidos/restore")
async def restore_backup(backup: BackupData, user=Depends(verify_token)):
    await db.pedidos.delete_many({})
    if backup.pedidos:
        await db.pedidos.insert_many(backup.pedidos)
    await db.config.update_one(
        {"key": "proximo_numero"},
        {"$set": {"value": backup.proximoNumero}},
        upsert=True,
    )
    return {"message": f"Backup restaurado com sucesso. {len(backup.pedidos)} pedidos importados."}


@api_router.get("/pedidos/{pedido_id}/pdf")
async def generate_pdf(pedido_id: str, user=Depends(verify_token)):
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    pdf_path = UPLOAD_DIR / f"orcamento_{pedido_id}.pdf"
    c_pdf = canvas.Canvas(str(pdf_path), pagesize=A4)
    width, height = A4

    _draw_pdf_header(c_pdf, width, height)
    y = _draw_pdf_client_info(c_pdf, pedido, height)
    y, total_geral = _draw_pdf_items(c_pdf, pedido, y, width, height)
    _draw_pdf_totals(c_pdf, pedido, y, width, total_geral)

    c_pdf.save()
    return FileResponse(pdf_path, filename=f"orcamento_{pedido.get('numero', pedido_id)}.pdf")


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/")
async def root():
    return {"message": "SilkZé Kanban API", "version": "2.0"}
