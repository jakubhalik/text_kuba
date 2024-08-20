import { Pool } from 'pg';

import crypto from 'crypto';

// import { Button } from '@/components/ui/button';

import { host, port, owner, postgresHashedPassword } from '@/postgresConfig';

import { Message, User, PaperclipIcon, /* SearchIcon, VideoIcon, PhoneIcon */ } from '../lib/utils';

// import { MoreHorizontal } from 'lucide-react';

import Chat from './Chat';

import { postgresUserPool } from '@/postgresConfig';

import { cookies } from 'next/headers';

import { decryptWithPublicKey } from '@/actions/decryptWithPublicKey';

import Image from 'next/image';

import fs from 'fs';
import path from 'path';





interface MessagesResult {
    chatMessages: Message[];
    users: User[];
}

let publicKeys: Record<string, string> = {};
let publicKeysForOwner: Record<string, string> = {};

async function getDecryptedMessages(
    username: string,
    password: string
): Promise<MessagesResult> {
    'use server';

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
    };

}

interface MessengerProps {
    username: string;
    password: string;
}

async function sendMessage(
    username: string,
    sendTo: string,
    messageText: string,
    datetimeFrom: string,
    messageTextForRecipient: string,
    datetimeFromForRecipient: string,
    file: string | null = null,
    fileName: string | null = null,
    fileForRecipient: string | null = null,
    fileNameForRecipient: string | null = null
): Promise<void> {
    'use server';

    const session = cookies().get('session');
    const sessionData = JSON.parse(session!.value);
    const postgresClient = await postgresUserPool.connect();
    const result = await postgresClient.query(
        `SELECT pgp_sym_decrypt(public_key::bytea, $1) AS public_key 
        FROM postgres_schema.public_keys WHERE username = $2`,
        [postgresHashedPassword, username]
    );
    if (result.rows.length > 0) {
        const decryptedPublicKey = result.rows[0].public_key;
        const decryptedPassword = await decryptWithPublicKey(
            decryptedPublicKey,
            sessionData.password
        );
        const password = decryptedPassword;
        if (typeof password !== 'string') {
            throw new Error('Password must be a string');
        }
        const pool = new Pool({
            host,
            port: Number(port),
            database: `text_${owner}`,
            user: username,
            password: password,
        });
        const client = await pool.connect();
        const combinedPassword = `${username}${password}`;
        const hashedPassword = crypto
            .createHash('sha256')
            .update(combinedPassword)
            .digest('hex');

        await client.query(
            `INSERT INTO "${username}_schema".messages_table (
                datetime_from, 
                sent_by, 
                send_to, 
                text, 
                file, 
                filename
            ) VALUES
            (
                pgp_sym_encrypt($1::text, $2), 
                pgp_sym_encrypt($3, $2), 
                pgp_sym_encrypt($4, $2), 
                pgp_sym_encrypt($5, $2), 
                pgp_sym_encrypt($6, $2), 
                pgp_sym_encrypt($7::text, $2)
            )`,
            [
                datetimeFrom,
                hashedPassword,
                username,
                sendTo,
                messageText,
                file,
                fileName,
            ]
        );

        try {
            await postgresClient.query(`
                CREATE SCHEMA IF NOT EXISTS "postgres_schema";
                CREATE TABLE IF NOT EXISTS "postgres_schema".messages_table (
                    datetime_from TEXT,
                    sent_by TEXT,
                    send_to TEXT,
                    text TEXT,
                    file TEXT,
                    filename TEXT
                );
            `);
            console.log('postgres_schema was created if it did not exist and message_table in it was created if it did not exist');
        } catch (e) {
            console.error('failure of postgres_schema was created if it did not exist and message_table in it was created if it did not exist');
        }

        await postgresClient.query(
            `INSERT INTO "postgres_schema".messages_table (
                datetime_from, 
                sent_by, 
                send_to, 
                text, 
                file, 
                filename
            ) VALUES
            (
                pgp_sym_encrypt($1, $2), 
                pgp_sym_encrypt($3, $2), 
                pgp_sym_encrypt($4, $2), 
                pgp_sym_encrypt($5, $2), 
                pgp_sym_encrypt($6, $2), 
                pgp_sym_encrypt($7::text, $2)
            )`,
            [
                datetimeFromForRecipient,
                postgresHashedPassword,
                username,
                sendTo,
                messageTextForRecipient,
                fileForRecipient,
                fileNameForRecipient,
            ]
        );
        client.release();
    }
    postgresClient.release();
}

export async function Messenger({ username, password }: MessengerProps) {
    const { chatMessages, users } = await getDecryptedMessages(
        username,
        password
    );
    const getAvatarFiles = () => {
        const avatarDirectory = path.join(process.cwd(), 'public');
        const files = fs.readdirSync(avatarDirectory).filter((file) => 
            file.startsWith('avatar_') && file.endsWith('.jpg'));
        return files;
    };
    const avatarFiles = getAvatarFiles();
    const randomIndex = Math.floor(Math.random() * avatarFiles.length);
    const selectedAvatar = avatarFiles[randomIndex];
    return (
        <div className="h-screen flex flex-col">
            <div className="border-b flex items-center p-4">
                <div className="flex items-center space-x-4">
                    <div className="rounded-full overflow-hidden border w-10 h-10">
                        <Image
                            alt="Avatar"
                            className="rounded-full"
                            height="40"
                            src={`/${selectedAvatar}`}
                            style={{
                                aspectRatio: '40/40',
                                objectFit: 'cover',
                            }}
                            width="40"
                        />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-lg font-bold">Chats</h1>
                    </div>
                </div>
                {/*<Button className="ml-auto" variant="ghost" size="icon">
                    <SearchIcon className="w-4 h-4" />
                    <span className="sr-only">Search</span>
                </Button>*/}
            </div>
            <div
                className={
                    username === `${owner}`
                        ? 'flex-1 grid md:grid-cols-[300px_1fr]'
                        : 'flex'
                }
            >
                <Chat
                    users={users}
                    publicKeys={
                        username === `${owner}` ? 
                        publicKeys : 
                            { 
                                [owner!]: publicKeys[owner!], 
                                [username]: publicKeys[username] 
                            }
                    }
                    iconsAndMoreForUpperSidebar={
                        <div>
                            {/*<div className="border-b flex items-center p-4 space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        className="ml-auto rounded-[50px]"
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <MoreHorizontal />
                                        <span className="sr-only">More</span>
                                    </Button>
                                </div>
                                <Button
                                    className="ml-auto"
                                    variant="ghost"
                                    size="icon"
                                >
                                    <span className="sr-only">New chat</span>
                                </Button>
                            </div>*/}
                        </div>
                    }
                    arrowForLeftIcon={<span className="sr-only">Back</span>}
                    buttonsIconsAndMoreForUpperChat={
                        <div>
                            {/*<Button variant="ghost" size="icon">
                                <VideoIcon className="w-5 h-5" />
                                <span className="sr-only">Video call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <PhoneIcon className="w-[18px] h-[18px] pb-[2px]" />
                                <span className="sr-only">Voice call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-5 h-5" />
                                <span className="sr-only">More</span>
                            </Button>*/}
                        </div>
                    }
                    chatMessages={chatMessages}
                    onSendMessage={sendMessage}
                    username={username}
                    paperclipIcon={
                        <>
                            <PaperclipIcon className="w-5 h-5" />
                            <span className="sr-only">Attach</span>
                        </>
                    }
                    avatarFiles={avatarFiles}
                />
            </div>
        </div>
    );
}

