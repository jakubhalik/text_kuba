import { Pool } from 'pg';
import crypto from 'crypto';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { host, port, owner, postgresHashedPassword } from '@/postgresConfig';
import { Message, User } from '../lib/utils';
import Chat from './Chat';
import { postgresUserPool } from '@/postgresConfig';

interface MessagesResult {
    chatMessages: Message[];
    users: User[];
}

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
        FROM "${username}_schema".messages_table
        ORDER BY datetime_from ASC;
    `;

    const queryForUsers = `
        SELECT rolname AS username
        FROM pg_roles
        WHERE rolname NOT LIKE 'pg_%'
          AND rolname NOT IN ('postgres', 'pg_signal_backend', 'pg_read_all_settings', 'pg_read_all_stats', 'pg_stat_scan_tables', 'pg_read_server_files', 'pg_write_server_files', 'pg_execute_server_program', 'pg_monitor', 'pg_read_all_stats', 'pg_database_owner', 'user', '${owner}');
    `;

    try {
        const [resultForChat, resultForUsers] = await Promise.all([
            client.query(queryForChat, [hashedPassword]),
            client.query(queryForUsers),
        ]);

        client.release();

        const chatMessagesProcessed = resultForChat.rows.map((message) => {
            let file = null;
            if (message.file) {
                try {
                    file = `data:image/*;base64,${message.file.toString('base64')}`;
                } catch (e) {
                    console.error('Error converting file to base64:', e);
                }
            }
            return {
                ...message,
                datetime_from: new Date(message.datetime_from).toLocaleString(),
                file,
            };
        });

        return {
            chatMessages: chatMessagesProcessed,
            users: resultForUsers.rows,
        };
    } catch (error) {
        console.error('Error decrypting messages:', error);
        client.release();
        throw new Error('Failed to decrypt messages');
    }
}

interface MessengerProps {
    username: string;
    password: string;
}

let selectedUser: string | null = null;

async function updateSelectedUser(newSelectedUser: string): Promise<void> {
    'use server';
    selectedUser = newSelectedUser;
}

async function sendMessage(
    username: string,
    password: string,
    sendTo: string,
    messageText: string,
    fileBase64: string | null = null,
    fileName: string | null = null
): Promise<void> {
    'use server';

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

    const datetimeFrom = new Date().toISOString();

    const postgresClient = await postgresUserPool.connect();

    let fileBuffer = null;
    if (fileBase64) {
        const base64Data = fileBase64.split(',')[1]; // Remove the data URL prefix
        fileBuffer = Buffer.from(base64Data, 'base64');
    }

    await client.query(
        `INSERT INTO "${username}_schema".messages_table (datetime_from, sent_by, send_to, text, file, filename) VALUES
        (pgp_sym_encrypt($1::text, $2), pgp_sym_encrypt($3, $2), pgp_sym_encrypt($4, $2), pgp_sym_encrypt($5, $2), pgp_sym_encrypt_bytea($6, $2), pgp_sym_encrypt($7::text, $2))`,
        [
            datetimeFrom,
            hashedPassword,
            username,
            sendTo,
            messageText,
            fileBuffer,
            fileName,
        ]
    );

    await postgresClient.query(`
        CREATE SCHEMA IF NOT EXISTS "postgres_schema";
        CREATE TABLE IF NOT EXISTS "postgres_schema".messages_table (
            datetime_from TEXT,
            sent_by TEXT,
            send_to TEXT,
            text TEXT,
            file BYTEA,
            filename TEXT
        );
    `);

    await postgresClient.query(
        `INSERT INTO "postgres_schema".messages_table (datetime_from, sent_by, send_to, text, file, filename) VALUES
        (pgp_sym_encrypt($1, $2), pgp_sym_encrypt($3, $2), pgp_sym_encrypt($4, $2), pgp_sym_encrypt($5, $2), pgp_sym_encrypt_bytea($6, $2), pgp_sym_encrypt($7::text, $2))`,
        [
            datetimeFrom,
            postgresHashedPassword,
            username,
            sendTo,
            messageText,
            fileBuffer,
            fileName,
        ]
    );

    client.release();
    postgresClient.release();
}

export async function Messenger({ username, password }: MessengerProps) {
    const { chatMessages, users } = await getDecryptedMessages(
        username,
        password
    );

    return (
        <div className="h-screen flex flex-col">
            <div className="border-b flex items-center p-4">
                <div className="flex items-center space-x-4">
                    <div className="rounded-full overflow-hidden border w-10 h-10">
                        <Image
                            alt="Avatar"
                            className="rounded-full"
                            height="40"
                            src="/placeholder.svg"
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
                <Button className="ml-auto" variant="ghost" size="icon">
                    <span className="sr-only">Search</span>
                </Button>
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
                    onUserSelect={updateSelectedUser}
                    conditionalForOwner={username === `${owner}`}
                    iconsAndMoreForUpperSidebar={
                        <div className="border-b flex items-center p-4 space-x-4">
                            <div className="flex items-center space-x-2">
                                <Button
                                    className="ml-auto rounded-[50px]"
                                    variant="ghost"
                                    size="icon"
                                >
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
                        </div>
                    }
                    arrowForLeftIcon={<span className="sr-only">Back</span>}
                    buttonsIconsAndMoreForUpperChat={
                        <>
                            <Button variant="ghost" size="icon">
                                <span className="sr-only">Video call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <span className="sr-only">Voice call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <span className="sr-only">More</span>
                            </Button>
                        </>
                    }
                    chatMessages={chatMessages}
                    onSendMessage={sendMessage}
                    username={username}
                    password={password}
                    paperclipIcon={<span className="sr-only">Attach</span>}
                />
            </div>
        </div>
    );
}

