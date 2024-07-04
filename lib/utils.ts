import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import lang_us from '../lang_us.json';
import lang_cz from '../lang_cz.json';

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
