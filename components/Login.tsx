import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Login() {
    return (
        <div className="mx-auto max-w-sm space-y-6 pt-20">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Login</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Text privately with your friend running this app on his own
                    server with full encryption!
                </p>
                <Link className="text-sm underline" href="">
                    Deploy your own instance
                </Link>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        placeholder="Enter your username"
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
                    />
                </div>
                <Button className="w-full">Login</Button>
            </div>
        </div>
    );
}
