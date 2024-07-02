import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { LangToggle } from '@/components/LangToggle';
import { Pool } from 'pg';
import { Messenger } from '@/components/Messenger';
import SignOutForm from '@/components/SignOutForm';
import LoginOrSignUp from '@/components/LoginOrSignUp';
import { postgresUserPool } from '@/postgresConfig';
import crypto from 'crypto';

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

async function signUp(
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    'use server';
    try {
        const client = await postgresUserPool.connect();
        const username = formData.username;
        const combinedPassword = `${formData.username}${formData.password}`;
        const hashedPassword = crypto
            .createHash('sha256')
            .update(combinedPassword)
            .digest('hex');

        await client.query(`
            CREATE USER "${username}" WITH PASSWORD '${formData.password}';
            GRANT "user" TO "${username}";
        `);

        await client.query(`
            CREATE SCHEMA "${username}_schema" AUTHORIZATION "${username}";
            GRANT ALL ON SCHEMA "${username}_schema" TO "${username}";
            GRANT USAGE ON SCHEMA "${username}_schema" TO postgres;
        `);

        client.release();

        // Connect as the new user to create tables
        const newUserPostgresAccount = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'text_kuba',
            user: username,
            password: formData.password,
        });

        const userClient = await newUserPostgresAccount.connect();

        await userClient.query(`
            CREATE TABLE "${username}_schema"."messages_table" (
                datetime_from TIMESTAMPTZ,
                send_by TEXT,
                send_to TEXT,
                text TEXT
            );
            CREATE TABLE "${username}_schema"."profile_table" (
                name TEXT,
                email TEXT,
                phone_number TEXT,
                avatar BYTEA,
                theology TEXT,
                philosophy TEXT
            );
            INSERT INTO "${username}_schema"."profile_table" (name) VALUES ('${username}');
            UPDATE "${username}_schema"."profile_table" SET
                name = pgp_sym_encrypt(name::text, '${hashedPassword}'),
                email = pgp_sym_encrypt(email::text, '${hashedPassword}'),
                phone_number = pgp_sym_encrypt(phone_number::text, '${hashedPassword}'),
                avatar = pgp_sym_encrypt(encode(avatar, 'hex'), '${hashedPassword}'),
                theology = pgp_sym_encrypt(theology::text, '${hashedPassword}'),
                philosophy = pgp_sym_encrypt(philosophy::text, '${hashedPassword}');
            UPDATE "${username}_schema"."messages_table" SET
                send_by = pgp_sym_encrypt(send_by::text, '${hashedPassword}'),
                send_to = pgp_sym_encrypt(send_to::text, '${hashedPassword}'),
                text = pgp_sym_encrypt(text::text, '${hashedPassword}');
        `);

        userClient.release();
        return await login(formData);
    } catch (error) {
        console.error('SignUp error:', error);
        return { success: false, error: 'Sign up failed.' };
    }
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
            {loggedIn ? (
                <Messenger />
            ) : (
                <LoginOrSignUp loginAction={login} signUpAction={signUp} />
            )}
        </GlobalStates>
    );
}
