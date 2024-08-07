import { Pool } from 'pg';
import crypto from 'crypto';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { host, port, owner, postgres_password } from '@/postgresConfig';
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
            pgp_sym_decrypt_bytea(file::bytea, $1) as file,
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

    const [resultForChat, resultForUsers] = await Promise.all([
        client.query(queryForChat, [hashedPassword]),
        client.query(queryForUsers),
    ]);

    client.release();

    const chatMessagesProcessed = resultForChat.rows.map((message) => ({
        ...message,
        datetime_from: new Date(message.datetime_from).toLocaleString(),
        file: message.file ? message.file.toString('base64') : null,
    }));

    return {
        chatMessages: chatMessagesProcessed,
        users: resultForUsers.rows,
    };
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

    const postgresHashedPassword = crypto
        .createHash('sha256')
        .update(`postgres${postgres_password}`)
        .digest('hex');

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
                    <SearchIcon className="w-4 h-4" />
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
                                    <MoreHorizontalIcon className="w-6 h-6 rounded-lg" />
                                </Button>
                            </div>
                            <Button
                                className="ml-auto"
                                variant="ghost"
                                size="icon"
                            >
                                <FileEditIcon className="w-6 h-6" />
                                <span className="sr-only">New chat</span>
                            </Button>
                        </div>
                    }
                    arrowForLeftIcon={<ArrowLeftIcon className="w-6 h-6" />}
                    buttonsIconsAndMoreForUpperChat={
                        <>
                            <Button variant="ghost" size="icon">
                                <VideoIcon className="w-6 h-6" />
                                <span className="sr-only">Video call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <PhoneIcon className="w-6 h-6" />
                                <span className="sr-only">Voice call</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontalIcon className="w-6 h-6" />
                                <span className="sr-only">More</span>
                            </Button>
                        </>
                    }
                    chatMessages={chatMessages}
                    onSendMessage={sendMessage}
                    username={username}
                    password={password}
                    paperclipIcon={<PaperclipIcon className="w-5 h-5" />}
                />
            </div>
        </div>
    );
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    );
}

function FileEditIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
        </svg>
    );
}

function MoreHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </svg>
    );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

function SmileIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" x2="9.01" y1="9" y2="9" />
            <line x1="15" x2="15.01" y1="9" y2="9" />
        </svg>
    );
}

function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    );
}
