#!/bin/bash

# Prompt for the password securely
read -sp "Enter the encryption password: " password
echo

# Hash the password using SHA-256
hashed_password=$(echo -n "$password" | sha256sum | awk '{print $1}')

# Encrypt the hashed password with AES-256
encrypted_hashed_password=$(echo -n "$hashed_password" | openssl enc -aes-256-cbc -base64 -pass pass:"$password")

# Compress the encrypted hashed password using zip (without using a file)
compressed_encrypted_hashed_password=$(echo -n "$encrypted_hashed_password" | zip --password "$password" -q - encrypt.zip - | base64)

# Start the PostgreSQL session
PGPASSWORD=$password psql -U kuba -d text_kuba -h localhost -p 5432 <<EOF
-- Add a new test column if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kuba_profile_table' AND column_name='test_column') THEN
        ALTER TABLE kuba_profile_table ADD COLUMN test_column bytea;
    END IF;
END \$\$;

-- Insert a test value and encrypt it using the session parameter
UPDATE kuba_profile_table SET test_column = pgp_sym_encrypt('test_value', '$compressed_encrypted_hashed_password');

-- Show the encrypted value
SELECT
    test_column AS encrypted_value
FROM
    kuba_profile_table;

-- Decrypt the test column using the same session parameter
SELECT
    pgp_sym_decrypt(test_column, '$compressed_encrypted_hashed_password')::text AS decrypted_value
FROM
    kuba_profile_table;

-- Optionally, drop the test column if you want to clean up
-- ALTER TABLE kuba_profile_table DROP COLUMN test_column;
EOF

