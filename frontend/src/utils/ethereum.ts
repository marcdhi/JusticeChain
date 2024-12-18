import { ethers } from 'ethers';
import { CONFIG } from '../config';

const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "CaseNotFound",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "CaseNotOpen",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientEscrow",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "TransferFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "UnauthorizedAccess",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "caseId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "plaintiff",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "defendant",
				"type": "address"
			}
		],
		"name": "CaseCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "caseId",
				"type": "uint256"
			}
		],
		"name": "ConversationUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_context",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_defendant",
				"type": "address"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "_plaintiffLawyerType",
				"type": "uint8"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "_defendantLawyerType",
				"type": "uint8"
			}
		],
		"name": "createCase",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "newCaseId",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "caseId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "evidenceId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "did",
				"type": "string"
			}
		],
		"name": "EvidenceSubmitted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_caseId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_winner",
				"type": "address"
			}
		],
		"name": "executeVerdict",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsWithdrawn",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_caseId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_did",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_metadata",
				"type": "string"
			}
		],
		"name": "submitEvidence",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_caseId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_conversation",
				"type": "string"
			}
		],
		"name": "updateConversation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "caseId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			}
		],
		"name": "VerdictExecuted",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdrawFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "cases",
		"outputs": [
			{
				"internalType": "address",
				"name": "plaintiff",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "defendant",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "escrowAmount",
				"type": "uint256"
			},
			{
				"internalType": "enum JusticeChain.CaseStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "plaintiffLawyerType",
				"type": "uint8"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "defendantLawyerType",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "context",
				"type": "string"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "content",
						"type": "string"
					},
					{
						"internalType": "uint40",
						"name": "timestamp",
						"type": "uint40"
					}
				],
				"internalType": "struct JusticeChain.Conversation",
				"name": "conversation",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_caseId",
				"type": "uint256"
			}
		],
		"name": "getCaseDetails",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "context",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "plaintiff",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "defendant",
				"type": "address"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "plaintiffLawyerType",
				"type": "uint8"
			},
			{
				"internalType": "enum JusticeChain.LawyerType",
				"name": "defendantLawyerType",
				"type": "uint8"
			},
			{
				"internalType": "enum JusticeChain.CaseStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "escrowAmount",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "conversationContent",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "conversationTimestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_caseId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_evidenceId",
				"type": "uint256"
			}
		],
		"name": "getEvidence",
		"outputs": [
			{
				"internalType": "string",
				"name": "did",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_caseId",
            "type": "uint256"
          }
        ],
        "name": "getEvidenceCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export const getEthereumProvider = () => {
  return new ethers.JsonRpcProvider(CONFIG.NETWORK_URL);
};

export const getContract = (signer: ethers.Signer) => {
  return new ethers.Contract(CONFIG.CONTRACT_ADDRESS, contractABI, signer);
};

