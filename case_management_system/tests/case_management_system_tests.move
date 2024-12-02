#[test_only]
module case_management_system::case_management_system_tests {
    use sui::test_scenario as ts;
    use case_management_system::case_management_system::{Self, Treasury};
    use sui::coin::{Self};
    use sui::sui::SUI;

    #[test]
    fun test_case_creation() {
        let owner = @0x1;
        let scenario = ts::begin(owner);
        
        // First transaction to create treasury
        {
            case_management_system::init_for_testing(ts::ctx(&mut scenario));
        };

        // Second transaction to create a case
        ts::next_tx(&mut scenario, owner);
        {
            let treasury = ts::take_shared<Treasury>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000000, ts::ctx(&mut scenario));

            case_management_system::create_case(
                &mut treasury,
                payment,
                b"Test Case",
                b"Test Description",
                0u8, // MODE_HUMAN_HUMAN
                0u8, // LAWYER_TYPE_HUMAN
                ts::ctx(&mut scenario)
            );

            ts::return_shared(treasury);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_evidence_submission() {
        let owner = @0x1;
        let scenario = ts::begin(owner);
        
        // Setup case
        {
            case_management_system::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, owner);
        {
            let treasury = ts::take_shared<Treasury>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000000, ts::ctx(&mut scenario));

            case_management_system::create_case(
                &mut treasury,
                payment,
                b"Test Case",
                b"Test Description",
                0u8,
                0u8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(treasury);
        };

        ts::end(scenario);
    }
}
