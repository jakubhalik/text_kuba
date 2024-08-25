'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { useLanguage } from './GlobalStates';

import { loadLanguage, FormData, XIcon, Eye, ClosedEye, LoginActionPromise, SignUpActionPromise, handleEncryptedLogin, handleKeyGeneration } from '@/lib/utils';

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

import Loading from '@/components/Loading';
import PrivacyModelInfo from './PrivacyModelInfo';



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
                const formData = await handleEncryptedLogin({
                    username: data.username,
                    setError,
                    texts: { login_failed: texts.login_failed, private_key_not_in_cookies: texts.private_key_not_in_cookies },
                    getPassword,
                    setSubmitLoading,
                    getCookie,
                });
                const result = await loginAction(formData!);
                // console.log('Result Action:', result.action);
                // console.log('Result Success:', result.success);
                if (result.action === 'generate keys') {
                    const formData = await handleKeyGeneration({
                        username: data.username,
                        password: getPassword(),
                        setError,
                        setSubmitLoading,
                        setCookie,
                        texts,
                    });
                    if (formData) {
                        const retryResult = await loginAction(formData);
                        if (retryResult.success) return;
                    }
                    // const checkForTheCookie = getCookie('privateKey') as string;
                    // console.log('Cookie got set and got: ', checkForTheCookie);
                    // console.log('Generated new keys in login for owner and calling login action again with different formData arguments.');
                    // const checkForThePrivateKeyCookie = getCookie('privateKey') as string;
                    // console.log('Cookie got set and got: ', checkForThePrivateKeyCookie);
                    // const checkForThePublicKeyCookie = getCookie('privateKey') as string;
                    // console.log('Cookie got set and got: ', checkForThePublicKeyCookie);
                    const result = await loginAction(formData!);
                    if (result.success) {
                        return;
                    }
                } else if (result.success) {
                    return;
                } else {
                    setSubmitLoading(false);
                    setError(texts.login_failed);
                }
            } else {
                const signUpFormData = await handleKeyGeneration({
                    username: data.username,
                    password: getPassword(),
                    setError,
                    setSubmitLoading,
                    setCookie,
                    texts,
                });                
                // const checkForTheCookie = getCookie('privateKey') as string;
                // console.log('Cookie got set and got: ', checkForTheCookie);
                const result = await signUpAction(signUpFormData!);
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
                            type="password"
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
                            <AlertDialogTitle>
                                {texts.private_key_to_strict_cookies_alert_dialog_title}
                            </AlertDialogTitle>
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
                                <AlertDialogDescription>
                                    {texts.private_key_to_strict_cookies_alert_dialog_description}
                                </AlertDialogDescription>
                            </VisuallyHidden>
                            <textarea
                                id="private-key"
                                name="Private key"
                                placeholder={texts.enter_private_key_input_placeholder}
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
                                        // console.log('The inputted private key: ', key);
                                        setPrivateKeyIntoCookiesPopup(false);
                                        if (data.username && getPassword()) {
                                            handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>);
                                        }
                                    } else {
                                        setError(texts.enter_private_key);
                                    }
                                }}
                            >
                                {texts.set_private_key_button_text}
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
                        <Loading />
                    }
                    {!isLogin && <PrivacyModelInfo />}
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
                            {texts.private_key_to_strict_cookies_button}
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
