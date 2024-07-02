import SwitcherToLoginOrSignUp from '@/components/SwitcherToLoginOrSignUp';
import Login from '@/components/Login';
import { SignUp } from '@/components/SignUp';
import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { Pool } from 'pg';
import { Messenger } from '@/components/Messenger';

let loggedIn: Boolean = false;

export default async function Home() {
    async function login({
        formData,
    }: {
        formData: { username: string; password: string };
    }) {
        'use server';
        const pool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'text_kuba',
            user: formData.username,
            password: formData.password,
        });
        try {
            const client = await pool.connect();
            client.release();
            loggedIn = true;
            return { success: true };
        } catch (error) {
            console.error('Database connection error:', error);
            return { success: false, error: 'Invalid credentials.' };
        }
    }

    return (
        <GlobalStates>
            <header className="flex px-6 sm:px-8 py-4 border-b">
                <nav className="flex gap-4 md:gap-8 ml-auto">
                    <ModeToggle />
                </nav>
            </header>
            {loggedIn ? (
                <Messenger />
            ) : (
                <SwitcherToLoginOrSignUp
                    signUp={<SignUp />}
                    login={<Login action={login} />}
                />
            )}
        </GlobalStates>
    );
}
