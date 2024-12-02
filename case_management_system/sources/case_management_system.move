module case_management_system::case_management_system {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};
    use sui::event;
    use std::vector;
    use std::option::{Self, Option};

    // ====== Status and Type Constants ======
    const MODE_HUMAN_HUMAN: u8 = 0;
    const MODE_HUMAN_AI: u8 = 1;

    const STATUS_OPEN: u8 = 0;
    const STATUS_CLOSED: u8 = 1;

    const LAWYER_TYPE_HUMAN: u8 = 0;
    const LAWYER_TYPE_AI: u8 = 1;

    // ====== Error Constants ======
    const ERROR_INSUFFICIENT_BALANCE: u64 = 1;
    const ERROR_UNAUTHORIZED: u64 = 2;
    const ERROR_CASE_NOT_OPEN: u64 = 3;
    const ERROR_INVALID_MODE: u64 = 4;

    // ====== Structs ======
    struct Evidence has store {
        ipfs_hash: String,
        description: String,
        original_name: String,
        submitted_at: u64,
        submitted_by: address
    }

    struct IPFSData has store {
        hash: String,
        timestamp: u64
    }

    struct Case has key, store {
        id: UID,
        case_number: u64,
        title: String,
        description: String,
        mode: u8,
        status: u8,
        escrow_amount: Balance<SUI>,
        created_at: u64,
        updated_at: u64,
        
        // Lawyer details
        lawyer1_type: u8,
        lawyer1_address: address,
        lawyer1_evidences: vector<Evidence>,
        
        lawyer2_type: Option<u8>,
        lawyer2_address: Option<address>,
        lawyer2_evidences: vector<Evidence>,
        
        // Add IPFS data
        ipfs_data: Option<IPFSData>
    }

    struct Treasury has key {
        id: UID,
        balance: Balance<SUI>,
        total_cases: u64
    }

    struct AdminCap has key, store {
        id: UID
    }

    // ====== Events ======
    struct CaseCreated has copy, drop {
        case_id: address,
        case_number: u64,
        title: String,
        mode: u8,
        lawyer1_address: address
    }

    struct EvidenceSubmitted has copy, drop {
        case_id: address,
        lawyer_type: u8,
        lawyer_address: address,
        ipfs_hash: String
    }

    struct CaseStatusChanged has copy, drop {
        case_id: address,
        old_status: u8,
        new_status: u8,
        changed_by: address
    }

    struct CasePublished has copy, drop {
        case_id: address,
        ipfs_hash: String,
        published_by: address
    }

    // ====== Core Functions ======
    fun init(ctx: &mut TxContext) {
        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            total_cases: 0
        };
        transfer::share_object(treasury);

        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    public entry fun create_case(
        treasury: &mut Treasury,
        title: vector<u8>,
        description: vector<u8>,
        mode: u8,
        lawyer_type: u8,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(mode == MODE_HUMAN_HUMAN || mode == MODE_HUMAN_AI, ERROR_INVALID_MODE);
        
        let case_number = treasury.total_cases + 1;
        treasury.total_cases = case_number;

        let escrow_balance = coin::into_balance(payment);
        
        let case = Case {
            id: object::new(ctx),
            case_number,
            title: string::utf8(title),
            description: string::utf8(description),
            mode,
            status: STATUS_OPEN,
            escrow_amount: escrow_balance,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx),
            lawyer1_type: lawyer_type,
            lawyer1_address: tx_context::sender(ctx),
            lawyer1_evidences: vector::empty(),
            lawyer2_type: if (mode == MODE_HUMAN_AI) { option::some(LAWYER_TYPE_AI) } else { option::none() },
            lawyer2_address: option::none(),
            lawyer2_evidences: vector::empty(),
            ipfs_data: option::none()
        };

        event::emit(CaseCreated {
            case_id: object::uid_to_address(&case.id),
            case_number,
            title: string::utf8(title),
            mode,
            lawyer1_address: tx_context::sender(ctx)
        });

        transfer::transfer(case, tx_context::sender(ctx));
    }

    // Evidence submission for both human and AI lawyers
    public entry fun submit_evidence(
        case: &mut Case,
        ipfs_hash: vector<u8>,
        description: vector<u8>,
        original_name: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(case.status == STATUS_OPEN, ERROR_CASE_NOT_OPEN);
        let sender = tx_context::sender(ctx);
        
        // Verify sender is authorized
        assert!(
            sender == case.lawyer1_address || 
            (option::is_some(&case.lawyer2_address) && option::borrow(&case.lawyer2_address) == &sender),
            ERROR_UNAUTHORIZED
        );

        let evidence = Evidence {
            ipfs_hash: string::utf8(ipfs_hash),
            description: string::utf8(description),
            original_name: string::utf8(original_name),
            submitted_at: tx_context::epoch(ctx),
            submitted_by: sender
        };

        // Determine which lawyer is submitting and store evidence accordingly
        if (sender == case.lawyer1_address) {
            vector::push_back(&mut case.lawyer1_evidences, evidence);
            event::emit(EvidenceSubmitted {
                case_id: object::uid_to_address(&case.id),
                lawyer_type: case.lawyer1_type,
                lawyer_address: sender,
                ipfs_hash: string::utf8(ipfs_hash)
            });
        } else {
            vector::push_back(&mut case.lawyer2_evidences, evidence);
            let lawyer2_type = *option::borrow(&case.lawyer2_type);
            event::emit(EvidenceSubmitted {
                case_id: object::uid_to_address(&case.id),
                lawyer_type: lawyer2_type,
                lawyer_address: sender,
                ipfs_hash: string::utf8(ipfs_hash)
            });
        };

        case.updated_at = tx_context::epoch(ctx);
    }

    // For human-human cases, second lawyer registration
    public entry fun register_second_lawyer(
        case: &mut Case,
        ctx: &mut TxContext
    ) {
        assert!(case.mode == MODE_HUMAN_HUMAN, ERROR_INVALID_MODE);
        assert!(case.status == STATUS_OPEN, ERROR_CASE_NOT_OPEN);
        assert!(option::is_none(&case.lawyer2_address), ERROR_UNAUTHORIZED);

        option::fill(&mut case.lawyer2_type, LAWYER_TYPE_HUMAN);
        option::fill(&mut case.lawyer2_address, tx_context::sender(ctx));
        case.updated_at = tx_context::epoch(ctx);
    }

    // Update case status (admin only)
    public entry fun update_case_status(
        case: &mut Case,
        _admin_cap: &AdminCap,
        new_status: u8,
        winner_address: address,
        ctx: &mut TxContext
    ) {
        assert!(case.status == STATUS_OPEN, ERROR_CASE_NOT_OPEN);
        let old_status = case.status;
        case.status = new_status;

        if (new_status == STATUS_CLOSED) {
            let amount = balance::value(&case.escrow_amount);
            let coin = coin::from_balance(balance::split(&mut case.escrow_amount, amount), ctx);
            transfer::public_transfer(coin, winner_address);
        };

        event::emit(CaseStatusChanged {
            case_id: object::uid_to_address(&case.id),
            old_status,
            new_status,
            changed_by: tx_context::sender(ctx)
        });

        case.updated_at = tx_context::epoch(ctx);
    }

    // Treasury management functions
    public entry fun deposit_to_treasury(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut treasury.balance, coin_balance);
    }

    public entry fun withdraw_from_treasury(
        treasury: &mut Treasury,
        _admin_cap: &AdminCap,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(balance::value(&treasury.balance) >= amount, ERROR_INSUFFICIENT_BALANCE);
        
        let withdraw_balance = balance::split(&mut treasury.balance, amount);
        let coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(coin, recipient);
    }

    // View functions
    public fun get_case_details(case: &Case): (
        u64,    // case_number
        String, // title
        String, // description
        u8,     // mode
        u8,     // status
        u64,    // escrow_amount
        u64,    // created_at
        u64,    // updated_at
        address // lawyer1_address
    ) {
        (
            case.case_number,
            case.title,
            case.description,
            case.mode,
            case.status,
            balance::value(&case.escrow_amount),
            case.created_at,
            case.updated_at,
            case.lawyer1_address
        )
    }

    public fun get_lawyer2_details(case: &Case): (Option<u8>, Option<address>) {
        (case.lawyer2_type, case.lawyer2_address)
    }

    public fun get_evidence_count(case: &Case, is_lawyer1: bool): u64 {
        if (is_lawyer1) {
            vector::length(&case.lawyer1_evidences)
        } else {
            vector::length(&case.lawyer2_evidences)
        }
    }

    public fun get_treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }

    // Add function to publish to IPFS
    public entry fun publish_to_ipfs(
        case: &mut Case,
        ipfs_hash: vector<u8>,
        escrow_payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(case.status == STATUS_OPEN, ERROR_CASE_NOT_OPEN);
        
        // Add escrow payment to case
        let escrow_balance = coin::into_balance(escrow_payment);
        balance::join(&mut case.escrow_amount, escrow_balance);
        
        let ipfs_data = IPFSData {
            hash: string::utf8(ipfs_hash),
            timestamp: tx_context::epoch(ctx)
        };
        
        option::fill(&mut case.ipfs_data, ipfs_data);
        case.updated_at = tx_context::epoch(ctx);

        // Emit event
        event::emit(CasePublished {
            case_id: object::uid_to_address(&case.id),
            ipfs_hash: string::utf8(ipfs_hash),
            published_by: tx_context::sender(ctx)
        });
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
}
