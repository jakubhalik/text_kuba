'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';

import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { useLanguage } from './GlobalStates';

import { loadLanguage, FormData, XIcon, Eye, ClosedEye, LoginActionPromise, SignUpActionPromise } from '@/lib/utils';

import * as openpgp from 'openpgp';

import { getCookie, setCookie } from 'cookies-next';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogAction,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';






export default function LoginOrSignUp({
    loginAction,
    signUpAction,
}: {
    loginAction: (
        formData: FormData
    ) => Promise<LoginActionPromise>;
    signUpAction: (
        formData: FormData
    ) => Promise<SignUpActionPromise>;
}) {
    const { language } = useLanguage();
    
    const texts = loadLanguage(language);

    const [isLogin, setIsLogin] = useState<boolean>(true);

    const [data, setData] = useState<FormData>({
        username: '',
        encryptedUsername: '',
        encryptedPassword: '',
        publicKey: '',
    });

    const [error, setError] = useState<string>('');

    const passwordRef = useRef<HTMLInputElement>(null);

    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [privateKey, setPrivateKey] = useState<string>('');

    const [privateKeyIntoCookiesPopup, setPrivateKeyIntoCookiesPopup] = useState(false);

    const [submitLoading, setSubmitLoading] = useState(false);

    const [hiddenPrivateKeyTextarea, setHiddenPrivateKeyTextarea] = useState(true);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const getPassword = () => passwordRef.current?.value || '';

    const getConfirmPassword = () => confirmPasswordRef.current?.value || '';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        if (!isLogin && getPassword() !== getConfirmPassword()) {
            setError(texts.password_mismatch);
            return;
        }

        try {

            if (isLogin) {
                setTimeout(() => {
                    setError('Invalid credentials');
                    setSubmitLoading(false);
                }, 10000);
                setSubmitLoading(true);

                const privateKeyArmored = getCookie('privateKey') as string;

                console.log('Private key armored: ', privateKeyArmored);

                if (!privateKeyArmored) {
                    setError('Private key not found in cookies');
                    return;
                }

                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });

                console.log('Private key unarmored: ', privateKey);

                const encryptedUsername = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: data.username,
                    }),
                    signingKeys: privateKey,
                    format: 'armored',
                });

                const encryptedPassword = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: getPassword(),
                    }),
                    signingKeys: privateKey,
                    format: 'armored',
                });

                const formData: FormData = {
                    username: data.username,
                    encryptedUsername: encryptedUsername as string,
                    encryptedPassword: encryptedPassword as string,
                };

                const result = await loginAction(formData);

                console.log('Result Action:', result.action);
                console.log('Result Success:', result.success);

                if (result.action === 'generate keys') {

                    const { privateKey, publicKey } = await openpgp.generateKey({
                        type: 'ecc',
                        curve: 'curve25519',
                        userIDs: [{ name: data.username }],
                    });

                    const publicKeyArmored = publicKey;
                    const privateKeyArmored = privateKey;

                    const encryptedUsername = await openpgp.sign({
                        message: await openpgp.createMessage({
                            text: data.username,
                        }),
                        signingKeys: await openpgp.readPrivateKey({
                            armoredKey: privateKeyArmored,
                        }),
                        format: 'armored',
                    });

                    const encryptedPassword = await openpgp.sign({
                        message: await openpgp.createMessage({
                            text: getPassword(),
                        }),
                        signingKeys: await openpgp.readPrivateKey({
                            armoredKey: privateKeyArmored,
                        }),
                        format: 'armored',
                    });

                    setCookie('privateKey', privateKeyArmored, {
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                    });

                    setCookie('publicKey', publicKeyArmored, {
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                    });

                    const checkForTheCookie = getCookie('privateKey') as string;
                    console.log('Cookie got set and got: ', checkForTheCookie);

                    const formData: FormData = {
                        username: data.username,
                        encryptedUsername: encryptedUsername as string,
                        encryptedPassword: encryptedPassword as string,
                        publicKey: publicKeyArmored,
                    };

                    console.log('Generated new keys in login for owner and calling login action again with different formData arguments.');

                    const checkForThePrivateKeyCookie = 
                        getCookie('privateKey') as string;
                    console.log(
                        'Cookie got set and got: ', checkForThePrivateKeyCookie
                    );

                    const checkForThePublicKeyCookie = 
                        getCookie('privateKey') as string;
                    console.log(
                        'Cookie got set and got: ', checkForThePublicKeyCookie
                    );

                    // test ->
                    try {
                        const message = 'Hello, this is a test message!';

                        const encrypted = await openpgp.encrypt({
                            message: await openpgp.createMessage({ text: message }),
                            encryptionKeys: await openpgp.readKey({ armoredKey: publicKeyArmored }),
                        });

                        console.log('Encrypted Message:', encrypted);

                        const privateKey = await openpgp.readPrivateKey({
                            armoredKey: privateKeyArmored,
                        });
                        console.log('private key: ', privateKey);

                        const decrypted = await openpgp.decrypt({
                            message: await openpgp.readMessage({ armoredMessage: encrypted }),
                            decryptionKeys: privateKey,
                        });

                        console.log('Decrypted Message:', decrypted.data);
                    } catch (error) {
                        console.error('Decrypt message test error:', error);
                    }
                    // test <-

                    const result = await loginAction(formData);

                    if (result.success) {
                        setSubmitLoading(false);
                        return;
                    }

                } else if (result.success) {
                    setSubmitLoading(false);

                    return;

                } else {
                    setSubmitLoading(false);

                    setError(texts.login_failed);
                }

            } else {
                // Sign-up logic
                
                setSubmitLoading(true);

                const { privateKey, publicKey } = await openpgp.generateKey({
                    type: 'ecc',
                    curve: 'curve25519',
                    userIDs: [{ name: data.username }],
                });

                const publicKeyArmored = publicKey;
                const privateKeyArmored = privateKey;

                const encryptedUsername = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: data.username,
                    }),
                    signingKeys: await openpgp.readPrivateKey({
                        armoredKey: privateKeyArmored,
                    }),
                    format: 'armored',
                });

                const encryptedPassword = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: getPassword(),
                    }),
                    signingKeys: await openpgp.readPrivateKey({
                        armoredKey: privateKeyArmored,
                    }),
                    format: 'armored',
                });

                setCookie('privateKey', privateKeyArmored, {
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                });

                setCookie('publicKey', publicKeyArmored, {
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                });

                const checkForTheCookie = getCookie('privateKey') as string;
                console.log('Cookie got set and got: ', checkForTheCookie);

                const formData: FormData = {
                    username: data.username,
                    encryptedUsername: encryptedUsername as string,
                    encryptedPassword: encryptedPassword as string,
                    publicKey: publicKeyArmored,
                };

                const result = await signUpAction(formData);

                if (result.success) {
                    setSubmitLoading(false);

                    return;

                } else {
                    setSubmitLoading(false);
                    setError(texts.signup_failed);
                }

            }

        } catch (error) {
            setSubmitLoading(false);
            // Encryption error
            setError(texts.login_failed);
        }

    };

    return (
        <>
            <div className="mx-auto max-w-sm space-y-6 pt-20 px-4">
                <div className="space-y-2 text-center">
                    <h1
                        className="text-3xl font-bold"
                        data-cy={isLogin ? 'login_h' : 'signup_h'}
                    >
                        {isLogin ? texts.login_h : texts.signup_h}
                    </h1>
                    <p
                        className="text-gray-500 dark:text-gray-400"
                        data-cy="welcome_p"
                    >
                        {texts.welcome_p}
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="username" data-cy="username_label">
                            {texts.username_label}
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder={texts.username_input_placeholder}
                            value={data.username}
                            onChange={handleChange}
                            required
                            data-cy="username_input_placeholder"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" data-cy="password_label">
                            {texts.password_label}
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={texts.password_input_placeholder}
                            ref={passwordRef}
                            required
                            data-cy="password_input_placeholder"
                        />
                        {!isLogin && (
                            <>
                                <Label
                                    htmlFor="confirm-password"
                                    data-cy="confirm_password_label"
                                >
                                    {texts.confirm_password_label}
                                </Label>
                                <Input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    placeholder={
                                        texts.confirm_password_input_placeholder
                                    }
                                    data-cy="confirm_password_input_placeholder"
                                    ref={confirmPasswordRef}
                                    required
                                />
                            </>
                        )}
                    </div>
                    <AlertDialog
                        open={privateKeyIntoCookiesPopup}
                        onOpenChange={setPrivateKeyIntoCookiesPopup}
                    >
                        <AlertDialogTrigger asChild>
                            <button className="hidden">Open</button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle>Set private key into strict cookies</AlertDialogTitle>
                            <button
                                className="absolute top-[13px] right-14 rounded-full p-1"
                                onClick={() => setHiddenPrivateKeyTextarea(!hiddenPrivateKeyTextarea)}
                            >
                                {hiddenPrivateKeyTextarea ? <ClosedEye /> : <Eye />}
                            </button>
                            <button
                                className="absolute top-4 right-4 rounded-full p-1 text-red-500 hover:text-red-600"
                                onClick={() => setPrivateKeyIntoCookiesPopup(false)}
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                            <VisuallyHidden>
                                <AlertDialogDescription>Set private key into strict cookies</AlertDialogDescription>
                            </VisuallyHidden>
                            <textarea
                                id="private-key"
                                name="Private key"
                                placeholder="Enter your private key"
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                ref={textareaRef}
                                required
                                data-cy="private_key_input_placeholder"
                                className={`w-full p-2 rounded-md ${hiddenPrivateKeyTextarea && 'text-transparent tracking-widest caret-transparent'}`}
                            />
                            <AlertDialogAction
                                className="py-1 bg-red-500 hover:bg-red-600 active:bg-red-700 dark:bg-red-300 dark:hover:bg-red-400 dark:active:bg-red-500"
                                onClick={() => {
                                    if (privateKey) {
                                        const key = privateKey;
                                        setCookie('privateKey', key, {
                                            path: '/',
                                            secure: true,
                                            sameSite: 'strict',
                                        });
                                        console.log('The inputted private key: ', key);
                                        setPrivateKeyIntoCookiesPopup(false);
                                        if (data.username && getPassword()) {
                                            handleSubmit(new Event('submit') as FormEvent<HTMLFormElement>);
                                        }
                                    } else {
                                        setError('Please enter a private key.');
                                    }
                                }}
                            >
                                Set
                            </AlertDialogAction>
                        </AlertDialogContent>
                    </AlertDialog>
                    {!submitLoading ? 
                        error && (
                            <p className="text-red-500" data-cy="error">
                                {error}
                            </p>
                        ) 
                    :
                        <div className="flex justify-center mt-4">
                            <svg
                                className="animate-spin h-8 w-8 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291l-2.293 2.293a1 1 0 001.414 1.414L8 18.414A8.001 8.001 0 016 17.291z"
                                ></path>
                            </svg>
                        </div>
                    }
                    {!isLogin && (
                        <div className="flex items-center space-x-2 px-1">
                            <Label
                                className="text-sm leading-1"
                                htmlFor="terms"
                                data-cy="signup_information"
                            >
                                {texts.signup_information}
                            </Label>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full"
                        data-cy={isLogin ? 'login_button' : 'signup_button'}
                    >
                        {isLogin ? texts.login_button : texts.signup_button}
                    </Button>
                    {isLogin && 
                        <Button
                            data-cy="set_private_key_to_cookies"
                            className="
                                w-full 
                                bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                dark:bg-blue-400 dark:hover:bg-blue-500 dark:active:bg-blue-600
                            "
                            onClick={() => { 
                                setPrivateKeyIntoCookiesPopup(true)
                                setTimeout(() => {
                                    if (textareaRef.current) {
                                        textareaRef.current.focus();
                                    }
                                }, 0);
                            }}
                        >
                            Set private key to cookies
                        </Button>
                    }
                </form>
            </div>
            <div
                className="mt-4 text-center text-sm pb-8"
                data-cy={isLogin ? 'dont_have_account' : 'have_account'}
            >
                {isLogin ? texts.dont_have_account : texts.have_account}
                <button
                    className="underline pl-1"
                    onClick={() => setIsLogin(!isLogin)}
                    data-cy={isLogin ? 'switch_to_sign_up' : 'switch_to_login'}
                >
                    {isLogin ? texts.switch_to_sign_up : texts.switch_to_login}
                </button>
            </div>
        </>
    );
}
