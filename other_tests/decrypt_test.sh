#!/bin/bash

# Prompt for the user's alias
read -p "Enter your name/alias: " username

# Prompt for the user's password securely
read -sp "Enter password for '${username}' user: " user_password
echo

# Generate combined password
combined_password="${username}${user_password}"

# Hash the combined password (SHA-256)
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

# Start the PostgreSQL session and decrypt the data using the hashed password
psql -U "$username" -d "text_$username" -h localhost -p 5432 <<EOF
-- Decrypt the data using the hashed password directly
SELECT
    pgp_sym_decrypt(name::bytea, '$hashed_password')::text AS name
FROM
    ${username}_profile_table;
EOF

