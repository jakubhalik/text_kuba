import { Pool } from 'pg';
import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { LangToggle } from '@/components/LangToggle';
import { Messenger } from '@/components/Messenger';
import SignOutForm from '@/components/SignOutForm';
import LoginOrSignUp from '@/components/LoginOrSignUp';
import crypto from 'crypto';
import { postgresUserPool, host, port, owner } from '@/postgresConfig';
import { profile_table, messages_table } from '@/lib/utils';

interface FormData {
    username: string;
    password: string;
}

let loggedIn: boolean = false;
let sessionTimeout: NodeJS.Timeout | null = null;

let username: string;
let password: string;

async function login(
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    'use server';
    const pool = new Pool({
        host,
        port,
        database: `text_${owner}`,
        user: formData.username,
        password: formData.password,
    });
    try {
        const client = await pool.connect();
        client.release();
        username = formData.username;
        password = formData.password;
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
        `);

        client.release();

        // Connect as the new user to create tables
        const newUserPostgresAccount = new Pool({
            host,
            port,
            database: `text_${owner}`,
            user: username,
            password: formData.password,
        });

        const userClient = await newUserPostgresAccount.connect();

        await userClient.query(`
            CREATE TABLE "${username}_schema"."messages_table" (
                ${messages_table
                .map(
                    (i) => `
                        ${i} ${i === 'datetime_from'
                            ? 'TIMESTAMPTZ'
                            : i === 'file'
                                ? 'BYTEA'
                                : 'TEXT'
                        }${i !== 'filename' ? ', ' : ''}`
                )
                .join('')}
            );

            CREATE TABLE "${username}_schema"."profile_table" (
                ${profile_table
                .map(
                    (i) =>
                        `${i} ${i === 'avatar' ? 'BYTEA' : 'TEXT'
                        }${i !== 'philosophy' ? ', ' : ''}`
                )
                .join('')}
            );

            INSERT INTO "${username}_schema"."profile_table" (name) VALUES ('${username}');

            UPDATE "${username}_schema"."profile_table" SET
                ${profile_table
                .map(
                    (i) =>
                        `${i} = pgp_sym_encrypt(
                            ${i === 'avatar' ? `encode(${i}, 'hex')` : i}::text, '${hashedPassword}')${i !== 'philosophy' ? ', ' : ''}`
                )
                .join('')}
            ;

            UPDATE "${username}_schema"."messages_table" SET
                ${messages_table
                .map(
                    (i) => `
                     ${i} = pgp_sym_encrypt(
                        ${i === 'file' ? `encode(${i}, 'hex')` : i}::text, '${hashedPassword}')${i === 'datetime_from' ? '::text::timestamptz' : ''}${i !== 'filename' ? ', ' : ''}`
                )
                .join('')}
            ;
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
                <Messenger username={username} password={password} />
            ) : (
                <LoginOrSignUp loginAction={login} signUpAction={signUp} />
            )}
        </GlobalStates>
    );
}
