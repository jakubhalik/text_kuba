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

import { getCookie, setCookie } from 'cookies-next';

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
            const userToLog = result.users!.find((user: { username: string }) => user.username === username);
            console.log(userToLog);
            console.log(result.publicKeys);
            const privateKeyForDecryption = await openpgp.readPrivateKey({
                armoredKey: privateKeyArmored,
            });
            const decryptedMessages = await Promise.all(result.chatMessages!.map(async (message) => {
                try {
                    // console.log('starting a try block of decrypting a message');
                    // console.log('public keys: ', publicKeys);
                    try {
                        let decryptedMessageText = null;
                        let decryptedDatetimeFrom = null;
                        let file = null;
                        let decryptedFileName = null;
                        if (message.send_to === username) {
                            try {
                                decryptedMessageText = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.text,
                                    }),
                                    decryptionKeys: privateKeyForDecryption,
                                    verificationKeys: await openpgp.readKey({ armoredKey: result.publicKeys![message.sent_by] }),
                                });
                                // console.log('this message was sent by the other person to you: ', decryptedMessageText);
                            } catch (e) {
                                console.error('error in transferring message text sent by the other person than me to me: ', e);
                                return { ...message, text: 'error in transferring message text sent by the other person than me to me' }
                            }
                            try {
                                decryptedDatetimeFrom = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.datetime_from,
                                    }),
                                    decryptionKeys: privateKeyForDecryption,
                                    verificationKeys: await openpgp.readKey({ armoredKey: result.publicKeys![message.sent_by] }),
                                });
                                // console.log('this is datetime_from of the message that was sent by the other person to you: ', decryptedMessageText);
                            } catch (e) {
                                console.error('error in transferring datetime_from of the message sent by the other person than me to me: ', e);
                                return { ...message, text: 'error in transferring datetime_from of the message sent by the other person than me to me' }
                            }
                            if (message.file) {
                                try {
                                    const decryptedFile = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.file,
                                        }),
                                        decryptionKeys: privateKeyForDecryption,
                                        verificationKeys: await openpgp.readKey({ armoredKey: result.publicKeys![message.sent_by] }),
                                    });
                                    file = decryptedFile.data as string;
                                } catch (e) {
                                    console.error('Error decrypting file:', e);
                                }
                            }
                            if (message.filename) {
                                try {
                                    decryptedFileName = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.filename,
                                        }),
                                        decryptionKeys: privateKeyForDecryption,
                                        verificationKeys: await openpgp.readKey({ armoredKey: result.publicKeys![message.sent_by] }),
                                    });
                                } catch (e) {
                                    console.error('Error decrypting filename:', e);
                                }
                            }
                            return {
                                ...message,
                                text: decryptedMessageText.data as string,
                                datetime_from: new Date(decryptedDatetimeFrom.data as string).toLocaleString(),
                                file: file ? file : null,
                                filename: decryptedFileName ? decryptedFileName.data as string : null,
                            };
                        } else {
                            decryptedMessageText = await openpgp.decrypt({
                                message: await openpgp.readMessage({
                                    armoredMessage: message.text,
                                }),
                                decryptionKeys: privateKeyForDecryption,
                            });
                            // console.log('this message was sent by you: ', decryptedMessageText);
                            decryptedDatetimeFrom = await openpgp.decrypt({
                                message: await openpgp.readMessage({
                                    armoredMessage: message.datetime_from,
                                }),
                                decryptionKeys: privateKeyForDecryption,
                            });
                            // console.log('this datetime_from is from the message that was sent by you: ', decryptedMessageText);
                            if (message.file) {
                                try {
                                    const decryptedFile = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.file,
                                        }),
                                        decryptionKeys: privateKeyForDecryption,
                                    });
                                    file = decryptedFile.data as string;
                                } catch (e) {
                                    console.error('Error decrypting file:', e);
                                }
                            }
                            if (message.filename) {
                                try {
                                    decryptedFileName = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.filename,
                                        }),
                                        decryptionKeys: privateKeyForDecryption,
                                    });
                                } catch (e) {
                                    console.error('Error decrypting filename:', e);
                                }
                            }
                            return {
                                ...message,
                                text: decryptedMessageText.data as string,
                                datetime_from: new Date(decryptedDatetimeFrom.data as string).toLocaleString(),
                                file: file ? file : null,
                                filename: decryptedFileName ? decryptedFileName.data as string : null,
                            };
                        }
                    } catch (e) { 
                        console.error('Error even executing the if username === message.send_to: ', e); 
                        return { ...message, text: 'Error even executing the if username === message.send_to: ', e } 
                    }
                } catch (e) {
                    console.error('Error decrypting message text:', e);
                    return { ...message, text: 'Error decrypting message' };
                }
            }));
            console.log(decryptedMessages);
            const { privateKey, publicKey } = await openpgp.generateKey({
                type: 'ecc',
                curve: 'curve25519',
                userIDs: [{ name: username }],
            });
            const newPrivateKey = privateKey;
            const newPublicKey = publicKey;
            const privateKeyForSigning = await openpgp.readPrivateKey({
                armoredKey: newPrivateKey,
            });
            const reEncryptedMessages = await Promise.all(decryptedMessages.map(async (message) => {
                try {
                    const encryptedMessageText = await openpgp.encrypt({
                        message: await openpgp.createMessage({ text: message.text }),
                        encryptionKeys: await openpgp.readKey({ armoredKey: newPublicKey }),
                        signingKeys: privateKeyForSigning,
                        format: 'armored',
                    }) as string;
                    const encryptedDatetimeFrom = await openpgp.encrypt({
                        message: await openpgp.createMessage({ text: message.datetime_from }),
                        encryptionKeys: await openpgp.readKey({ armoredKey: newPublicKey }),
                        signingKeys: privateKeyForSigning,
                        format: 'armored',
                    }) as string;
                    const encryptedFile = message.file ? await openpgp.encrypt({
                        message: await openpgp.createMessage({ text: message.file as unknown as string }),
                        encryptionKeys: await openpgp.readKey({ armoredKey: newPublicKey }),
                        signingKeys: privateKeyForSigning,
                        format: 'armored',
                    }) as string : null;
                    const encryptedFileName = message.filename ? await openpgp.encrypt({
                        message: await openpgp.createMessage({ text: message.filename }),
                        encryptionKeys: await openpgp.readKey({ armoredKey: newPublicKey }),
                        signingKeys: privateKeyForSigning,
                        format: 'armored',
                    }) as string : null;
                    return {
                        ...message,
                        text: encryptedMessageText,
                        datetime_from: encryptedDatetimeFrom,
                        file: encryptedFile,
                        filename: encryptedFileName,
                    }
                } catch (e) {
                    console.error('Error re-encrypting message:', e);
                    return { ...message, text: 'Error re-encrypting message' };
                }
            }));
            console.log(reEncryptedMessages);
            const reEncrypt = true;
            const resultTwo = await action(formData!, false, reEncrypt, reEncryptedMessages, newPublicKey);
            if (resultTwo.action === 're-encrypted') {
                console.log('Reencrypting successful.');
                setCookie('privateKey', newPrivateKey, { path: '/', secure: true, sameSite: 'strict' });
                setCookie('publicKey', newPublicKey, { path: '/', secure: true, sameSite: 'strict' });
                setSuccess(true);
            }
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
