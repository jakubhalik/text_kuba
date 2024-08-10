#!/bin/bash

read -p "Enter your new username: " new_username
read -sp "Enter password for 'postgres' user: " postgres_password
echo
read -sp "Enter password for '${new_username}' user: " new_user_password
echo

combined_password="${new_username}${new_user_password}"
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

combined_postgres_password="postgres${postgres_password}"
postgres_hashed_password=$(echo -n "$combined_postgres_password" | sha256sum | awk '{print $1}')

gpg --batch --generate-key <<EOF
Key-Type: ECDSA
Key-Curve: nistp256
Name-Real: $new_username
Expire-Date: 0
%commit
EOF

key_fingerprint=$(gpg --list-keys "$new_username" --with-colons | grep fpr | head -n 1 | cut -d':' -f10)
public_key=$(gpg --armor --export "$key_fingerprint")
private_key=$(gpg --armor --export-secret-keys "$key_fingerprint")

echo "Generated PGP Keys:"
echo "Public Key:"
echo "$public_key"
echo "Private Key:"
echo "$private_key"

test_message="This is a test message."
encrypted_message=$(echo "$test_message" | gpg --armor --encrypt --recipient "$key_fingerprint" --trust-model always)

sudo -u postgres PGPASSWORD=$postgres_password psql -d text_kuba <<EOF

CREATE ROLE "$new_username" WITH LOGIN PASSWORD '$new_user_password';

CREATE SCHEMA IF NOT EXISTS "${new_username}_schema" AUTHORIZATION "$new_username";

CREATE TABLE IF NOT EXISTS "${new_username}_schema".encryption_test (
    id SERIAL PRIMARY KEY,
    encrypted_message TEXT,
    decrypted_message TEXT
);

CREATE SCHEMA IF NOT EXISTS postgres_schema;

CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (
    username TEXT PRIMARY KEY,
    public_key TEXT NOT NULL
);

INSERT INTO "postgres_schema"."public_keys" (username, public_key) VALUES ('$new_username', pgp_sym_encrypt('$public_key', '$postgres_hashed_password'));

EOF

test_message="This is a test message."
encrypted_message=$(echo "$test_message" | gpg --armor --encrypt --recipient "$key_fingerprint" --trust-model always)
echo "Encrypted Message:"
echo "$encrypted_message"

decrypted_message=$(echo "$encrypted_message" | gpg --decrypt --armor --recipient "$key_fingerprint" --trust-model always)
echo "Decrypted Message:"
echo "$decrypted_message"


sudo -u postgres PGPASSWORD=$postgres_password psql -d text_kuba <<EOF
INSERT INTO "${new_username}_schema".encryption_test (encrypted_message, decrypted_message)
VALUES (pgp_sym_encrypt('$encrypted_message', '$hashed_password'), pgp_sym_encrypt('$decrypted_message', '$hashed_password'));
EOF

echo "Encryption test completed and results saved in the PostgreSQL database."

