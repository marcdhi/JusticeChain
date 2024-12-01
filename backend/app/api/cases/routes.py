from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from ...schema.schemas import (
    CaseCreateSchema, 
    EvidenceSubmissionSchema, 
    LawyerType
)
from ...db.redis_db import redis_client

router = APIRouter()

@router.post("/create")
async def create_case(case_data: CaseCreateSchema):
    """Creates a new case with initial evidence"""
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
                    "original_name": file.original_name,
                    "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
                } for file in case_data.files
            ],
            "lawyer2_type": None,   
            "lawyer2_address": None,
            "lawyer2_evidences": [],
            "case_status": case_data.case_status,
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        return await redis_client.create_case(case_id, case_obj)
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error creating case: {str(e)}"
        )

@router.post("/{case_id}/evidence")
async def submit_evidence(case_id: str, evidence_data: EvidenceSubmissionSchema):
    """Submits additional evidence to an existing case"""
    case = await redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # For Human-AI cases
    if evidence_data.lawyer_type == LawyerType.AI:
        case["lawyer2_type"] = LawyerType.AI
        
    # For Human-Human cases
    else:
        if not case["lawyer2_address"] and evidence_data.lawyer_address != case["lawyer1_address"]:
            case["lawyer2_type"] = LawyerType.HUMAN
            case["lawyer2_address"] = evidence_data.lawyer_address
        elif evidence_data.lawyer_address not in [case["lawyer1_address"], case["lawyer2_address"]]:
            raise HTTPException(
                status_code=403,
                detail="Only registered lawyers can submit evidence"
            )
    
    evidence_with_timestamp = [
        {
            "ipfs_hash": evidence.ipfs_hash,
            "description": evidence.description,
            "original_name": evidence.original_name,
            "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        } for evidence in evidence_data.evidences
    ]
    
    if evidence_data.lawyer_address == case["lawyer1_address"]:
        case["lawyer1_evidences"].extend(evidence_with_timestamp)
    else:
        case["lawyer2_evidences"].extend(evidence_with_timestamp)
    
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    return await redis_client.update_case(case_id, case)

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Retrieves full case details"""
    case = await redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/")
async def list_cases():
    """Lists all cases"""
    return await redis_client.list_cases()