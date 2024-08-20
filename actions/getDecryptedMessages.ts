'use server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { host, port, owner, postgresHashedPassword } from '@/postgresConfig';
import { Message, User } from '../lib/utils';
import { postgresUserPool } from '@/postgresConfig';

interface MessagesResult {
    chatMessages: Message[];
    users: User[];
    publicKeys: Record<string, string>;
}
export async function getDecryptedMessages(
    username: string,
    password: string
): Promise<MessagesResult> {
    'use server';
    let publicKeys: Record<string, string> = {};
    let publicKeysForOwner: Record<string, string> = {};
    const pool = new Pool({
        host,
        port: Number(port),
        database: `text_${owner}`,
        user: username,
        password: password,
    });
    const client = await pool.connect();
    const postgresClient = await postgresUserPool.connect();
    const combinedPassword = `${username}${password}`;
    const hashedPassword = crypto
        .createHash('sha256')
        .update(combinedPassword)
        .digest('hex');

    const queryForChat = `
        SELECT
            pgp_sym_decrypt(datetime_from::bytea, $1) as datetime_from,
            pgp_sym_decrypt(sent_by::bytea, $1) as sent_by,
            pgp_sym_decrypt(send_to::bytea, $1) as send_to,
            pgp_sym_decrypt(text::bytea, $1) as text,
            pgp_sym_decrypt(file::bytea, $1) as file,
            pgp_sym_decrypt(filename::bytea, $1) as filename
        FROM "${username}_schema".messages_table;
    `;

    const queryForUsers = `
        SELECT rolname AS username
        FROM pg_roles
        WHERE rolname NOT LIKE 'pg_%'
            AND rolname NOT IN (
                'postgres', 'pg_signal_backend', 'pg_read_all_settings', 'pg_read_all_stats', 
                'pg_stat_scan_tables', 'pg_read_server_files', 'pg_write_server_files', 
                'pg_execute_server_program', 'pg_monitor', 'pg_read_all_stats', 
                'pg_database_owner', 'user', '${owner}'
            );
    `;

    const queryForPublicKeys = `
        SELECT username, pgp_sym_decrypt(public_key::bytea, $1) 
        AS public_key FROM postgres_schema.public_keys;
    `;

    let resultForChat, resultForUsers, resultForPublicKeys;

    try {
        resultForChat = await client.query(queryForChat, [hashedPassword]);
    } catch (error) {
        console.error('Error executing chat query:', error);
        client.release();
        throw new Error('Failed to execute chat query');
    }

    try {
        resultForUsers = await client.query(queryForUsers);
    } catch (error) {
        console.error('Error executing users query:', error);
        client.release();
        throw new Error('Failed to execute users query');
    }

    try {
        resultForPublicKeys = await postgresClient.query(queryForPublicKeys, [postgresHashedPassword]);
    } catch (error) {
        console.error('Error executing public keys query:', error);
        postgresClient.release();
        throw new Error('Failed to execute public keys query');
    }

    try {
        publicKeys = resultForPublicKeys.rows.reduce((acc, row) => {
            acc[row.username] = row.public_key;
            return acc;
        }, {} as Record<string, string>);
        console.log('public keys: ', publicKeys);
        publicKeysForOwner = Object.keys(publicKeys).reduce((acc, key) => {
            if (key !== owner) {
                acc[key] = publicKeys[key];
            }
            return acc;
        }, {} as Record<string, string>);
        console.log('public keys for owner: ', publicKeysForOwner);
    } catch (error) {
        console.error('Error processing public keys:', error);
        client.release();
        throw new Error('Failed to process public keys');
    }
    if (Object.keys(publicKeysForOwner).length === 0) {
        console.warn(`
            No non-owner public keys found. 
            Skipping encryption/decryption for the messages sent 
                from non-owner users to owner.`
        );
    }
    let chatMessagesProcessed;
    try {
        chatMessagesProcessed = resultForChat.rows.map((message) => {
            return {
                ...message,
            };
        });
    } catch (error) {
        console.error('Error processing chat messages:', error);
        client.release();
        throw new Error('Failed to process chat messages');
    }

    return {
        chatMessages: chatMessagesProcessed,
        users: resultForUsers.rows,
        publicKeys
    };

}


