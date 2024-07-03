#!/bin/bash

read -p "Enter your name/alias: " username
read -sp "Enter password for '${username}' user: " user_password
echo

combined_password="${username}${user_password}"
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

PGPASSWORD=$user_password psql -U "$username" -d "text_$username" -h localhost -p 5432 <<EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO ${username}_schema;
SELECT
    pgp_sym_decrypt(name::bytea, '$hashed_password')::text AS name
FROM
    profile_table;
EOF

