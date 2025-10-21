use crate::*;
use crate::errors::MyOAppError;
use anchor_lang::solana_program::{
    program::invoke,
    system_instruction,
};

/// Initialize Store's USDC and fToken ATAs
/// This should be called once after Store initialization, before accepting deposits
#[derive(Accounts)]
pub struct InitStoreAtas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    
    /// CHECK: Store's USDC ATA (will be created if needed)
    #[account(mut)]
    pub store_usdc_ata: UncheckedAccount<'info>,
    
    /// CHECK: Store's fToken ATA (will be created if needed)
    #[account(mut)]
    pub store_ftoken_ata: UncheckedAccount<'info>,
    
    /// CHECK: USDC mint (from Store config)
    pub usdc_mint: UncheckedAccount<'info>,
    
    /// CHECK: fToken mint (from Store config)
    pub ftoken_mint: UncheckedAccount<'info>,
    
    /// CHECK: Token program
    pub token_program: UncheckedAccount<'info>,
    
    /// CHECK: Associated token program
    pub associated_token_program: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

impl InitStoreAtas<'_> {
    pub fn apply(ctx: &Context<InitStoreAtas>) -> Result<()> {
        let store = &ctx.accounts.store;
        
        // Derive expected ATA addresses
        let usdc_ata_seeds: &[&[u8]] = &[
            &store.key().to_bytes(),
            &store.token_program.to_bytes(),
            &store.usdc_mint.to_bytes(),
        ];
        let (expected_usdc_ata, _) = Pubkey::find_program_address(
            usdc_ata_seeds,
            &store.associated_token_program,
        );
        
        let ftoken_ata_seeds: &[&[u8]] = &[
            &store.key().to_bytes(),
            &store.token_program.to_bytes(),
            &store.jl_f_token_mint.to_bytes(),
        ];
        let (expected_ftoken_ata, _) = Pubkey::find_program_address(
            ftoken_ata_seeds,
            &store.associated_token_program,
        );
        
        // Verify provided accounts match expected ATAs
        require_keys_eq!(
            ctx.accounts.store_usdc_ata.key(),
            expected_usdc_ata,
            MyOAppError::InvalidAccount
        );
        require_keys_eq!(
            ctx.accounts.store_ftoken_ata.key(),
            expected_ftoken_ata,
            MyOAppError::InvalidAccount
        );
        
        // Create USDC ATA if needed
        if ctx.accounts.store_usdc_ata.data_is_empty() {
            msg!("Creating Store USDC ATA...");
            let create_usdc_ata_ix = anchor_lang::solana_program::instruction::Instruction {
                program_id: ctx.accounts.associated_token_program.key(),
                accounts: vec![
                    AccountMeta::new(ctx.accounts.payer.key(), true),
                    AccountMeta::new(ctx.accounts.store_usdc_ata.key(), false),
                    AccountMeta::new_readonly(store.key(), false),
                    AccountMeta::new_readonly(store.usdc_mint, false),
                    AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                ],
                data: vec![],
            };
            invoke(
                &create_usdc_ata_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.store_usdc_ata.to_account_info(),
                    ctx.accounts.store.to_account_info(),
                    ctx.accounts.usdc_mint.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                    ctx.accounts.associated_token_program.to_account_info(),
                ],
            )?;
        }
        
        // Create fToken ATA if needed
        if ctx.accounts.store_ftoken_ata.data_is_empty() {
            msg!("Creating Store fToken ATA...");
            let create_ftoken_ata_ix = anchor_lang::solana_program::instruction::Instruction {
                program_id: ctx.accounts.associated_token_program.key(),
                accounts: vec![
                    AccountMeta::new(ctx.accounts.payer.key(), true),
                    AccountMeta::new(ctx.accounts.store_ftoken_ata.key(), false),
                    AccountMeta::new_readonly(store.key(), false),
                    AccountMeta::new_readonly(store.jl_f_token_mint, false),
                    AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                ],
                data: vec![],
            };
            invoke(
                &create_ftoken_ata_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.store_ftoken_ata.to_account_info(),
                    ctx.accounts.store.to_account_info(),
                    ctx.accounts.ftoken_mint.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                    ctx.accounts.associated_token_program.to_account_info(),
                ],
            )?;
        }
        
        msg!(
            "Store ATAs ready. USDC ATA: {}, fToken ATA: {}",
            ctx.accounts.store_usdc_ata.key(),
            ctx.accounts.store_ftoken_ata.key()
        );
        Ok(())
    }
}

