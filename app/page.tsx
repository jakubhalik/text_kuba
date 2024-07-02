import SwitcherToLoginOrSignUp from '@/components/SwitcherToLoginOrSignUp';
import Login from '@/components/Login';
import { SignUp } from '@/components/SignUp';
import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { Pool } from 'pg';
import { Messenger } from '@/components/Messenger';
import SignOutForm from '@/components/SignOutForm';

interface FormData {
    username: string;
    password: string;
}

let loggedIn: boolean = false;
let sessionTimeout: NodeJS.Timeout | null = null;

async function login(
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
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
        resetSessionTimeout();
        return { success: true };
    } catch (error) {
        console.error('Database connection error:', error);
        return { success: false, error: 'Invalid credentials.' };
    }
}

async function signOut(): Promise<void> {
    'use server';
    loggedIn = false;
    sessionTimeout && clearTimeout(sessionTimeout);
}

function resetSessionTimeout(): void {
    sessionTimeout && clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(
        () => {
            loggedIn = false;
        },
        30 * 60 * 60 * 1000
    ); // 30 hours
}

export default async function Home() {
    loggedIn && resetSessionTimeout();

    return (
        <GlobalStates>
            <header className="flex px-6 sm:px-8 py-4 border-b">
                <nav className="flex gap-4 md:gap-8 ml-auto">
                    <ModeToggle />
                    {loggedIn && <SignOutForm action={signOut} />}
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
