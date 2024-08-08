'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from './GlobalStates';
import { loadLanguage, FormData } from '@/lib/utils';
import * as openpgp from 'openpgp';
import { getCookie, setCookie } from 'cookies-next';

export default function LoginOrSignUp({
    loginAction,
    signUpAction,
}: {
    loginAction: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string }>;
    signUpAction: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string }>;
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
                const privateKeyArmored = getCookie('privateKey') as string;

                console.log('Private key armored: ', privateKeyArmored);

                if (!privateKeyArmored) {
                    setError('Private key not found in cookies');

                    return;
                }

                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });

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

                if (result.success) {

                    return;

                } else {
                    setError(texts.login_failed);
                }

            } else {
                // Sign-up logic
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
                    return;
                } else {
                    setError(texts.signup_failed);
                }
            }
        } catch (error) {
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
                    {error && (
                        <p className="text-red-500" data-cy="error">
                            {error}
                        </p>
                    )}
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
