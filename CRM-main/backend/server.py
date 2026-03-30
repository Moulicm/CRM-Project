from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import logging
import bcrypt
import jwt
import uuid
import secrets

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= AUTHENTICATION HELPERS =============

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token (15 minutes)"""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token (7 days)"""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    """Get current authenticated user from token"""
    # Try cookie first
    token = request.cookies.get("access_token")
    
    # Try session_token cookie (for Google OAuth)
    if not token:
        session_token = request.cookies.get("session_token")
        if session_token:
            session = await db.user_sessions.find_one({"session_token": session_token})
            if session:
                expires_at = session["expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < datetime.now(timezone.utc):
                    raise HTTPException(status_code=401, detail="Session expired")
                
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                user.pop("password_hash", None)
                return user
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= PYDANTIC MODELS =============

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admission_officer"  # admin, admission_officer, management
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    picture: Optional[str] = None
    created_at: datetime

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class GoogleSessionRequest(BaseModel):
    session_id: str

# Master Data Models
class Institution(BaseModel):
    id: str = Field(default_factory=lambda: f"inst_{uuid.uuid4().hex[:12]}")
    name: str
    code: str
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Campus(BaseModel):
    id: str = Field(default_factory=lambda: f"campus_{uuid.uuid4().hex[:12]}")
    institution_id: str
    name: str
    code: str
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Department(BaseModel):
    id: str = Field(default_factory=lambda: f"dept_{uuid.uuid4().hex[:12]}")
    campus_id: str
    name: str
    code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Program(BaseModel):
    id: str = Field(default_factory=lambda: f"prog_{uuid.uuid4().hex[:12]}")
    department_id: str
    name: str
    code: str
    course_type: str  # UG, PG
    entry_type: str  # Regular, Lateral
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AcademicYear(BaseModel):
    id: str = Field(default_factory=lambda: f"year_{uuid.uuid4().hex[:12]}")
    year: str  # e.g., "2025-2026"
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Seat Matrix Models
class QuotaConfig(BaseModel):
    quota_name: str  # KCET, COMEDK, Management
    allocated_seats: int
    filled_seats: int = 0

class SeatMatrix(BaseModel):
    id: str = Field(default_factory=lambda: f"seat_{uuid.uuid4().hex[:12]}")
    program_id: str
    academic_year_id: str
    total_intake: int
    quotas: List[QuotaConfig]
    supernumerary_seats: int = 0
    supernumerary_filled: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('quotas')
    def validate_quotas(cls, v, values):
        if 'total_intake' in values:
            total_allocated = sum(q.allocated_seats for q in v)
            if total_allocated != values['total_intake']:
                raise ValueError(f'Total quota seats ({total_allocated}) must equal intake ({values["total_intake"]})')
        return v

# Applicant Models
class DocumentStatus(BaseModel):
    document_name: str
    status: str = "pending"  # pending, submitted, verified

class Applicant(BaseModel):
    id: str = Field(default_factory=lambda: f"app_{uuid.uuid4().hex[:12]}")
    name: str
    email: EmailStr
    phone: str
    date_of_birth: datetime
    gender: str
    category: str  # GM, SC, ST, OBC
    program_id: str
    academic_year_id: str
    quota_type: str  # KCET, COMEDK, Management
    entry_type: str  # Regular, Lateral
    allotment_number: Optional[str] = None
    marks: Optional[float] = None
    qualifying_exam: Optional[str] = None
    documents: List[DocumentStatus] = []
    status: str = "pending"  # pending, allocated, confirmed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Admission Models
class Admission(BaseModel):
    id: str = Field(default_factory=lambda: f"adm_{uuid.uuid4().hex[:12]}")
    applicant_id: str
    program_id: str
    academic_year_id: str
    quota_type: str
    admission_number: str
    admission_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fee_status: str = "pending"  # pending, paid
    fee_amount: Optional[float] = None
    fee_paid_date: Optional[datetime] = None
    confirmed: bool = False

# ============= API ROUTER =============
api_router = APIRouter(prefix="/api")

# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserRegister, response: Response):
    """Register a new user"""
    email = user_data.email.lower()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create tokens
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    user_doc.pop("password_hash")
    user_doc.pop("_id")
    return User(**user_doc)

@api_router.post("/auth/login", response_model=User)
async def login(credentials: UserLogin, response: Response, request: Request):
    """Login user"""
    email = credentials.email.lower()
    
    # Check brute force
    ip = request.client.host
    identifier = f"{ip}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("locked_until")
        if lockout_until and lockout_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {
                    "locked_until": datetime.now(timezone.utc) + timedelta(minutes=15),
                    "last_attempt": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    # Create tokens
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    user.pop("password_hash")
    user.pop("_id")
    return User(**user)

@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    return User(**user)

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/google-session")
async def google_session(session_data: GoogleSessionRequest, response: Response):
    """Exchange Google session_id for user session"""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session ID")
            
            data = resp.json()
            
            # Create or update user
            user = await db.users.find_one({"email": data["email"]})
            if not user:
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                user_doc = {
                    "user_id": user_id,
                    "email": data["email"],
                    "name": data["name"],
                    "picture": data.get("picture"),
                    "role": "admission_officer",  # Default role
                    "created_at": datetime.now(timezone.utc)
                }
                await db.users.insert_one(user_doc)
                user = user_doc
            
            # Store session
            session_doc = {
                "user_id": user["user_id"],
                "session_token": data["session_token"],
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc)
            }
            await db.user_sessions.insert_one(session_doc)
            
            # Set cookie
            response.set_cookie(
                key="session_token",
                value=data["session_token"],
                httponly=True,
                secure=True,
                samesite="none",
                max_age=604800,
                path="/"
            )
            
            user.pop("_id", None)
            user.pop("password_hash", None)
            return User(**user)
            
    except Exception as e:
        logger.error(f"Google session error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    """Request password reset"""
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        return {"message": "If email exists, reset link has been sent"}
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "user_id": user["user_id"],
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    reset_link = f"{os.environ.get('FRONTEND_URL')}/reset-password?token={token}"
    logger.info(f"Password reset link: {reset_link}")
    
    return {"message": "If email exists, reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordReset):
    """Reset password"""
    token_doc = await db.password_reset_tokens.find_one({"token": data.token, "used": False})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    expires_at = token_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"user_id": token_doc["user_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

# ============= MASTER DATA ENDPOINTS =============

# Institutions
@api_router.post("/masters/institutions", response_model=Institution)
async def create_institution(data: Institution, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.institutions.insert_one(doc)
    return data

@api_router.get("/masters/institutions", response_model=List[Institution])
async def get_institutions(request: Request):
    await get_current_user(request)
    institutions = await db.institutions.find({}, {"_id": 0}).to_list(1000)
    return [Institution(**inst) for inst in institutions]

# Campuses
@api_router.post("/masters/campuses", response_model=Campus)
async def create_campus(data: Campus, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.campuses.insert_one(doc)
    return data

@api_router.get("/masters/campuses", response_model=List[Campus])
async def get_campuses(request: Request):
    await get_current_user(request)
    campuses = await db.campuses.find({}, {"_id": 0}).to_list(1000)
    return [Campus(**c) for c in campuses]

# Departments
@api_router.post("/masters/departments", response_model=Department)
async def create_department(data: Department, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.departments.insert_one(doc)
    return data

@api_router.get("/masters/departments", response_model=List[Department])
async def get_departments(request: Request):
    await get_current_user(request)
    departments = await db.departments.find({}, {"_id": 0}).to_list(1000)
    return [Department(**d) for d in departments]

# Programs
@api_router.post("/masters/programs", response_model=Program)
async def create_program(data: Program, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.programs.insert_one(doc)
    return data

@api_router.get("/masters/programs", response_model=List[Program])
async def get_programs(request: Request):
    await get_current_user(request)
    programs = await db.programs.find({}, {"_id": 0}).to_list(1000)
    return [Program(**p) for p in programs]

# Academic Years
@api_router.post("/masters/academic-years", response_model=AcademicYear)
async def create_academic_year(data: AcademicYear, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.academic_years.insert_one(doc)
    return data

@api_router.get("/masters/academic-years", response_model=List[AcademicYear])
async def get_academic_years(request: Request):
    await get_current_user(request)
    years = await db.academic_years.find({}, {"_id": 0}).to_list(1000)
    return [AcademicYear(**y) for y in years]

# ============= SEAT MATRIX ENDPOINTS =============

@api_router.post("/seats/matrix", response_model=SeatMatrix)
async def create_seat_matrix(data: SeatMatrix, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = data.dict()
    await db.seat_matrices.insert_one(doc)
    return data

@api_router.get("/seats/matrix", response_model=List[SeatMatrix])
async def get_seat_matrices(request: Request):
    await get_current_user(request)
    matrices = await db.seat_matrices.find({}, {"_id": 0}).to_list(1000)
    return [SeatMatrix(**m) for m in matrices]

@api_router.get("/seats/matrix/{program_id}/{academic_year_id}")
async def get_seat_matrix_by_program(program_id: str, academic_year_id: str, request: Request):
    await get_current_user(request)
    matrix = await db.seat_matrices.find_one(
        {"program_id": program_id, "academic_year_id": academic_year_id},
        {"_id": 0}
    )
    if not matrix:
        raise HTTPException(status_code=404, detail="Seat matrix not found")
    return matrix

@api_router.get("/seats/availability/{program_id}/{academic_year_id}/{quota_type}")
async def check_seat_availability(program_id: str, academic_year_id: str, quota_type: str, request: Request):
    await get_current_user(request)
    matrix = await db.seat_matrices.find_one(
        {"program_id": program_id, "academic_year_id": academic_year_id},
        {"_id": 0}
    )
    
    if not matrix:
        return {"available": False, "message": "Seat matrix not configured"}
    
    for quota in matrix["quotas"]:
        if quota["quota_name"] == quota_type:
            available_seats = quota["allocated_seats"] - quota["filled_seats"]
            return {
                "available": available_seats > 0,
                "available_seats": available_seats,
                "allocated_seats": quota["allocated_seats"],
                "filled_seats": quota["filled_seats"]
            }
    
    return {"available": False, "message": "Quota not found"}

# ============= APPLICANT ENDPOINTS =============

@api_router.post("/applicants", response_model=Applicant)
async def create_applicant(data: Applicant, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check seat availability
    availability = await check_seat_availability(
        data.program_id,
        data.academic_year_id,
        data.quota_type,
        request
    )
    
    if not availability["available"]:
        raise HTTPException(status_code=400, detail=f"No seats available in {data.quota_type} quota")
    
    # Initialize documents
    if not data.documents:
        data.documents = [
            DocumentStatus(document_name="10th Marksheet"),
            DocumentStatus(document_name="12th Marksheet"),
            DocumentStatus(document_name="Transfer Certificate"),
            DocumentStatus(document_name="Aadhar Card"),
            DocumentStatus(document_name="Caste Certificate")
        ]
    
    doc = data.dict()
    await db.applicants.insert_one(doc)
    return data

@api_router.get("/applicants", response_model=List[Applicant])
async def get_applicants(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if status:
        query["status"] = status
    
    applicants = await db.applicants.find(query, {"_id": 0}).to_list(1000)
    return [Applicant(**a) for a in applicants]

@api_router.get("/applicants/{applicant_id}", response_model=Applicant)
async def get_applicant(applicant_id: str, request: Request):
    await get_current_user(request)
    applicant = await db.applicants.find_one({"id": applicant_id}, {"_id": 0})
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return Applicant(**applicant)

@api_router.put("/applicants/{applicant_id}/documents")
async def update_document_status(applicant_id: str, document_name: str, status: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    applicant = await db.applicants.find_one({"id": applicant_id})
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Update document status
    for doc in applicant["documents"]:
        if doc["document_name"] == document_name:
            doc["status"] = status
            break
    
    await db.applicants.update_one(
        {"id": applicant_id},
        {"$set": {"documents": applicant["documents"]}}
    )
    
    return {"message": "Document status updated"}

# ============= ADMISSION ENDPOINTS =============

def generate_admission_number(institution_code: str, year: str, course_type: str, program_code: str, quota: str) -> str:
    """Generate unique admission number"""
    import random
    seq = str(random.randint(1, 9999)).zfill(4)
    return f"{institution_code}/{year}/{course_type}/{program_code}/{quota}/{seq}"

@api_router.post("/admissions/allocate")
async def allocate_admission(applicant_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get applicant
    applicant = await db.applicants.find_one({"id": applicant_id})
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    if applicant["status"] != "pending":
        raise HTTPException(status_code=400, detail="Applicant already processed")
    
    # Check seat availability
    matrix = await db.seat_matrices.find_one({
        "program_id": applicant["program_id"],
        "academic_year_id": applicant["academic_year_id"]
    })
    
    if not matrix:
        raise HTTPException(status_code=400, detail="Seat matrix not configured")
    
    # Find quota
    quota_found = False
    for quota in matrix["quotas"]:
        if quota["quota_name"] == applicant["quota_type"]:
            if quota["filled_seats"] >= quota["allocated_seats"]:
                raise HTTPException(status_code=400, detail=f"No seats available in {applicant['quota_type']} quota")
            quota_found = True
            break
    
    if not quota_found:
        raise HTTPException(status_code=400, detail="Quota not found")
    
    # Update seat count
    await db.seat_matrices.update_one(
        {
            "id": matrix["id"],
            "quotas.quota_name": applicant["quota_type"]
        },
        {
            "$inc": {"quotas.$.filled_seats": 1}
        }
    )
    
    # Update applicant status
    await db.applicants.update_one(
        {"id": applicant_id},
        {"$set": {"status": "allocated"}}
    )
    
    return {"message": "Seat allocated successfully", "applicant_id": applicant_id}

@api_router.post("/admissions/confirm")
async def confirm_admission(applicant_id: str, fee_amount: float, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get applicant
    applicant = await db.applicants.find_one({"id": applicant_id})
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    if applicant["status"] != "allocated":
        raise HTTPException(status_code=400, detail="Applicant must be allocated first")
    
    # Check documents
    all_verified = all(doc["status"] == "verified" for doc in applicant["documents"])
    if not all_verified:
        raise HTTPException(status_code=400, detail="All documents must be verified")
    
    # Get program and institution details
    program = await db.programs.find_one({"id": applicant["program_id"]})
    department = await db.departments.find_one({"id": program["department_id"]})
    campus = await db.campuses.find_one({"id": department["campus_id"]})
    institution = await db.institutions.find_one({"id": campus["institution_id"]})
    academic_year = await db.academic_years.find_one({"id": applicant["academic_year_id"]})
    
    year = academic_year["year"].split("-")[0]
    
    # Generate admission number
    admission_number = generate_admission_number(
        institution["code"],
        year,
        program["course_type"],
        program["code"],
        applicant["quota_type"]
    )
    
    # Create admission
    admission = Admission(
        applicant_id=applicant_id,
        program_id=applicant["program_id"],
        academic_year_id=applicant["academic_year_id"],
        quota_type=applicant["quota_type"],
        admission_number=admission_number,
        fee_amount=fee_amount,
        fee_status="pending",
        confirmed=False
    )
    
    await db.admissions.insert_one(admission.dict())
    
    # Update applicant
    await db.applicants.update_one(
        {"id": applicant_id},
        {"$set": {"status": "confirmed"}}
    )
    
    return {
        "message": "Admission created successfully",
        "admission_number": admission_number,
        "admission_id": admission.id
    }

@api_router.post("/admissions/{admission_id}/mark-fee-paid")
async def mark_fee_paid(admission_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "admission_officer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    await db.admissions.update_one(
        {"id": admission_id},
        {
            "$set": {
                "fee_status": "paid",
                "fee_paid_date": datetime.now(timezone.utc),
                "confirmed": True
            }
        }
    )
    
    return {"message": "Fee marked as paid"}

@api_router.get("/admissions", response_model=List[Admission])
async def get_admissions(request: Request):
    await get_current_user(request)
    admissions = await db.admissions.find({}, {"_id": 0}).to_list(1000)
    return [Admission(**a) for a in admissions]

# ============= DASHBOARD ENDPOINTS =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request, academic_year_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if academic_year_id:
        query["academic_year_id"] = academic_year_id
    
    # Total intake
    seat_matrices = await db.seat_matrices.find(query, {"_id": 0}).to_list(1000)
    total_intake = sum(m["total_intake"] for m in seat_matrices)
    
    # Total admitted
    admissions = await db.admissions.find(query, {"_id": 0}).to_list(1000)
    total_admitted = len([a for a in admissions if a["confirmed"]])
    
    # Quota-wise stats
    quota_stats = {}
    for matrix in seat_matrices:
        for quota in matrix["quotas"]:
            name = quota["quota_name"]
            if name not in quota_stats:
                quota_stats[name] = {"allocated": 0, "filled": 0}
            quota_stats[name]["allocated"] += quota["allocated_seats"]
            quota_stats[name]["filled"] += quota["filled_seats"]
    
    # Pending documents
    applicants = await db.applicants.find(query, {"_id": 0}).to_list(1000)
    pending_docs = []
    for applicant in applicants:
        pending = [doc for doc in applicant.get("documents", []) if doc["status"] != "verified"]
        if pending:
            pending_docs.append({
                "applicant_id": applicant["id"],
                "name": applicant["name"],
                "pending_count": len(pending)
            })
    
    # Pending fees
    pending_fees = [a for a in admissions if a["fee_status"] == "pending"]
    
    return {
        "total_intake": total_intake,
        "total_admitted": total_admitted,
        "remaining_seats": total_intake - sum(q["filled"] for q in quota_stats.values()),
        "quota_stats": quota_stats,
        "pending_documents": pending_docs[:10],
        "pending_fees": len(pending_fees),
        "fee_collected": sum(a.get("fee_amount", 0) for a in admissions if a["fee_status"] == "paid")
    }

# ============= STARTUP EVENTS =============

@app.on_event("startup")
async def startup_db():
    """Create indexes and seed admin user"""
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@college.edu")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    # Update test credentials
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/register\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/logout\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
