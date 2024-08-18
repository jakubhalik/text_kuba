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

import { profile_table, messages_table, FormData, LoginActionPromise, SignUpActionPromise } from '@/lib/utils';

import { cookies } from 'next/headers';

import * as openpgp from 'openpgp';

import { Messenger } from '@/components/Messenger';

import { decryptWithPublicKey } from '@/actions/decryptWithPublicKey';







let loggedInUsers: Record<string, { username: string; timestamp: number }> = {};

async function signUp(
    formData: FormData
): Promise<SignUpActionPromise> {
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
            `SELECT 1 FROM postgres_schema.public_keys 
            WHERE username = $1`,
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

async function transferMessagesToUser(
    username: string,
    password: string
): Promise<void> {
    'use server';
    const client = await postgresUserPool.connect();

    const queryForMessages = `
        SELECT
            pgp_sym_decrypt(datetime_from::bytea, $1) as datetime_from,
            pgp_sym_decrypt(sent_by::bytea, $1) as sent_by,
            pgp_sym_decrypt(send_to::bytea, $1) as send_to,
            pgp_sym_decrypt(text::bytea, $1) as text,
            pgp_sym_decrypt(file::bytea, $1) as file,
            pgp_sym_decrypt(filename::bytea, $1) as filename
        FROM "postgres_schema".messages_table
        WHERE pgp_sym_decrypt(send_to::bytea, $1) = $2;
    `;

    const resultForMessages = await client.query(queryForMessages, [
        postgresHashedPassword,
        username,
    ]);
    if (resultForMessages.rows.length === 0) {
        console.log('No messages to transfer.');
        client.release();
        return;
    }
    console.log('transfered messages: ', resultForMessages);
    console.log(resultForMessages.rows);
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

    try {
        for (const message of resultForMessages.rows) {
            console.log('message: ', message);
            console.log('message sent by: ', message.sent_by);
            console.log('message send to: ', message.send_to);
            console.log('message text: ', message.text);
            console.log('message file: ', message.file);
            console.log('message filename: ', message.filename);
        }
        for (const message of resultForMessages.rows) {
            await userClient.query(
                `INSERT INTO "${username}_schema".messages_table 
                    (
                        datetime_from, 
                        sent_by, 
                        send_to, 
                        text, 
                        file, 
                        filename
                    ) VALUES 
                    (
                        pgp_sym_encrypt($1::text, $2), 
                        pgp_sym_encrypt($3, $2), 
                        pgp_sym_encrypt($4, $2), 
                        pgp_sym_encrypt($5, $2),
                        pgp_sym_encrypt($6, $2), 
                        pgp_sym_encrypt($7::text, $2)
                    )`,
                [
                    message.datetime_from,
                    userHashedPassword,
                    message.sent_by,
                    message.send_to,
                    message.text,
                    message.file,
                    message.filename
                ]
            );
            console.log('inserted messages from sender to receiver successfully.');
        }
    } catch (e) {
        console.error('inserting the transferred messages failed: ', e);
        throw new Error('inserting the transferred messages failed: ', e!);
    }

    try {
        await client.query(
            `DELETE FROM "postgres_schema".messages_table
            WHERE pgp_sym_decrypt(send_to::bytea, $1) = $2;`,
            [postgresHashedPassword, username]
        );
        console.log('Deleting the temporarily held messages from postgres_schema.');
    } catch (e) {
        console.error('Failed deleting the temporarily held messages from postgres_schema: ', e);
        throw new Error('Failed deleting the temporarily held messages from postgres_schema: ', e!);
    }

    client.release();
    userClient.release();
}

const cache_expiration_ms = 24 * 60 * 60 * 1000;

function cleanUpCache() {
    const now = Date.now();
    for (const user in loggedInUsers) {
        if (loggedInUsers[user].timestamp + cache_expiration_ms < now) {
            delete loggedInUsers[user];
        }
    }
}

async function login(
    formData: FormData
): Promise<LoginActionPromise> {
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

    try {
        const messagesCheckResult = await client.query(`
            SELECT COUNT(*) AS message_count 
            FROM "postgres_schema".messages_table 
            WHERE pgp_sym_decrypt(send_to::bytea, $1) = $2;
        `, [postgresHashedPassword, decryptedUsername]);
        const messageCount = parseInt(messagesCheckResult.rows[0].message_count, 10);
        if (messageCount > 0) {
            transferMessagesToUser(decryptedUsername, decryptedPassword);
            console.log('Transfered messages.');
        } else {
            console.log('No messages to transfer.');
        }
        console.log('Doing transfer of messages if there is a temp message_table in postgres_schema.');
    } catch (e) {
        console.error('Failed in Doing transfer of messages if there is a temp message_table in postgres_schema: ', e);
    }

    try {
        const userClient = await pool.connect();
        userClient.release();
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
                return { success: true, action: 'generate keys' };
            }
        }

        const sessionData = {
            username: encryptedUsername,
            password: encryptedPassword,
            decryptedUsername
        };
        type ResponseCookie = {
            maxAge?: number;
            expires?: Date;
            httpOnly?: boolean;
            path?: string;
            domain?: string;
            secure?: boolean;
            sameSite?: 'Strict';
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
        loggedInUsers[decryptedUsername] = {
            username: decryptedUsername,
            timestamp: Date.now(),
        }
        return { success: true, action: 'nothing happened' };
    } catch (error) {
        console.error('Database connection error:', error);
        return { success: false, error: 'Invalid credentials.' };
    }
}

async function signOut(username: string): Promise<void> {
    'use server';
    try {
        delete loggedInUsers[username];
        console.log('deleting decrypted username of the logged in user from the loggedInUsers aka signing him out');
    } catch (e) {
        console.error('error in deleting decrypted username of the logged in user from the loggedInUsers aka signing him out: ', e);
    }
    cookies().delete('session');
}

export default async function Home() {
    try {
        cleanUpCache();
        console.log('cleaning up any expired cached sessions');
    } catch (e) {
        console.error('error in cleaning up any expired cached sessions: ', e);
    }
    const session = cookies().get('session');
    let decryptedUsernameForMessenger: string;
    let decryptedPasswordForMessenger: string;
    console.log('Asking for if session');
    if (session?.value) {
        console.log('Session: ', session);
        const sessionData = JSON.parse(session.value);
        console.log('Session Data: ', sessionData);
        const client = await postgresUserPool.connect();
        const result = await client.query(
            `SELECT 
                pgp_sym_decrypt(public_key::bytea, $1) 
                AS 
                public_key 
                    FROM 
                    postgres_schema.public_keys 
                        WHERE 
                        username = $2`,
            [postgresHashedPassword, sessionData.decryptedUsername]
        );
        console.log('Result: ', result);
        if (result.rows.length > 0) {
            const decryptedPublicKey = result.rows[0].public_key;
            const sessionDataUsername = sessionData.username;
            const sessionDataPassword = sessionData.password;
            console.log('Session data username: ', sessionDataUsername);
            console.log('Session data password: ', sessionDataPassword);
            console.log('Decrypted public key: ', decryptedPublicKey);
            const decryptedUsername = await decryptWithPublicKey(
                decryptedPublicKey,
                sessionDataUsername
            );
            console.log('Decrypted username: ', decryptedUsername);
            const decryptedPassword = await decryptWithPublicKey(
                decryptedPublicKey,
                sessionDataPassword
            );
            console.log('Decrypted Password: ', decryptedPassword);
            if (
                decryptedUsername && decryptedPassword && loggedInUsers?.[decryptedUsername]?.username &&
                decryptedUsername === loggedInUsers[decryptedUsername].username
            ) {
                loggedInUsers[decryptedUsername] = {
                    username: decryptedUsername,
                    timestamp: Date.now(),
                }
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
                    {
                        loggedInUsers[decryptedUsernameForMessenger!] && 
                        <ButtonForDisplayKeysPopup />
                    }
                    <ModeToggle />
                    <LangToggle />
                    {
                        loggedInUsers[decryptedUsernameForMessenger!] && 
                            <SignOutForm 
                                action={signOut} 
                                username={decryptedUsernameForMessenger!} 
                            />
                    }
                </nav>
            </header>
            {loggedInUsers[decryptedUsernameForMessenger!] ? (
                <Messenger 
                    username={decryptedUsernameForMessenger!} 
                    password={decryptedPasswordForMessenger!} 
                />
            ) : (
                <LoginOrSignUp 
                    loginAction={login} 
                    signUpAction={signUp} 
                />
            )}
        </GlobalStates>
    );
}
