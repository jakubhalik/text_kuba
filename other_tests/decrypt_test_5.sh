#!/bin/bash

read -p "Enter your name/alias: " username
read -sp "Enter password for '${username}' user: " user_password
echo

combined_password="${username}${user_password}"
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

fetch_and_decrypt_name() {
    encrypted_name=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT name FROM ${username}_schema.profile_table;")
    
    decrypted_name=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT pgp_sym_decrypt('$encrypted_name', '$hashed_password');")
    
    echo "Encrypted name: $encrypted_name"
    echo "Decrypted name: $decrypted_name"
}

fetch_and_decrypt_name
