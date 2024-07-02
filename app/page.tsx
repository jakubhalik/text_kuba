import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { LangToggle } from '@/components/LangToggle';
import { Pool } from 'pg';
import { Messenger } from '@/components/Messenger';
import SignOutForm from '@/components/SignOutForm';
import LoginOrSignUp from '@/components/LoginOrSignUp';

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
            <header className="flex pr-4 py-4 border-b">
                <nav className="flex gap-2 ml-auto">
                    <ModeToggle />
                    <LangToggle />
                    {loggedIn && <SignOutForm action={signOut} />}
                </nav>
            </header>
            {loggedIn ? <Messenger /> : <LoginOrSignUp loginAction={login} />}
        </GlobalStates>
    );
}
