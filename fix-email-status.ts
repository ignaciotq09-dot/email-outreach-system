import { config } from 'dotenv';
config();

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function addEmailStatusColumn() {
    try {
        console.log('Adding email_status column to contacts table...');

        await sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'contacts' AND column_name = 'email_status'
          ) THEN
              ALTER TABLE contacts ADD COLUMN email_status VARCHAR(20) DEFAULT 'unverified';
              CREATE INDEX IF NOT EXISTS contacts_email_status_idx ON contacts(email_status);
              RAISE NOTICE 'Added email_status column and index to contacts table';
          ELSE
              RAISE NOTICE 'email_status column already exists';
          END IF;
      END $$;
    `;

        console.log('✅ Successfully added email_status column');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addEmailStatusColumn();
