'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChangeEvent, useRef, useState } from 'react';

interface FormData {
    username: string;
    password: string;
}

const useSecureFormState = (initialData: { username: string }) => {
    const [data, setData] = useState(initialData);

    const passwordRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const getPassword = () => passwordRef.current?.value || '';

    return [data, handleChange, passwordRef, getPassword] as const;
};

export default function Login({
    action,
}: {
    action: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string }>;
}) {
    const [data, handleChange, passwordRef, getPassword] = useSecureFormState({
        username: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData: FormData = {
            username: data.username,
            password: getPassword(),
        };
        const result = await action(formData);
        if (result.success) {
            window.location.href = '/'; // Redirect to reload the page and trigger the logged-in state
        } else {
            setError(result.error || 'Login failed.');
        }
    };

    return (
        <>
            <div className="mx-auto max-w-sm space-y-6 pt-20 px-4">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Login</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Text privately with your friend running this app on his
                        own server with full encryption!
                    </p>
                    <Link
                        className="text-sm underline"
                        href="https://github.com/jakubhalik/text_kuba"
                    >
                        Deploy your own instance
                    </Link>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="Enter your username"
                            value={data.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            ref={passwordRef}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </form>
            </div>
        </>
    );
}
