'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface FormData {
    username: string;
    password: string;
}

export default function Login({
    action,
}: {
    action: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string }>;
}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData: FormData = { username, password };
        const result = await action(formData);
        if (result.success) {
            window.location.href = '/'; // Redirect to reload the page and trigger the logged-in state
        } else {
            setError(result.error || 'Login failed.');
        }
    };

    return (
        <>
            <div className="mx-auto max-w-sm space-y-6 pt-20">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Login</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Text privately with your friend running this app on his
                        own server with full encryption!
                    </p>
                    <Link className="text-sm underline" href="">
                        Deploy your own instance
                    </Link>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            required
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
