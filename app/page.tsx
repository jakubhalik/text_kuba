import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';
import { LangToggle } from '@/components/LangToggle';
import SignOutForm from '@/components/SignOutForm';
import LoginOrSignUp from '@/components/LoginOrSignUp';
import { Pool } from 'pg';
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
import * as openpgp from 'openpgp';

interface FormData {
    username: string;
    encryptedUsername: string;
    encryptedPassword: string;
    publicKey: string;
}

let loggedIn: boolean = false;

async function decryptWithPublicKey(
    publicKeyArmored: string,
    encryptedText: string
): Promise<string> {
    try {
        console.log('decryptWithPublicKey - Start');
        console.log('Public Key:', publicKeyArmored);
        console.log('Encrypted Text:', encryptedText);

        const publicKey = await openpgp.readKey({
            armoredKey: publicKeyArmored,
        });
        const message = await openpgp.readMessage({
            armoredMessage: encryptedText,
        });

        const verificationResult = await openpgp.verify({
            message,
            verificationKeys: [publicKey],
        });

        const { verified } = verificationResult.signatures[0];
        await verified; // Wait for verification to complete

        const decrypted = message.getText(); // Retrieve the text from the message

        console.log('Decrypted Text:', decrypted);
        console.log('decryptWithPublicKey - End');
        return decrypted as string;
    } catch (error) {
        console.error('Error in decryptWithPublicKey:', error);
        throw error;
    }
}

async function signUp(
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    'use server';
    try {
        console.log('signUp - Start');
        console.log('FormData:', formData);

        const client = await postgresUserPool.connect();
        const { username, encryptedUsername, encryptedPassword, publicKey } =
            formData;

        const postgresCombinedPassword = `postgres${postgres_password}`;
        const postgresHashedPassword = crypto
            .createHash('sha256')
            .update(postgresCombinedPassword)
            .digest('hex');

        console.log('Postgres Hashed Password:', postgresHashedPassword);

        await client.query(`
            CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (
                username TEXT PRIMARY KEY,
                public_key TEXT NOT NULL
            );
        `);

        const existingUser = await client.query(
            `SELECT 1 FROM postgres_schema.public_keys WHERE username = $1`,
            [username]
        );

        if (existingUser.rows.length > 0) {
            console.error('Username already exists');
            return { success: false, error: 'Username already exists.' };
        }

        await client.query(
            `INSERT INTO postgres_schema.public_keys (username, public_key) VALUES ($1, pgp_sym_encrypt($2, $3))`,
            [username, publicKey, postgresHashedPassword]
        );

        const decryptedUsername = await decryptWithPublicKey(
            publicKey,
            encryptedUsername
        );
        const decryptedPassword = await decryptWithPublicKey(
            publicKey,
            encryptedPassword
        );

        console.log('Decrypted Username:', decryptedUsername);
        console.log('Decrypted Password:', decryptedPassword);

        await client.query(`
            CREATE USER "${decryptedUsername}" WITH PASSWORD '${decryptedPassword}';
            GRANT "user" TO "${decryptedUsername}";
            CREATE SCHEMA "${decryptedUsername}_schema" AUTHORIZATION "${decryptedUsername}";
            GRANT ALL ON SCHEMA "${decryptedUsername}_schema" TO "${decryptedUsername}";
        `);

        client.release();

        const newUserPostgresAccount = new Pool({
            host,
            port,
            database: `text_${owner}`,
            user: decryptedUsername,
            password: decryptedPassword,
        });

        const userClient = await newUserPostgresAccount.connect();

        const userCombinedPassword = `${decryptedUsername}${decryptedPassword}`;
        const hashedPassword = crypto
            .createHash('sha256')
            .update(userCombinedPassword)
            .digest('hex');

        console.log('User Hashed Password:', hashedPassword);

        await userClient.query(`
            CREATE TABLE "${decryptedUsername}_schema"."messages_table" (
                ${messages_table.map((i) => `${i} ${i === 'file' ? 'BYTEA' : 'TEXT'}${i !== 'filename' ? ', ' : ''}`).join('')}
            );
            CREATE TABLE "${decryptedUsername}_schema"."profile_table" (
                ${profile_table.map((i) => `${i} ${i === 'avatar' ? 'BYTEA' : 'TEXT'}${i !== 'philosophy' ? ', ' : ''}`).join('')}
            );
            INSERT INTO "${decryptedUsername}_schema"."profile_table" (name) VALUES ('${decryptedUsername}');
            UPDATE "${decryptedUsername}_schema"."profile_table" SET
                ${profile_table.map((i) => `${i} = pgp_sym_encrypt(${i === 'avatar' ? `encode(${i}, 'hex')` : i}::text, '${hashedPassword}')${i !== 'philosophy' ? ', ' : ''}`).join('')}
            ;
            UPDATE "${decryptedUsername}_schema"."messages_table" SET
                ${messages_table.map((i) => `${i} = pgp_sym_encrypt(${i === 'file' ? `encode(${i}, 'hex')` : i}::text, '${hashedPassword}')${i !== 'filename' ? ', ' : ''}`).join('')}
            ;
        `);

        userClient.release();

        console.log('signUp - End');
        return await login({
            username: decryptedUsername,
            encryptedUsername,
            encryptedPassword,
            publicKey,
        });
    } catch (error) {
        console.error('SignUp error:', error);
        return { success: false, error: 'Sign up failed.' };
    }
}

async function login(
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    'use server';

    console.log('login - Start');
    console.log('FormData:', formData);

    const client = await postgresUserPool.connect();
    const { username, encryptedUsername, encryptedPassword, publicKey } =
        formData;

    const postgresCombinedPassword = `postgres${postgres_password}`;
    const postgresHashedPassword = crypto
        .createHash('sha256')
        .update(postgresCombinedPassword)
        .digest('hex');

    console.log('Postgres Hashed Password:', postgresHashedPassword);

    const result = await client.query(
        `SELECT pgp_sym_decrypt(public_key::bytea, $1) AS public_key FROM postgres_schema.public_keys WHERE username = $2`,
        [postgresHashedPassword, username]
    );

    if (result.rows.length === 0) {
        console.log('User not found');
        return { success: false, error: 'User not found.' };
    }

    const decryptedPublicKey = result.rows[0].public_key;

    const decryptedUsername = await decryptWithPublicKey(
        decryptedPublicKey,
        encryptedUsername
    );
    const decryptedPassword = await decryptWithPublicKey(
        decryptedPublicKey,
        encryptedPassword
    );

    console.log('Decrypted Username:', decryptedUsername);
    console.log('Decrypted Password:', decryptedPassword);

    const pool = new Pool({
        host,
        port,
        database: `text_${owner}`,
        user: decryptedUsername,
        password: decryptedPassword,
    });

    type ResponseCookie = {
        maxAge?: number;
        expires?: Date;
        httpOnly?: boolean;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'Strict';
    };

    try {
        const userClient = await pool.connect();
        userClient.release();

        const sessionData = {
            username: encryptedUsername,
            password: encryptedPassword,
        };

        const cookieOptions: Partial<ResponseCookie> = {
            maxAge: 24 * 60 * 60,
            httpOnly: true,
            sameSite: 'Strict',
        };

        (
            cookies().set as unknown as (
                key: string,
                value: string,
                cookie?: Partial<ResponseCookie>
            ) => void
        )('session', JSON.stringify(sessionData), cookieOptions);

        console.log('login - End');
        return { success: true };
    } catch (error) {
        console.error('Database connection error:', error);
        return { success: false, error: 'Invalid credentials.' };
    }
}

async function signOut(): Promise<void> {
    'use server';
    loggedIn = false;
    cookies().delete('session');
}

export default async function Home() {
    const session = cookies().get('session');

    if (session) {
        const sessionData = JSON.parse(session.value);
        const client = await postgresUserPool.connect();

        const postgresCombinedPassword = `postgres${postgres_password}`;
        const postgresHashedPassword = crypto
            .createHash('sha256')
            .update(postgresCombinedPassword)
            .digest('hex');

        const result = await client.query(
            `SELECT pgp_sym_decrypt(public_key::bytea, $1) AS public_key FROM postgres_schema.public_keys WHERE username = $2`,
            [postgresHashedPassword, sessionData.username]
        );

        if (result.rows.length > 0) {
            const decryptedPublicKey = result.rows[0].public_key;

            const decryptedUsername = await decryptWithPublicKey(
                decryptedPublicKey,
                sessionData.username
            );
            const decryptedPassword = await decryptWithPublicKey(
                decryptedPublicKey,
                sessionData.password
            );

            if (
                sessionData.username === decryptedUsername &&
                sessionData.password === decryptedPassword
            ) {
                loggedIn = true;
            }
        }

        client.release();
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
                <span>Logged in</span>
            ) : (
                <LoginOrSignUp loginAction={login} signUpAction={signUp} />
            )}
        </GlobalStates>
    );
}
