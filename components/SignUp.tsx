import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SignUp() {
    return (
        <div className="mx-auto max-w-sm space-y-6 pt-20">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Sign Up</h1>
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
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                        id="confirm-password"
                        required
                        type="password"
                        placeholder="Confirm your password"
                    />
                </div>
                <div className="flex items-center space-x-2 px-1">
                    <Label className="text-sm leading-1" htmlFor="terms">
                        By creating an account you are creating a disk which is
                        encrypted with your credentials that only you know, so
                        you must not forget your password or you will loose your
                        access to the platform!
                    </Label>
                </div>
                <Button className="w-full">Sign Up</Button>
            </div>
        </div>
    );
}