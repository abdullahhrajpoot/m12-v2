-- Migration: Repopulate blacklisted_domains table
-- Adds common financial and medical domains that should be excluded from email processing
-- Date: 2025-12-28
-- Updated: Repopulates table by clearing and re-adding all domains

-- Common domains to blacklist for all users (financial, medical, sensitive)
-- These domains should never be processed by the email automation system

DO $$
DECLARE
    user_record RECORD;
    domain_list TEXT[] := ARRAY[
        -- Financial Institutions
        'chase.com',
        'bankofamerica.com',
        'wellsfargo.com',
        'usbank.com',
        'citibank.com',
        'capitalone.com',
        'americanexpress.com',
        'discover.com',
        'schwab.com',
        'fidelity.com',
        'vanguard.com',
        'etrade.com',
        'tdbank.com',
        'pnc.com',
        'morganstanley.com',
        'goldmansachs.com',
        'jpmorgan.com',
        -- Credit Cards & Financial Services
        'visa.com',
        'mastercard.com',
        'paypal.com',
        'square.com',
        'stripe.com',
        'venmo.com',
        'zelle.com',
        -- Medical/Healthcare
        'bluecross.com',
        'bluecrossblueshield.com',
        'aetna.com',
        'cigna.com',
        'unitedhealthcare.com',
        'humana.com',
        'kaiserpermanente.org',
        'anthem.com',
        'optum.com',
        -- Medical Providers (common hospital systems)
        'mayoclinic.org',
        'clevelandclinic.org',
        'hopkinsmedicine.org',
        'nyulangone.org',
        -- Government/IRS
        'irs.gov',
        'ssa.gov',
        'treasury.gov',
        'usa.gov',
        -- Tax Services
        'turbotax.com',
        'hrblock.com',
        'intuit.com',
        -- Investment/Retirement (schwab.com, fidelity.com, vanguard.com already listed above)
        'charles-schwab.com',
        -- Cryptocurrency/High-risk financial
        'coinbase.com',
        'binance.com',
        'kraken.com',
        'crypto.com',
        -- Identity Theft/Security Services
        'lifelock.com',
        'identityguard.com',
        'experian.com',
        'equifax.com',
        'transunion.com',
        -- Legal/Insurance
        'statefarm.com',
        'geico.com',
        'allstate.com',
        'progressive.com',
        'libertymutual.com',
        -- Internal/Self-sent emails
        'bippity.boo'
    ];
    domain_name TEXT;
BEGIN
    -- Clear all existing blacklisted domains to repopulate fresh
    DELETE FROM blacklisted_domains;
    
    -- Insert blacklisted domains for each user
    FOR user_record IN SELECT id FROM users LOOP
        FOREACH domain_name IN ARRAY domain_list LOOP
            INSERT INTO blacklisted_domains (user_id, domain, is_active, created_at, updated_at)
            VALUES (user_record.id, domain_name, true, NOW(), NOW())
            ON CONFLICT (user_id, domain) DO UPDATE
            SET is_active = true, updated_at = NOW();
        END LOOP;
    END LOOP;
END $$;

-- Add comment to document this migration
COMMENT ON TABLE blacklisted_domains IS 'Domains excluded from email processing for privacy/security. Should never be cleared except through explicit domain-specific operations.';




