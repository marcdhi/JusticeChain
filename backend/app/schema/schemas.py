from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class CaseStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class LawyerType(str, Enum):
    HUMAN = "Human"
    AI = "AI"

class FileDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

class EvidenceDescription(BaseModel):
    ipfs_hash: str
    description: str
    original_name: str

class EvidenceSubmissionSchema(BaseModel):
    lawyer_type: LawyerType
    lawyer_address: Optional[str] = None
    evidences: List[EvidenceDescription]
    additional_notes: Optional[str] = None

class CaseCreateSchema(BaseModel):
    title: str
    description: str
    files: List[FileDescription]
    lawyer1_type: LawyerType
    lawyer1_address: str
    case_status: CaseStatus = CaseStatus.OPEN

class ChatMessageSchema(BaseModel):
    type: str
    content: str
    user_address: str
    case_id: str