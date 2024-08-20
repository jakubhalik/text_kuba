'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

import { KeyIcon } from 'lucide-react';

import { getCookie } from 'cookies-next';

import { useLanguage } from './GlobalStates';
import { loadLanguage, handleEncryptedLogin, ReEncrypt } from '@/lib/utils';

import Loading from '@/components/Loading';

import PrivacyModelInfo from './PrivacyModelInfo';

import * as openpgp from 'openpgp';

interface KeysPopupProps {
    action: ReEncrypt;
    username: string;
}
export default function ButtonForDisplayKeysPopup({ action, username }: KeysPopupProps) {
    const { language } = useLanguage();
    const texts = loadLanguage(language);

    const [displayKeysPopup, setDisplayKeysPopup] = useState(false);
    const publicKeyArmored = getCookie('publicKey') as string;
    const privateKeyArmored = getCookie('privateKey') as string;
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [passwordInput, setPasswordInput] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [pgpKeysInfo, setPgpKeysInfo] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    useEffect(() => { !displayKeysPopup && setPasswordInput(false); }, [displayKeysPopup]);
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
        console.log(text);
    };
    const getPassword = () => passwordRef.current?.value || '';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorPopup(false);
        const formData = await handleEncryptedLogin({
            username: username,
            setError,
            texts: { login_failed: texts.display_keys_gen_new_keys_error, private_key_not_in_cookies: texts.private_key_not_in_cookies },
            getPassword,
            setSubmitLoading,
            getCookie,
        });
        const checkLoginAndSendAllDataIfLoginWorksServerSide = true;
        const result = await action(formData!, checkLoginAndSendAllDataIfLoginWorksServerSide);
        if (result.action === 'checked login') {
            setErrorPopup(false);
            console.log('logged through re-encrypt:');
            console.log(result.chatMessages);
            console.log(result.users);
            console.log(result.publicKeys);
            const privateKeyForDecryption = await openpgp.readPrivateKey({
                armoredKey: privateKeyArmored,
            });
            setSuccess(true);
            setSubmitLoading(false);
        }
        if (!result.success) {
            setError(texts.display_keys_gen_new_keys_error);
            setErrorPopup(true);
            setSubmitLoading(false);
        }
    }

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
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogTitle>{texts.display_keys_popup_dialog_title}</DialogTitle>
                    <DialogDescription>{texts.display_keys_dialog_description_1}</DialogDescription>
                    <DialogDescription>{texts.display_keys_dialog_description_2}</DialogDescription>
                    <br />
                <Button size="tiny" onClick={() => copyToClipboard(publicKeyArmored)}>{texts.display_keys_button_public_key_to_clipboard}</Button>
                <Button size="tiny" onClick={() => copyToClipboard(privateKeyArmored)}>{texts.display_keys_button_public_key_to_clipboard}</Button>
                <Button size="tiny" onClick={() => publicKey !== publicKeyArmored ? setPublicKey(publicKeyArmored) : setPublicKey('')}>{texts.display_keys_button_show_public_key}</Button>
                {publicKey && <p className="text-[6px] sm:text-xs">{publicKey}</p>}
                <Button size="tiny" onClick={() => privateKey !== privateKeyArmored ? setPrivateKey(privateKeyArmored) : setPrivateKey('')}>{texts.display_keys_button_show_private_key}</Button>
                {privateKey && <p className="text-[6px] sm:text-xs">{privateKey}</p>}
                <br />
                <DialogTitle>{texts.display_keys_gen_new_keys_dialog_title_1}</DialogTitle>
                <DialogDescription>{texts.display_keys_gen_new_keys_dialog_description_1}</DialogDescription>
                <DialogDescription>{texts.display_keys_gen_new_keys_dialog_description_2}</DialogDescription>
                {!passwordInput && <Button 
                    size="tiny" 
                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 dark:bg-red-300 dark:hover:bg-red-400 dark:active:bg-red-500"
                    onClick={() => setPasswordInput(true)}
                >
                    {texts.display_keys_gen_new_keys_button}
                </Button>}
                {passwordInput && <form className="grid grid-cols-2 items-center gap-4" onSubmit={handleSubmit}>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        ref={passwordRef}
                        required
                        placeholder={texts.display_keys_gen_new_keys_input_placeholder}
                        className="col-span-1"
                    />
                    {!submitLoading && <Button type="submit" className="bg-red-500 hover:bg-red-600 active:bg-red-700 dark:bg-red-300 dark:hover:bg-red-400 dark:active:bg-red-500">{texts.display_keys_gen_new_keys_submit_button}</Button>}
                    {submitLoading && <Loading />}
                    {errorPopup && error && <p className="text-red-500">{error}</p>}
                  </form>}
                {submitLoading && <DialogDescription>{texts.display_keys_gen_new_keys_loading_dialog_description}</DialogDescription>}
                {success && <p className="text-green-500">{texts.display_keys_gen_new_keys_success}</p>}
                <DialogDescription>{texts.display_keys_gen_new_keys_dialog_description_3}</DialogDescription>
                <Button size="tiny" onClick={() => setPgpKeysInfo(!pgpKeysInfo)}>{texts.display_keys_pgp_keys_info}</Button>
                {pgpKeysInfo && <PrivacyModelInfo />}
                </DialogContent>
            </Dialog>
        </>
    )
}
