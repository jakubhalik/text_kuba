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
