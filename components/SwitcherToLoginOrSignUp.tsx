'use client';

import { ReactNode, useState } from 'react';

export default function SwitcherToLoginOrSignUp({
    signUp,
    login,
}: {
    signUp: ReactNode;
    login: ReactNode;
}) {
    const [isLogin, setIsLogin] = useState<Boolean>(true);

    return (
        <>
            {isLogin ? login : signUp}
            <div className="mt-4 text-center text-sm">
                {isLogin
                    ? `Don't have an account yet?`
                    : 'Already have an account?'}
                <button
                    className="underline pl-1"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'Sign up' : 'Login'}
                </button>
            </div>
        </>
    );
}
