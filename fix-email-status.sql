-- Add email_status column to contacts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'email_status'
    ) THEN
        ALTER TABLE contacts ADD COLUMN email_status VARCHAR(20) DEFAULT 'unverified';
        
        -- Create index for email_status
        CREATE INDEX IF NOT EXISTS contacts_email_status_idx ON contacts(email_status);
        
        RAISE NOTICE 'Added email_status column and index to contacts table';
    ELSE
        RAISE NOTICE 'email_status column already exists';
    END IF;
END $$;
