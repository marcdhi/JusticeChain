// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract JusticeChain is ReentrancyGuard {
    // Enums for case status and lawyer type
    enum CaseStatus { Open, Closed }
    enum LawyerType { Human, AI }

    // Struct for evidence
    struct Evidence {
        string did;        
        string title;      
        string description; 
        string metadata;   
    }

    // Struct for conversation
    struct Conversation {
        string content;
        uint40 timestamp;
    }

    // Optimized Case struct
    struct Case {
        address plaintiff; 
        address defendant; 
        uint256 escrowAmount; 
        CaseStatus status; 
        LawyerType plaintiffLawyerType; 
        LawyerType defendantLawyerType; 
        string name;       
        string title;      
        string description; 
        string context;    
        Conversation conversation;
        Evidence[] evidences;
    }

    // State variables
    Case[] public cases;
    address public owner;

    // Events
    event CaseCreated(uint256 indexed caseId, address indexed plaintiff, address indexed defendant);
    event EvidenceSubmitted(uint256 indexed caseId, uint256 evidenceId, string did);
    event VerdictExecuted(uint256 indexed caseId, address winner);
    event ConversationUpdated(uint256 indexed caseId);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    // Custom errors
    error UnauthorizedAccess();
    error CaseNotOpen();
    error InsufficientEscrow();
    error TransferFailed();
    error CaseNotFound();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }

    function createCase(
        string calldata _name,
        string calldata _title,
        string calldata _description,
        string calldata _context,
        address _defendant,
        LawyerType _plaintiffLawyerType,
        LawyerType _defendantLawyerType
    ) external payable nonReentrant returns (uint256 newCaseId) {
        if (msg.value == 0) revert InsufficientEscrow();

        newCaseId = cases.length;
        cases.push(); // Push an empty case
        Case storage currentCase = cases[newCaseId];
        
        currentCase.plaintiff = msg.sender;
        currentCase.defendant = _defendant;
        currentCase.escrowAmount = msg.value;
        currentCase.status = CaseStatus.Open;
        currentCase.plaintiffLawyerType = _plaintiffLawyerType;
        currentCase.defendantLawyerType = _defendantLawyerType;
        currentCase.name = _name;
        currentCase.title = _title;
        currentCase.description = _description;
        currentCase.context = _context;
        currentCase.conversation = Conversation("", uint40(block.timestamp));
        
        emit CaseCreated(newCaseId, msg.sender, _defendant);
    }

    function submitEvidence(
        uint256 _caseId,
        string calldata _did,
        string calldata _title,
        string calldata _description,
        string calldata _metadata
    ) external {
        if (_caseId >= cases.length) revert CaseNotFound();
        
        Case storage currentCase = cases[_caseId];
        if (currentCase.status != CaseStatus.Open) revert CaseNotOpen();
        if (msg.sender != currentCase.plaintiff && msg.sender != currentCase.defendant) revert UnauthorizedAccess();

        currentCase.evidences.push(Evidence({
            did: _did,
            title: _title,
            description: _description,
            metadata: _metadata
        }));

        emit EvidenceSubmitted(_caseId, currentCase.evidences.length - 1, _did);
    }

    function updateConversation(uint256 _caseId, string calldata _conversation) external {
        if (_caseId >= cases.length) revert CaseNotFound();

        Case storage currentCase = cases[_caseId];
        if (currentCase.status != CaseStatus.Open) revert CaseNotOpen();
        if (msg.sender != currentCase.plaintiff && msg.sender != currentCase.defendant) revert UnauthorizedAccess();

        currentCase.conversation = Conversation({
            content: _conversation,
            timestamp: uint40(block.timestamp)
        });
        emit ConversationUpdated(_caseId);
    }

    function executeVerdict(uint256 _caseId, address _winner) external onlyOwner nonReentrant {
        if (_caseId >= cases.length) revert CaseNotFound();

        Case storage currentCase = cases[_caseId];
        if (currentCase.status != CaseStatus.Open) revert CaseNotOpen();

        currentCase.status = CaseStatus.Closed;
        uint256 amount = currentCase.escrowAmount;
        currentCase.escrowAmount = 0;

        (bool success, ) = payable(_winner).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit VerdictExecuted(_caseId, _winner);
    }

    function getCaseDetails(uint256 _caseId) external view returns (
        string memory name,
        string memory title,
        string memory description,
        string memory context,
        address plaintiff,
        address defendant,
        LawyerType plaintiffLawyerType,
        LawyerType defendantLawyerType,
        CaseStatus status,
        uint256 escrowAmount,
        string memory conversationContent,
        uint256 conversationTimestamp
    ) {
        if (_caseId >= cases.length) revert CaseNotFound();

        Case storage currentCase = cases[_caseId];
        return (
            currentCase.name,
            currentCase.title,
            currentCase.description,
            currentCase.context,
            currentCase.plaintiff,
            currentCase.defendant,
            currentCase.plaintiffLawyerType,
            currentCase.defendantLawyerType,
            currentCase.status,
            currentCase.escrowAmount,
            currentCase.conversation.content,
            currentCase.conversation.timestamp
        );
    }

    function getEvidenceCount(uint256 _caseId) external view returns (uint256) {
        if (_caseId >= cases.length) revert CaseNotFound();
        return cases[_caseId].evidences.length;
    }

    function getEvidence(uint256 _caseId, uint256 _evidenceId) external view returns (
        string memory did,
        string memory title,
        string memory description,
        string memory metadata
    ) {
        if (_caseId >= cases.length) revert CaseNotFound();
        Evidence storage evidence = cases[_caseId].evidences[_evidenceId];
        return (evidence.did, evidence.title, evidence.description, evidence.metadata);
    }

    function withdrawFunds() external onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit FundsWithdrawn(owner, amount);
    }
}