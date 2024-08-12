import GlobalStates from '@/components/GlobalStates';

import ButtonForDisplayKeysPopup from '@/components/ButtonForDisplayKeysPopup';

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
    postgresHashedPassword
} from '@/postgresConfig';

import { profile_table, messages_table, FormData } from '@/lib/utils';

import { cookies } from 'next/headers';

import * as openpgp from 'openpgp';

import { Messenger } from '@/components/Messenger';

import { decryptWithPublicKey } from '@/actions/decryptWithPublicKey';







let loggedIn: boolean = false;

let userUsername: string;

let decryptedUsernameForMessenger: string;
let decryptedPasswordForMessenger: string;

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

            return { success: false, error: 'Username already exists' };

        }

        await client.query(
            `INSERT INTO postgres_schema.public_keys 
                (
                    username, public_key
                ) 
            VALUES 
                (
                    $1, pgp_sym_encrypt($2, $3)
                )`,
            [username, publicKey, postgresHashedPassword]
        );

        const decryptedUsername = await decryptWithPublicKey(

            publicKey ? publicKey : '',

            encryptedUsername

        );

        const decryptedPassword = await decryptWithPublicKey(

            publicKey ? publicKey : '',

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

        const encryptedDecryptedUsername = await openpgp.encrypt({

            message: await openpgp.createMessage({ text: decryptedUsername }),

            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey! }),

            format: 'armored',

        });

        // If this does not work, just throw each query on 1 line 
            // and put space between the first $ vars

        await userClient.query(`

            CREATE TABLE "${decryptedUsername}_schema"."messages_table" (
                ${messages_table.map((i) => 
                    `
                        ${i} 
                        TEXT
                        ${i !== 'filename' ? ', ' : ''}
                    `
                ).join('')}
            );

            CREATE TABLE "${decryptedUsername}_schema"."profile_table" (
                ${profile_table.map((i) => 
                    `
                        ${i} 
                        TEXT
                        ${i !== 'philosophy' ? ', ' : ''}`).join('')}
            );

            INSERT INTO "${decryptedUsername}_schema"."profile_table" (name) 
                VALUES ('${encryptedDecryptedUsername}');

            UPDATE "${decryptedUsername}_schema"."profile_table" SET
                ${profile_table.map((i) => 
                    `
                        ${i} = pgp_sym_encrypt(
                            ${i}
                            ::text, 
                            '${hashedPassword}'
                        )
                        ${i !== 'philosophy' ? ', ' : ''}
                    `
                ).join('')}
            ;

            UPDATE "${decryptedUsername}_schema"."messages_table" SET
                ${messages_table.map((i) => 
                    `
                        ${i} = pgp_sym_encrypt(
                            ${i}
                            ::text, 
                            '${hashedPassword}'
                        )
                        ${i !== 'filename' ? ', ' : ''}
                    `
                ).join('')}
            ;
        `);

        userClient.release();

        console.log('signUp - End');

        return await login({
            username: decryptedUsername,
            encryptedUsername,
            encryptedPassword,
        });

    } catch (error) {
        console.error('SignUp error:', error);

        return { success: false, error: 'Sign up failed.' };
    }
}

async function login(
    formData: FormData
): Promise<{ success: boolean; error?: string; action?: 'generate_keys' | 'nothing happened' }> {

    'use server';

    console.log('login - Start');

    console.log('FormData:', formData);

    const client = await postgresUserPool.connect();

    const { username, encryptedUsername, encryptedPassword, publicKey } = formData;

    console.log('Postgres Hashed Password:', postgresHashedPassword);

    if (username === owner) {
        if (publicKey) {
            await client.query(`
                CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (
                    username TEXT PRIMARY KEY,
                    public_key TEXT NOT NULL
                );
            `);
            await client.query(
                `INSERT INTO postgres_schema.public_keys 
                    (
                        username, public_key
                    ) 
                VALUES 
                    (
                        $1, pgp_sym_encrypt($2, $3)
                    )
                ON CONFLICT (username) 
                DO UPDATE SET 
                public_key = EXCLUDED.public_key;`,
                [username, publicKey, postgresHashedPassword]
            );
        }
    }

    const result = await client.query(
        `SELECT pgp_sym_decrypt(public_key::bytea, $1) 
            AS public_key FROM postgres_schema.public_keys 
                WHERE username = $2`,
        [postgresHashedPassword, username]
    );

    if (result.rows.length === 0) {

        console.log('User not found');

        return { success: false, error: 'User not found.' };

    }

    const decryptedPublicKey = result.rows[0].public_key;

     if (username === owner) {

        const ownerInitialSignInCheck = await client.query(
            `SELECT enumlabel FROM pg_enum WHERE enumlabel = 'owner_initial_sign_in_happened'`
        );

        if (ownerInitialSignInCheck.rows.length === 0) {
            console.log('First time owner login detected. Generating keys.');

            const enumExistsResult = await client.query(`
                SELECT 1 
                FROM pg_type 
                WHERE typname = 'owner_sign_in_status'
            `);

            if (enumExistsResult.rows.length === 0) {
                await client.query(`
                    CREATE TYPE owner_sign_in_status AS ENUM ('owner_initial_sign_in_happened');
                `);
                console.log('Enum type owner_sign_in_status created.');
            }

            try {
                const insertEnumValueResult = await client.query(`
                    INSERT INTO pg_enum (enumtypid, enumlabel) 
                    SELECT typ.oid, 'owner_initial_sign_in_happened' 
                    FROM pg_type typ 
                    WHERE typ.typname = 'owner_sign_in_status'
                    ON CONFLICT DO NOTHING
                    RETURNING *;
                `);

                if (insertEnumValueResult.rows.length > 0) {
                    console.log('Enum value owner_initial_sign_in_happened inserted.');
                } else {
                    console.log('Enum value owner_initial_sign_in_happened already exists.');
                }
            } catch (error) {
                console.error('Failed to insert enum value:', error);
            }

            await client.query(
                `DO $$
                 BEGIN
                     IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'owner_initial_sign_in_happened') THEN
                         PERFORM pg_enum.enum_range('postgres_schema', 'owner_initial_sign_in_happened');
                     END IF;
                 END $$;`
            );
            console.log('Adding the enum.');

            return { success: true, action: 'generate_keys' };
        }
    }

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

        userUsername = username;

        return { success: true, action: 'nothing happened' };

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

    console.log('Asking for if session');

    if (session?.value) {
        console.log('Session: ', session);

        const sessionData = JSON.parse(session.value);

        console.log('Session Data: ', sessionData);

        const client = await postgresUserPool.connect();

        console.log('Mutable variable of the userUsername: ', userUsername);

        const result = await client.query(
            `SELECT 
                pgp_sym_decrypt(public_key::bytea, $1) 
                AS 
                public_key 
                    FROM 
                    postgres_schema.public_keys 
                        WHERE 
                        username = $2`,
            [postgresHashedPassword, userUsername]
        );

        console.log('Result: ', result);

        if (result.rows.length > 0) {

            const decryptedPublicKey = result.rows[0].public_key;

            console.log('Session data username: ', sessionData.username);

            console.log('Session data password: ', sessionData.password);

            console.log('Decrypted public key: ', decryptedPublicKey);

            const decryptedUsername = await decryptWithPublicKey(

                decryptedPublicKey,

                sessionData.username

            );

            console.log('Decrypted username: ', decryptedUsername);

            const decryptedPassword = await decryptWithPublicKey(

                decryptedPublicKey,

                sessionData.password

            );

            console.log('Decrypted Password: ', decryptedPassword);

            if (
                decryptedUsername &&
                decryptedPassword &&
                decryptedUsername === userUsername
            ) {

                console.log('loggedIn turned true');

                loggedIn = true;

                decryptedUsernameForMessenger = decryptedUsername;
                decryptedPasswordForMessenger = decryptedPassword;

            }

        }

        client.release();

    }

    return (
        <GlobalStates>
            <header className="flex pr-4 py-4 border-b">
                <nav className="flex gap-2 ml-auto">
                    {loggedIn && <ButtonForDisplayKeysPopup />}
                    <ModeToggle />
                    <LangToggle />
                    {loggedIn && <SignOutForm action={signOut} />}
                </nav>
            </header>
            {loggedIn ? (
                <Messenger username={decryptedUsernameForMessenger} password={decryptedPasswordForMessenger} />
            ) : (
                <LoginOrSignUp loginAction={login} signUpAction={signUp} />
            )}
        </GlobalStates>
    );
}
