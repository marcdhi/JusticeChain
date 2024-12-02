from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid


from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, 
    Spacer, 
    Table, 
    TableStyle,
    KeepTogether
)
from reportlab.platypus.para import Paragraph
from reportlab.platypus.flowables import KeepTogether
import os



file_path = r'../content-verification/case.txt'
reference_path = r'../content-verification/references'



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
    Generate a PDF report for a specific case with improved text handling
    
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
    
    # Custom style for wrapping text
    wrap_style = styles['Normal'].clone('WrapStyle')
    wrap_style.wordWrap = 'CJK'
    
    story = []

    # Title
    title = Paragraph(f"Case Report: {case['title']}", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))

    # Case Details Section
    story.append(Paragraph("Case Details:", styles['Heading2']))
    
    def safe_paragraph(text, style, max_length=None, field_type=None):
        """
        Helper function to handle None values, truncate text, and create paragraphs
        
        Args:
            text: The text to process
            style: The paragraph style to apply
            max_length: Maximum length before truncation
            field_type: Type of field to determine default max_length
        """
        if text is None:
            return Paragraph("...", style)
            
        text = str(text)
        
        # Set default max lengths based on field type
        if max_length is None:
            if field_type == 'ipfs_hash':
                max_length = 40
            elif field_type == 'description':
                max_length = 200
            elif field_type == 'address':
                max_length = 42
            else:
                max_length = 50
                
        if len(text) > max_length:
            text = text[:max_length] + "..."
            
        return Paragraph(text, style)
    
    # Case Details
    case_details_data = [
        [Paragraph('Case ID', styles['Heading4']), safe_paragraph(case['case_id'], wrap_style, field_type='id')],
        [Paragraph('Description', styles['Heading4']), safe_paragraph(case['description'], wrap_style, field_type='description')],
        [Paragraph('Status', styles['Heading4']), safe_paragraph(case['case_status'], wrap_style)],
        [Paragraph('Created At', styles['Heading4']), safe_paragraph(case['created_at'], wrap_style)],
        [Paragraph('Updated At', styles['Heading4']), safe_paragraph(case['updated_at'], wrap_style)]
    ]
    
    # Create table with auto-adjusting column widths
    case_details_table = Table(
        case_details_data, 
        colWidths=[1.5*inch, 5.5*inch],  # Adjusted column widths
        repeatRows=1
    )
    case_details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (1,0), (1,0), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(case_details_table)
    story.append(Spacer(1, 12))

    # Lawyer 1 Section
    story.append(Paragraph("Lawyer 1 Details:", styles['Heading2']))
    lawyer1_details = [
        [Paragraph('Lawyer Type', styles['Heading4']), safe_paragraph(case['lawyer1_type'], wrap_style)],
        [Paragraph('Lawyer Address', styles['Heading4']), safe_paragraph(case['lawyer1_address'], wrap_style, field_type='address')]
    ]
    lawyer1_table = Table(
        lawyer1_details, 
        colWidths=[1.5*inch, 5.5*inch],
        repeatRows=1
    )
    lawyer1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(lawyer1_table)
    story.append(Spacer(1, 12))

    # Lawyer 1 Evidence
    story.append(Paragraph("Lawyer 1 Evidence:", styles['Heading3']))
    lawyer1_evidence_data = [[
        Paragraph('IPFS Hash', styles['Heading4']), 
        Paragraph('Description', styles['Heading4']), 
        Paragraph('Original Name', styles['Heading4']), 
        Paragraph('Submitted At', styles['Heading4'])
    ]]
    
    for evidence in case.get('lawyer1_evidences', []):
        lawyer1_evidence_data.append([
            safe_paragraph(evidence['ipfs_hash'], wrap_style, field_type='ipfs_hash'),
            safe_paragraph(evidence['description'], wrap_style, field_type='description'),
            safe_paragraph(evidence['original_name'], wrap_style),
            safe_paragraph(evidence['submitted_at'], wrap_style)
        ])
    
    lawyer1_evidence_table = Table(
        lawyer1_evidence_data, 
        colWidths=[1.5*inch, 2*inch, 1.5*inch, 1*inch],
        repeatRows=1
    )
    lawyer1_evidence_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.beige),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
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
            [Paragraph('Lawyer Type', styles['Heading4']), safe_paragraph(case['lawyer2_type'], wrap_style)],
            [Paragraph('Lawyer Address', styles['Heading4']), safe_paragraph(case['lawyer2_address'], wrap_style, field_type='address')]
        ]
        lawyer2_table = Table(
            lawyer2_details, 
            colWidths=[1.5*inch, 5.5*inch],
            repeatRows=1
        )
        lawyer2_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.grey),
            ('TEXTCOLOR', (0,0), (0,-1), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(lawyer2_table)
        story.append(Spacer(1, 12))

        # Lawyer 2 Evidence
        story.append(Paragraph("Lawyer 2 Evidence:", styles['Heading3']))
        lawyer2_evidence_data = [[
            Paragraph('IPFS Hash', styles['Heading4']), 
            Paragraph('Description', styles['Heading4']), 
            Paragraph('Original Name', styles['Heading4']), 
            Paragraph('Submitted At', styles['Heading4'])
        ]]
        
        for evidence in case.get('lawyer2_evidences', []):
            lawyer2_evidence_data.append([
                safe_paragraph(evidence['ipfs_hash'], wrap_style, field_type='ipfs_hash'),
                safe_paragraph(evidence['description'], wrap_style, field_type='description'),
                safe_paragraph(evidence['original_name'], wrap_style),
                safe_paragraph(evidence['submitted_at'], wrap_style)
            ])
        
        lawyer2_evidence_table = Table(
            lawyer2_evidence_data, 
            colWidths=[1.5*inch, 2*inch, 1.5*inch, 1*inch],
            repeatRows=1
        )
        lawyer2_evidence_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.beige),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        story.append(lawyer2_evidence_table)

    # Build PDF
    doc.build(story)
    
    return pdf_filename

@router.get("/{case_id}")
async def get_case(case_id: str):
    """Retrieves full case details"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/")
async def list_cases():
    """Lists all cases"""
    return redis_client.list_cases()

@router.post("/create")
async def create_case(case_data: CaseCreateSchema):
    """Creates a new case with initial evidence"""
    try:
        os.makedirs('content-verification', exist_ok=True)
        file_path = os.path.join('content-verification', 'case.txt')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(case_data.description)
        
        for file in case_data.files:
            os.makedirs('content-verification/references', exist_ok=True)
            reference_file_path = os.path.join('content-verification/references', f"{file.original_name.split('.')[0]}.txt")
            with open(reference_file_path, 'w', encoding='utf-8') as f:
                f.write(file.description)

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
            "mode": case_data.mode,
            "created_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            "updated_at": datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        }
        
        saved_case = redis_client.create_case(case_id, case_obj)
        print(saved_case)
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
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    for file in evidence_data.evidences:
        os.makedirs('content-verification/references', exist_ok=True)
        reference_file_path = os.path.join('content-verification/references', f"{file.original_name.split('.')[0]}.txt")
        with open(reference_file_path, 'w', encoding='utf-8') as f:
            f.write(file.description)

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
    
    updated_case = redis_client.update_case(case_id, case)
    generate_case_pdf(case)




    
    return updated_case

@router.patch("/{case_id}/status")
async def update_case_status(case_id: str, status: dict):
    """Updates the status of a case"""
    case = redis_client.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case["case_status"] = status["status"]
    case["updated_at"] = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    updated_case = redis_client.update_case(case_id, case)
    generate_case_pdf(case)
    
    return updated_case