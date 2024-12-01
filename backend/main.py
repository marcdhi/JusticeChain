from fastapi import FastAPI, HTTPException
import uvicorn
from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
import uuid

# Global dictionary to store cases
global_cases: Dict[str, dict] = {}

# Enums for case status and lawyer types
class CaseStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class LawyerType(str, Enum):
    HUMAN = "Human"
    AI = "AI"

# Base schemas for file and evidence handling
class FileDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

class EvidenceDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

# Schema for submitting new evidence to an existing case
class EvidenceSubmissionSchema(BaseModel):
    lawyer_type: LawyerType
    lawyer_address: str
    evidences: List[EvidenceDescription]
    additional_notes: Optional[str] = None

# Schema for creating a new case
class CaseCreateSchema(BaseModel):
    title: str
    description: str
    files: List[FileDescription]
    lawyer1_type: LawyerType
    lawyer1_address: str
    case_status: CaseStatus = CaseStatus.OPEN # this may be helpful to determine later when to stop the conversation 

# Function to create a new case
def create_case(case_data: CaseCreateSchema):
    """
    Creates a new case with initial evidence from lawyer1
    Returns: Case object with generated UUID
    """
    try:
        case_id = str(uuid.uuid4())
        
        case_obj = {
            "case_id": case_id,
            "title": case_data.title,
            "description": case_data.description,
            "lawyer1_type": case_data.lawyer1_type,
            "lawyer1_address": case_data.lawyer1_address,
            "lawyer1_evidences": [
                {
                    "ipfs_hash": file.ipfs_hash,
                    "description": file.description,
                    "original_name": file.original_name
                } for file in case_data.files
            ],
            "lawyer2_type": None,   
            "lawyer2_address": None,
            "lawyer2_evidences": [],
            "case_status": case_data.case_status,
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        # Store in global dictionary
        global_cases[case_id] = case_obj
        
        return case_obj
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error creating case: {str(e)}"
        )

# Function to add evidence to an existing case
def add_evidence(case_id: str, evidence_data: EvidenceSubmissionSchema):
    """
    Adds evidence to an existing case from lawyer2
    Returns: Updated case object
    """
    if case_id not in global_cases:
        raise HTTPException(status_code=404, detail="Case not found")

    case = global_cases[case_id]
    
    # update case with new evidence
    case["lawyer2_type"] = evidence_data.lawyer_type # will be either human or ai
    case["lawyer2_address"] = evidence_data.lawyer_address
    case["lawyer2_evidences"].extend([
        {
            "ipfs_hash": evidence.ipfs_hash,
            "description": evidence.description,
            "original_name": evidence.original_name
        } for evidence in evidence_data.evidences
    ])
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    return case

# Function to retrieve a specific case
def get_case(case_id: str):
    """
    Retrieves full case details including all evidence
    """
    if case_id not in global_cases:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return global_cases[case_id]

# Function to list all cases
def list_cases():
    """
    Returns list of all cases with basic details
    """
    return list(global_cases.values())

app = FastAPI(
    title="JusticeChain API",
)

# API Routes
@app.post("/cases/create")
def create_case_route(case_data: CaseCreateSchema):
    """Creates a new case with initial evidence"""
    return create_case(case_data)

@app.post("/cases/{case_id}/evidence")
def submit_evidence_route(
    case_id: str,
    evidence_data: EvidenceSubmissionSchema
):
    """Submits additional evidence to an existing case"""
    return add_evidence(case_id, evidence_data)

@app.get("/cases/{case_id}")
def get_case_route(case_id: str):
    """Retrieves full case details"""
    return get_case(case_id)

@app.get("/cases")
def list_cases_route():
    """Lists all cases"""
    return list_cases()