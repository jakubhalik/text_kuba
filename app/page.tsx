import { Pool } from 'pg';
import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { LangToggle } from '@/components/LangToggle';
import { Messenger } from '@/components/Messenger';
import SignOutForm from '@/components/SignOutForm';
import LoginOrSignUp from '@/components/LoginOrSignUp';
import crypto from 'crypto';
import {
    postgresUserPool,
    host,
    port,
    owner,
    postgres_password,
} from '@/postgresConfig';
import { profile_table, messages_table } from '@/lib/utils';
import { cookies } from 'next/headers';

interface FormData {
    username: string;
    password: string;
}

let loggedIn: boolean = false;
let sessionTimeout: NodeJS.Timeout | null = null;

async function transferMessagesToUser(
    username: string,
    password: string
): Promise<void> {
    'use server';
    const client = await postgresUserPool.connect();

    const postgresCombinedPassword = `postgres${postgres_password}`;
    const postgresHashedPassword = crypto
        .createHash('sha256')
        .update(postgresCombinedPassword)
        .digest('hex');

    const queryForMessages = `
        SELECT
            pgp_sym_decrypt(datetime_from::bytea, $1) as datetime_from,
            pgp_sym_decrypt(sent_by::bytea, $1) as sent_by,
            pgp_sym_decrypt(send_to::bytea, $1) as send_to,
            pgp_sym_decrypt(text::bytea, $1) as text
        FROM "postgres_schema".messages_table
        WHERE pgp_sym_decrypt(send_to::bytea, $1) = $2;
    `;

    console.log(
        'Executing query with hashed password:',
        postgresHashedPassword
    );
    console.log('Looking for messages sent to:', username);

    const resultForMessages = await client.query(queryForMessages, [
        postgresHashedPassword,
        username,
    ]);

    console.log('Query result:', resultForMessages.rows);

    if (resultForMessages.rows.length === 0) {
        console.log('No messages to transfer.');
        client.release();
        return;
    }

    const userPool = new Pool({
        host,
        port,
        database: `text_${owner}`,
        user: username,
        password: password,
    });

    const userClient = await userPool.connect();

    const userCombinedPassword = `${username}${password}`;
    const userHashedPassword = crypto
        .createHash('sha256')
        .update(userCombinedPassword)
        .digest('hex');

    for (const message of resultForMessages.rows) {
        await userClient.query(
            `INSERT INTO "${username}_schema".messages_table (datetime_from, sent_by, send_to, text) VALUES
            (pgp_sym_encrypt($1::text, $2), pgp_sym_encrypt($3, $2), pgp_sym_encrypt($4, $2), pgp_sym_encrypt($5, $2))`,
            [
                message.datetime_from,
                userHashedPassword,
                message.sent_by,
                message.send_to,
                message.text,
            ]
        );
    }

    await client.query(
        `DELETE FROM "postgres_schema".messages_table
        WHERE pgp_sym_decrypt(send_to::bytea, $1) = $2;`,
        [postgresHashedPassword, username]
    );

    client.release();
    userClient.release();
}

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

        const sessionData = {
            username: formData.username,
            password: formData.password,
        };

        await transferMessagesToUser(formData.username, formData.password);

        cookies().set('session', JSON.stringify(sessionData), {
            maxAge: 24 * 60 * 60, // 1 day
            httpOnly: true,
            sameSite: 'Strict',
        });

        return { success: true };
    } catch (error) {
        console.error('Database connection error:', error);

        return { success: false, error: 'Invalid credentials.' };
    }
}

async function signOut(): Promise<void> {
    'use server';
    cookies().delete('session');
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
                        ${i} ${i === 'file' ? 'BYTEA' : 'TEXT'
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
                        ${i === 'file' ? `encode(${i}, 'hex')` : i}::text, '${hashedPassword}')${i !== 'filename' ? ', ' : ''}`
                )
                .join('')}
            ;
        `);

        userClient.release();

        await transferMessagesToUser(username, formData.password);

        return await login(formData);
    } catch (error) {
        console.error('SignUp error:', error);

        return { success: false, error: 'Sign up failed.' };
    }
}

export default async function Home() {
    const session = cookies().get('session');
    let loggedIn = false;
    let username = '';
    let password = '';

    if (session) {
        const sessionData = JSON.parse(session.value);
        username = sessionData.username;
        password = sessionData.password;
        loggedIn = true;
    }

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
