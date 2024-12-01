from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch

from ...schema.schemas import (
    CaseCreateSchema, 
    EvidenceSubmissionSchema, 
    LawyerType,
    CaseStatus
)
from ...db.redis_db import redis_client

router = APIRouter()

def generate_case_pdf(case: dict) -> str:
    """
    Generate a PDF report for a specific case
    
    Args:
        case (dict): Case object containing all case details
    
    Returns:
        str: Path to the generated PDF file
    """
    # Ensure PDF directory exists
    os.makedirs('case_reports', exist_ok=True)
    
    # Generate unique filename
    pdf_filename = f'case_reports/case_{case["case_id"]}.pdf'
    
    # Create PDF document
    doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title = Paragraph(f"Case Report: {case['title']}", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))

    # Case Details Section
    story.append(Paragraph("Case Details:", styles['Heading2']))
    case_details = [
        ['Case ID', case['case_id']],
        ['Description', case['description']],
        ['Status', case['case_status']],
        ['Created At', case['created_at']],
        ['Updated At', case['updated_at']]
    ]
    case_details_table = Table(case_details, colWidths=[2*inch, 4*inch])
    case_details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('BACKGROUND', (0,0), (-1,0), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(case_details_table)
    story.append(Spacer(1, 12))

    # Lawyer 1 Section
    story.append(Paragraph("Lawyer 1 Details:", styles['Heading2']))
    lawyer1_details = [
        ['Lawyer Type', case['lawyer1_type']],
        ['Lawyer Address', case['lawyer1_address']]
    ]
    lawyer1_table = Table(lawyer1_details, colWidths=[2*inch, 4*inch])
    lawyer1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(lawyer1_table)
    story.append(Spacer(1, 12))

    # Lawyer 1 Evidence
    story.append(Paragraph("Lawyer 1 Evidence:", styles['Heading3']))
    lawyer1_evidence_data = [['IPFS Hash', 'Description', 'Original Name', 'Submitted At']]
    for evidence in case.get('lawyer1_evidences', []):
        lawyer1_evidence_data.append([
            evidence['ipfs_hash'], 
            evidence['description'], 
            evidence['original_name'],
            evidence['submitted_at']
        ])
    lawyer1_evidence_table = Table(lawyer1_evidence_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    lawyer1_evidence_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.beige),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(lawyer1_evidence_table)
    story.append(Spacer(1, 12))

    # Lawyer 2 Section (if exists)
    if case['lawyer2_type']:
        story.append(Paragraph("Lawyer 2 Details:", styles['Heading2']))
        lawyer2_details = [
            ['Lawyer Type', case['lawyer2_type']],
            ['Lawyer Address', case['lawyer2_address']]
        ]
        lawyer2_table = Table(lawyer2_details, colWidths=[2*inch, 4*inch])
        lawyer2_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.grey),
            ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(lawyer2_table)
        story.append(Spacer(1, 12))

        # Lawyer 2 Evidence
        story.append(Paragraph("Lawyer 2 Evidence:", styles['Heading3']))
        lawyer2_evidence_data = [['IPFS Hash', 'Description', 'Original Name', 'Submitted At']]
        for evidence in case.get('lawyer2_evidences', []):
            lawyer2_evidence_data.append([
                evidence['ipfs_hash'], 
                evidence['description'], 
                evidence['original_name'],
                evidence['submitted_at']
            ])
        lawyer2_evidence_table = Table(lawyer2_evidence_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        lawyer2_evidence_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.beige),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(lawyer2_evidence_table)

    # Build PDF
    doc.build(story)
    
    return pdf_filename

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
            "lawyer2_type": "AI" if case_data.mode == "human-ai" else None,   
            "lawyer2_address": None,
            "lawyer2_evidences": [],
            "case_status": case_data.case_status,
            "mode": case_data.mode,  # Add mode to case object
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        # Save case and generate initial PDF
        saved_case = await redis_client.create_case(case_id, case_obj)
        generate_case_pdf(case_obj)
        
        return saved_case
        
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
    
    evidence_with_timestamp = [
        {
            "ipfs_hash": evidence.ipfs_hash,
            "description": evidence.description,
            "original_name": evidence.original_name,
            "submitted_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        } for evidence in evidence_data.evidences
    ]

    # Determine if this is a Human-AI case
    is_human_ai_case = case["lawyer1_type"] == LawyerType.HUMAN and (
        case["lawyer2_type"] == LawyerType.AI or case["lawyer2_type"] is None
    )

    if is_human_ai_case:
        # For Human-AI cases
        if evidence_data.lawyer_type == LawyerType.AI:
            # AI evidence goes to lawyer2
            case["lawyer2_type"] = LawyerType.AI
            case["lawyer2_evidences"].extend(evidence_with_timestamp)
        else:
            # Human evidence goes to lawyer1
            case["lawyer1_evidences"].extend(evidence_with_timestamp)
    else:
        # For Human-Human cases
        if evidence_data.lawyer_address == case["lawyer1_address"]:
            case["lawyer1_evidences"].extend(evidence_with_timestamp)
        elif not case["lawyer2_address"]:
            # First submission from lawyer2
            case["lawyer2_type"] = LawyerType.HUMAN
            case["lawyer2_address"] = evidence_data.lawyer_address
            case["lawyer2_evidences"].extend(evidence_with_timestamp)
        elif evidence_data.lawyer_address == case["lawyer2_address"]:
            case["lawyer2_evidences"].extend(evidence_with_timestamp)
        else:
            raise HTTPException(
                status_code=403,
                detail="Only registered lawyers can submit evidence"
            )
    
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    # Update case in Redis and regenerate PDF
    updated_case = await redis_client.update_case(case_id, case)
    generate_case_pdf(case)
    
    return updated_case

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

@router.patch("/{case_id}/status")
async def update_case_status(case_id: str, status: dict):
    """Updates the status of a case"""
    case = await redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case["case_status"] = status["status"]
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    # Update case in Redis and regenerate PDF
    updated_case = await redis_client.update_case(case_id, case)
    generate_case_pdf(case)
    
    return updated_case