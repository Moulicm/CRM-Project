"""
Seed script to populate database with demo data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    print("🌱 Starting database seeding...")
    
    # Check if data already exists
    existing_inst = await db.institutions.count_documents({})
    if existing_inst > 0:
        print("✅ Data already exists. Skipping seed.")
        return
    
    # 1. Create Institution
    institution = {
        "id": "inst_demo123",
        "name": "Karnataka Engineering College",
        "code": "KEC",
        "address": "Bangalore, Karnataka",
        "created_at": datetime.now(timezone.utc)
    }
    await db.institutions.insert_one(institution)
    print("✅ Institution created")
    
    # 2. Create Campus
    campus = {
        "id": "campus_main001",
        "institution_id": "inst_demo123",
        "name": "Main Campus",
        "code": "MAIN",
        "location": "Electronic City, Bangalore",
        "created_at": datetime.now(timezone.utc)
    }
    await db.campuses.insert_one(campus)
    print("✅ Campus created")
    
    # 3. Create Departments
    departments = [
        {
            "id": "dept_cse001",
            "campus_id": "campus_main001",
            "name": "Computer Science & Engineering",
            "code": "CSE",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "dept_ece001",
            "campus_id": "campus_main001",
            "name": "Electronics & Communication Engineering",
            "code": "ECE",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "dept_mech001",
            "campus_id": "campus_main001",
            "name": "Mechanical Engineering",
            "code": "MECH",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.departments.insert_many(departments)
    print("✅ Departments created")
    
    # 4. Create Programs
    programs = [
        {
            "id": "prog_cse_ug",
            "department_id": "dept_cse001",
            "name": "B.Tech Computer Science",
            "code": "CSE",
            "course_type": "UG",
            "entry_type": "Regular",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "prog_ece_ug",
            "department_id": "dept_ece001",
            "name": "B.Tech Electronics",
            "code": "ECE",
            "course_type": "UG",
            "entry_type": "Regular",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "prog_mech_ug",
            "department_id": "dept_mech001",
            "name": "B.Tech Mechanical",
            "code": "MECH",
            "course_type": "UG",
            "entry_type": "Regular",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.programs.insert_many(programs)
    print("✅ Programs created")
    
    # 5. Create Academic Year
    academic_year = {
        "id": "year_2025_26",
        "year": "2025-2026",
        "start_date": datetime(2025, 7, 1, tzinfo=timezone.utc),
        "end_date": datetime(2026, 6, 30, tzinfo=timezone.utc),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.academic_years.insert_one(academic_year)
    print("✅ Academic year created")
    
    # 6. Create Seat Matrices
    seat_matrices = [
        {
            "id": "seat_cse_2025",
            "program_id": "prog_cse_ug",
            "academic_year_id": "year_2025_26",
            "total_intake": 120,
            "quotas": [
                {"quota_name": "KCET", "allocated_seats": 60, "filled_seats": 35},
                {"quota_name": "COMEDK", "allocated_seats": 40, "filled_seats": 25},
                {"quota_name": "Management", "allocated_seats": 20, "filled_seats": 10}
            ],
            "supernumerary_seats": 5,
            "supernumerary_filled": 2,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "seat_ece_2025",
            "program_id": "prog_ece_ug",
            "academic_year_id": "year_2025_26",
            "total_intake": 100,
            "quotas": [
                {"quota_name": "KCET", "allocated_seats": 50, "filled_seats": 20},
                {"quota_name": "COMEDK", "allocated_seats": 30, "filled_seats": 15},
                {"quota_name": "Management", "allocated_seats": 20, "filled_seats": 5}
            ],
            "supernumerary_seats": 5,
            "supernumerary_filled": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "seat_mech_2025",
            "program_id": "prog_mech_ug",
            "academic_year_id": "year_2025_26",
            "total_intake": 80,
            "quotas": [
                {"quota_name": "KCET", "allocated_seats": 40, "filled_seats": 15},
                {"quota_name": "COMEDK", "allocated_seats": 25, "filled_seats": 10},
                {"quota_name": "Management", "allocated_seats": 15, "filled_seats": 3}
            ],
            "supernumerary_seats": 3,
            "supernumerary_filled": 1,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.seat_matrices.insert_many(seat_matrices)
    print("✅ Seat matrices created")
    
    # 7. Create Sample Applicants
    applicants = [
        {
            "id": "app_001",
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@example.com",
            "phone": "+91-9876543210",
            "date_of_birth": datetime(2005, 5, 15, tzinfo=timezone.utc),
            "gender": "Male",
            "category": "GM",
            "program_id": "prog_cse_ug",
            "academic_year_id": "year_2025_26",
            "quota_type": "KCET",
            "entry_type": "Regular",
            "allotment_number": "KCET2025001234",
            "marks": 95.5,
            "qualifying_exam": "Karnataka CET",
            "documents": [
                {"document_name": "10th Marksheet", "status": "verified"},
                {"document_name": "12th Marksheet", "status": "verified"},
                {"document_name": "Transfer Certificate", "status": "submitted"},
                {"document_name": "Aadhar Card", "status": "verified"},
                {"document_name": "Caste Certificate", "status": "pending"}
            ],
            "status": "allocated",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "app_002",
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+91-9876543211",
            "date_of_birth": datetime(2005, 8, 20, tzinfo=timezone.utc),
            "gender": "Female",
            "category": "SC",
            "program_id": "prog_ece_ug",
            "academic_year_id": "year_2025_26",
            "quota_type": "COMEDK",
            "entry_type": "Regular",
            "allotment_number": "COMEDK2025005678",
            "marks": 92.0,
            "qualifying_exam": "COMEDK UGET",
            "documents": [
                {"document_name": "10th Marksheet", "status": "verified"},
                {"document_name": "12th Marksheet", "status": "verified"},
                {"document_name": "Transfer Certificate", "status": "verified"},
                {"document_name": "Aadhar Card", "status": "verified"},
                {"document_name": "Caste Certificate", "status": "verified"}
            ],
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "app_003",
            "name": "Amit Patel",
            "email": "amit.patel@example.com",
            "phone": "+91-9876543212",
            "date_of_birth": datetime(2005, 3, 10, tzinfo=timezone.utc),
            "gender": "Male",
            "category": "OBC",
            "program_id": "prog_cse_ug",
            "academic_year_id": "year_2025_26",
            "quota_type": "Management",
            "entry_type": "Regular",
            "marks": 88.5,
            "qualifying_exam": "Karnataka 2nd PUC",
            "documents": [
                {"document_name": "10th Marksheet", "status": "pending"},
                {"document_name": "12th Marksheet", "status": "pending"},
                {"document_name": "Transfer Certificate", "status": "pending"},
                {"document_name": "Aadhar Card", "status": "pending"},
                {"document_name": "Caste Certificate", "status": "pending"}
            ],
            "status": "pending",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.applicants.insert_many(applicants)
    print("✅ Sample applicants created")
    
    # 8. Create Sample Admissions
    admissions = [
        {
            "id": "adm_001",
            "applicant_id": "app_002",
            "program_id": "prog_ece_ug",
            "academic_year_id": "year_2025_26",
            "quota_type": "COMEDK",
            "admission_number": "KEC/2025/UG/ECE/COMEDK/0001",
            "admission_date": datetime.now(timezone.utc),
            "fee_status": "paid",
            "fee_amount": 150000.0,
            "fee_paid_date": datetime.now(timezone.utc),
            "confirmed": True
        }
    ]
    await db.admissions.insert_many(admissions)
    print("✅ Sample admissions created")
    
    print("\n🎉 Database seeding completed successfully!")
    print("\n📊 Summary:")
    print(f"  - Institutions: 1")
    print(f"  - Campuses: 1")
    print(f"  - Departments: 3")
    print(f"  - Programs: 3")
    print(f"  - Academic Years: 1")
    print(f"  - Seat Matrices: 3")
    print(f"  - Applicants: 3")
    print(f"  - Admissions: 1")

if __name__ == "__main__":
    asyncio.run(seed_data())
    client.close()
