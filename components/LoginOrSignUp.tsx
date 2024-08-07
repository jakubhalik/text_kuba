'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChangeEvent, useRef, useState } from 'react';
import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';

interface FormData {
    username: string;
    password: string;
}

const useSecureFormState = (initialData: { username: string }) => {
    const [data, setData] = useState(initialData);

    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const getPassword = () => passwordRef.current?.value || '';
    const getConfirmPassword = () => confirmPasswordRef.current?.value || '';

    return [
        data,
        handleChange,
        passwordRef,
        confirmPasswordRef,
        getPassword,
        getConfirmPassword,
    ] as const;
};

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

    const [
        data,
        handleChange,
        passwordRef,
        confirmPasswordRef,
        getPassword,
        getConfirmPassword,
    ] = useSecureFormState({
        username: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData: FormData = {
            username: data.username,
            password: getPassword(),
        };

        if (!isLogin && getPassword() !== getConfirmPassword()) {
            setError(texts.password_mismatch);
            return;
        }

        const result = isLogin
            ? await loginAction(formData)
            : await signUpAction(formData);

        if (result.success) {
            window.location.href = '/'; // Redirect to reload the page and trigger the logged-in state
        } else {
            setError(isLogin ? texts.login_failed : texts.signup_failed);
        }
    };

    const switchLS = () => {
        setError('');
        setIsLogin(!isLogin);
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
                    <Link
                        className="text-sm underline"
                        href="https://github.com/jakubhalik/text_kuba"
                        data-cy="deploy_link"
                    >
                        {texts.deploy_link}
                    </Link>
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
                className="mt-4 text-center text-sm"
                data-cy={isLogin ? 'dont_have_account' : 'have_account'}
            >
                {isLogin ? texts.dont_have_account : texts.have_account}
                <button
                    className="underline pl-1"
                    onClick={switchLS}
                    data-cy={isLogin ? 'switch_to_sign_up' : 'switch_to_login'}
                >
                    {isLogin ? texts.switch_to_sign_up : texts.switch_to_login}
                </button>
            </div>
        </>
    );
}
