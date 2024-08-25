'use client';
import { useLanguage } from './GlobalStates';
import { loadLanguage } from '../lib/utils';
export default function ChatsHeading() {
    const { language } = useLanguage();
    const texts = loadLanguage(language);
    return texts.chats_heading
}
