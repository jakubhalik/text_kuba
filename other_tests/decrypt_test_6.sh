#!/bin/bash

read -p "Enter your name/alias: " username
read -sp "Enter password for '${username}' user: " user_password
echo

combined_password="${username}${user_password}"
hashed_password=$(echo -n "$combined_password" | sha256sum | awk '{print $1}')

fetch_and_decrypt_messages() {
    encrypted_messages=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT datetime_from, sent_by, send_to, text FROM ${username}_schema.messages_table;")

    while IFS='|' read -r datetime_from encrypted_sent_by encrypted_send_to encrypted_text; do
        decrypted_sent_by=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT pgp_sym_decrypt('$encrypted_sent_by', '$hashed_password');")
        decrypted_send_to=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT pgp_sym_decrypt('$encrypted_send_to', '$hashed_password');")
        decrypted_text=$(sudo -u ${username} PGPASSWORD=$user_password psql -d text_${username} -t -P format=unaligned -c "SELECT pgp_sym_decrypt('$encrypted_text', '$hashed_password');")
        
        echo "Datetime: $datetime_from"
        echo "Sent by: $decrypted_sent_by"
        echo "Send to: $decrypted_send_to"
        echo "Text: $decrypted_text"
        echo "---------------------------"
    done <<< "$encrypted_messages"
}

fetch_and_decrypt_messages

