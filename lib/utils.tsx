import { type ClassValue, clsx } from 'clsx';

import { twMerge } from 'tailwind-merge';

import lang_us from '../lang_us.json';
import lang_cz from '../lang_cz.json';

import * as openpgp from 'openpgp';

import { ReactNode } from 'react';




export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const languages: { [key: string]: { [key: string]: string } } = {
    us: lang_us,
    cz: lang_cz,
};

export const loadLanguage = (language: string): { [key: string]: string } => {
    return languages[language] || languages.us;
};

export const profile_table = [
    'name',
    'email',
    'phone_number',
    'avatar',
    'theology',
    'philosophy',
];

export const messages_table = [
    'datetime_from',
    'sent_by',
    'send_to',
    'text',
    'file',
    'filename',
];

export async function handleEncryptedLogin({
    username,
    setError,
    texts,
    getPassword,
    setSubmitLoading,
    getCookie,
}: {
    username: string;
    setError: (error: string) => void;
    texts: { login_failed: string; private_key_not_in_cookies: string };
    getPassword: () => string;
    setSubmitLoading: (loading: boolean) => void;
    getCookie: (name: string) => string | undefined;
}) {
    setTimeout(() => {
        setError(texts.login_failed);
        setSubmitLoading(false);
    }, 10000);
    setSubmitLoading(true);
    const privateKeyArmored = getCookie('privateKey') as string;
    if (!privateKeyArmored) {
        setError(texts.private_key_not_in_cookies);
        return;
    }
    const privateKey = await openpgp.readPrivateKey({
        armoredKey: privateKeyArmored,
    });
    const encryptedUsername = await openpgp.sign({
        message: await openpgp.createMessage({ text: username }),
        signingKeys: privateKey,
        format: 'armored',
    });
    const encryptedPassword = await openpgp.sign({
        message: await openpgp.createMessage({ text: getPassword() }),
        signingKeys: privateKey,
        format: 'armored',
    });
    // console.log('encrypted password: ', encryptedPassword);
    const formData: FormData = {
        username: username,
        encryptedUsername: encryptedUsername as string,
        encryptedPassword: encryptedPassword as string,
    };
    return formData;
}

export async function handleKeyGeneration({
    username,
    password,
    setError,
    setSubmitLoading,
    setCookie,
    texts,
}: {
    username: string;
    password: string;
    setError: (error: string) => void;
    setSubmitLoading: (loading: boolean) => void;
    setCookie: (name: string, value: string, options?: object) => void;
    texts: { [key: string]: string };
}): Promise<FormData | null> {
    try {
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'ecc',
            curve: 'curve25519',
            userIDs: [{ name: username }],
        });
        const publicKeyArmored = publicKey;
        const privateKeyArmored = privateKey;
        const encryptedUsername = await openpgp.sign({
            message: await openpgp.createMessage({ text: username }),
            signingKeys: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
            format: 'armored',
        });
        const encryptedPassword = await openpgp.sign({
            message: await openpgp.createMessage({ text: password }),
            signingKeys: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
            format: 'armored',
        });
        setCookie('privateKey', privateKeyArmored, { path: '/', secure: true, sameSite: 'strict' });
        setCookie('publicKey', publicKeyArmored, { path: '/', secure: true, sameSite: 'strict' });
        // console.log('Generated and stored keys in cookies.');
        return {
            username,
            encryptedUsername: encryptedUsername as string,
            encryptedPassword: encryptedPassword as string,
            publicKey: publicKeyArmored,
        };
    } catch (error) {
        setSubmitLoading(false);
        setError(texts.login_failed);
        return null;
    }
}

export function capitalizeFirstLetter(input: string): string {
    return input
        .split(' ')
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

export function generateRandomString(length: number): string {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }

    return result;
}

export const randomString = generateRandomString(10);

export const randomName = generateRandomString(10);

export const randomPassword = generateRandomString(10);

export const differentRandomName = generateRandomString(9);

export const differentRandomPassword = generateRandomString(9);

export const randomNameTwo = generateRandomString(8);

export const randomPasswordTwo = generateRandomString(8);

export const differentRandomNameTwo = generateRandomString(7);

export const differentRandomPasswordTwo = generateRandomString(7);

export interface Message {
    datetime_from: string;
    sent_by: string;
    send_to: string;
    text: string | openpgp.MaybeStream<openpgp.Data> & openpgp.WebStream<string>;
    file: ArrayBuffer | string | null;
    filename: string | null;
}

export interface User {
    username: string;
}

export interface FormData {
    username: string;
    encryptedUsername: string;
    encryptedPassword: string;
    publicKey?: string;
}

export interface LoginActionPromise {
    success: boolean; 
    error?: string; 
    action?: 'generate keys' | 'nothing happened'
}

export interface SignUpActionPromise {
    success: boolean; 
    error?: string 
}

export type OnSendMessage = {
    messageText: string;
    fileBase64?: ArrayBuffer | null;
    fileName?: string | null;
};

export interface MessageInputProps {
    onSendMessage: (input: OnSendMessage) => void;
    paperclipIcon: React.ReactNode;
}

export interface SharedChatProps {
    users: User[];
    iconsAndMoreForUpperSidebar: ReactNode;
    arrowForLeftIcon: ReactNode;
    buttonsIconsAndMoreForUpperChat: ReactNode;
    username: string;
    paperclipIcon: ReactNode;
    avatarFiles: string[];
}

export interface ChatProps extends SharedChatProps {
    onSendMessage: (
        username: string,
        sendTo: string,
        messageText: string,
        datetimeFrom: string,
        messageTextForRecipient: string,
        encryptedDatetimeFrom: string,
        fileBase64?: string | null,
        fileName?: string | null,
        fileBase64ForRecipient?: string | null,
        fileNameForRecipient?: string | null
    ) => void;
    chatMessages: Message[];
    publicKeys: Record<string, string>;
}

export interface ChatComponentProps extends SharedChatProps {
    handleUserClick: (username: string) => Promise<void>;
    selectedUser: string | null;
    filteredChatMessages: Message[];
    getLastMessage: (user: User) => Message | null;
    createBlobUrl: (base64Data: string) => string;
    isImageFile: (filename: string | null) => boolean;
    handleSendMessage: (input: OnSendMessage) => Promise<void>;
}

export type ReEncrypt = (formData: FormData, checkLoginAndSendAllDataIfLoginWorksServerSide: boolean) => Promise<{success: boolean, action?: 'checked login'}>;

export const makePubKeysTableIfNotExists = `CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (username TEXT PRIMARY KEY, public_key TEXT NOT NULL);`;
export const insertUsersPubKey = `INSERT INTO postgres_schema.public_keys (username, public_key) VALUES ($1, pgp_sym_encrypt($2, $3))`;
export const selectUsersPubKey = `SELECT pgp_sym_decrypt(public_key::bytea, $1) AS public_key FROM postgres_schema.public_keys WHERE username = $2;`;

export function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function FileEditIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function SmileIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
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

export function XIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}


export function Eye(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg 
            {...props}
            xmlns="http://www.w3.org/2000/svg" 
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            width="20" 
            height="20" 
            viewBox="0 0 24 24"
        >
            <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z"/>
        </svg>
    )
}

export function ClosedEye(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg 
            {...props}
            xmlns="http://www.w3.org/2000/svg" 
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            width="20" 
            height="20" 
            viewBox="0 0 24 24">
                <path d="M19.604 2.562l-3.346 3.137c-1.27-.428-2.686-.699-4.243-.699-7.569 0-12.015 6.551-12.015 6.551s1.928 2.951 5.146 5.138l-2.911 2.909 1.414 1.414 17.37-17.035-1.415-1.415zm-6.016 5.779c-3.288-1.453-6.681 1.908-5.265 5.206l-1.726 1.707c-1.814-1.16-3.225-2.65-4.06-3.66 1.493-1.648 4.817-4.594 9.478-4.594.927 0 1.796.119 2.61.315l-1.037 1.026zm-2.883 7.431l5.09-4.993c1.017 3.111-2.003 6.067-5.09 4.993zm13.295-4.221s-4.252 7.449-11.985 7.449c-1.379 0-2.662-.291-3.851-.737l1.614-1.583c.715.193 1.458.32 2.237.32 4.791 0 8.104-3.527 9.504-5.364-.729-.822-1.956-1.99-3.587-2.952l1.489-1.46c2.982 1.9 4.579 4.327 4.579 4.327z"/>
        </svg>
    )
}
