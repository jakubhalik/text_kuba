import { Pool } from 'pg';
import crypto from 'crypto';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { host, port, owner } from '@/postgresConfig';

interface Message {
    datetime_from: string;
    sent_by: string;
    send_to: string;
    text: string;
}

async function getDecryptedMessages(
    username: string,
    password: string
): Promise<Message[]> {
    const pool = new Pool({
        host,
        port,
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

    const query = `
        SELECT DISTINCT ON (sent_by)
            datetime_from,
            pgp_sym_decrypt(sent_by::bytea, $1) as sent_by,
            pgp_sym_decrypt(text::bytea, $1) as text
        FROM "${username}_schema".messages_table
        ORDER BY sent_by, datetime_from DESC;
    `;

    const result = await client.query(query, [hashedPassword]);

    client.release();

    return result.rows;
}

export async function Messenger({
    username,
    password,
}: {
    username: string;
    password: string;
}) {
    const messages = await getDecryptedMessages(username, password);

    return (
        <>
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
                <div className="flex-1 grid md:grid-cols-[300px_1fr]">
                    {username === `${owner}` && (
                        <div className="border-r flex flex-col w-full md:max-w-[300px]">
                            <div className="border-b flex items-center p-4 space-x-4">
                                <div className="flex items-center space-x-2">
                                    <FileEditIcon className="w-6 h-6 text-gray-500 rounded-lg hover:text-gray-900 dark:hover:text-gray-100" />
                                    <MoreHorizontalIcon className="w-6 h-6 text-gray-500 rounded-lg hover:text-gray-900 dark:hover:text-gray-100" />
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
                            <div className="flex-1 overflow-y-auto">
                                <ul className="divide-y">
                                    {messages &&
                                        messages.map((message, index) => (
                                            <li
                                                key={index}
                                                className="bg-gray-100 p-4 dark:bg-gray-900"
                                            >
                                                <Link
                                                    className="flex items-center gap-4 p-4 rounded-lg -m-4"
                                                    href="#"
                                                >
                                                    <Image
                                                        alt="Avatar"
                                                        className="rounded-full"
                                                        height="40"
                                                        src="/placeholder.svg"
                                                        style={{
                                                            aspectRatio:
                                                                '40/40',
                                                            objectFit: 'cover',
                                                        }}
                                                        width="40"
                                                    />
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">
                                                            {message.sent_by}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {message.text}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm">
                                                        {message.datetime_from}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}{' '}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col w-full h-[calc(100vh-88px)] pb-16">
                        <div className="border-b flex items-center p-4 space-x-4">
                            <div className="flex items-center space-x-2">
                                <ArrowLeftIcon className="w-6 h-6" />
                                <h2 className="font-semibold">Alice</h2>
                            </div>
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
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-hidden">
                            <div className="flex items-start">
                                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
                                    <p>
                                        Hey, did you want to meet up for lunch
                                        today? I heard about this new place that
                                        opened up downtown.
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500 self-end ml-2 dark:text-gray-400">
                                    2:30 PM
                                </span>
                            </div>
                            <div className="flex flex-row-reverse items-start">
                                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
                                    <p>
                                        That sounds great! I&apos;d love to. 😊
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500 self-end mr-2 dark:text-gray-400">
                                    2:32 PM
                                </span>
                            </div>
                        </div>
                        <div className="border-t flex items-center p-4 space-x-4 pt-4 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800">
                            <Button
                                className="rounded-full"
                                variant="ghost"
                                size="icon"
                            >
                                <SmileIcon className="w-6 h-6" />
                                <span className="sr-only">Insert emoji</span>
                            </Button>
                            <Button
                                className="rounded-full"
                                variant="ghost"
                                size="icon"
                            >
                                <PaperclipIcon className="w-6 h-6" />
                                <span className="sr-only">Attach file</span>
                            </Button>
                            <Input
                                accept="image/*"
                                className="hidden"
                                id="file"
                                multiple
                                type="file"
                            />
                            <Label
                                className="rounded-full cursor-pointer"
                                htmlFor="file"
                            >
                                <CameraIcon className="w-6 h-6" />
                                <span className="sr-only">Attach photo</span>
                            </Label>
                            <Textarea
                                className="min-h-0 max-h-40 overflow-hidden resize-none"
                                placeholder="Type a message..."
                            />
                            <Button size="sm">
                                <p className="text-md font-medium">Send</p>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
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
