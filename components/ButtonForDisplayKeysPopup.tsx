'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { KeyIcon } from 'lucide-react';

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

import { getCookie } from 'cookies-next';

import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';



export default function ButtonForDisplayKeysPopup() {
    const { language } = useLanguage();
    const texts = loadLanguage(language);

    const [displayKeysPopup, setDisplayKeysPopup] = useState(false);
    const publicKeyArmored = getCookie('publicKey') as string;
    const privateKeyArmored = getCookie('privateKey') as string;
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
        console.log(text);
    };
    return (
        <>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setDisplayKeysPopup(true)}
            >
                <KeyIcon size="20" />
            </Button>
            <Dialog open={displayKeysPopup} onOpenChange={setDisplayKeysPopup}>
                <DialogTrigger asChild>
                    <button className="hidden">Open</button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>{texts.display_keys_popup_dialog_title}</DialogTitle>
                    <DialogDescription>
                        {texts.display_keys_dialog_description_1}
                    </DialogDescription>
                    <DialogDescription>
                        {texts.display_keys_dialog_description_2}
                    </DialogDescription>
                    <br />
                <Button size="tiny" onClick={() => copyToClipboard(publicKeyArmored)}>{texts.display_keys_button_public_key_to_clipboard}</Button>
                <Button size="tiny" onClick={() => copyToClipboard(privateKeyArmored)}>{texts.display_keys_button_public_key_to_clipboard}</Button>
                <Button size="tiny" onClick={() => publicKey !== publicKeyArmored ? setPublicKey(publicKeyArmored) : setPublicKey('')}>{texts.display_keys_button_show_public_key}</Button>
                {publicKey && <p className="text-[6px] sm:text-xs">{publicKey}</p>}
                <Button size="tiny" onClick={() => privateKey !== privateKeyArmored ? setPrivateKey(privateKeyArmored) : setPrivateKey('')}>{texts.display_keys_button_show_private_key}</Button>
                {privateKey && <p className="text-[6px] sm:text-xs">{privateKey}</p>}
                </DialogContent>
            </Dialog>
        </>
    )
}
