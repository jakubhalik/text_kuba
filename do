# The app that makes the operational side of security yours only but the heavy lifting technical side only mine (you are welcome)

When you input credentials while signing and you are not trying to use a username that already exists at first public and a private gets generated only on client. 
The private key will never be known by the server, the private key will encrypt the name and the password. 
The public key will get sent to the server together with the username, encrypted username and encrypted password, the public keys will be stored in the db for authentication, only encrypted with pgp_sym via the postgres hashed credentials.
The public key will decrypt the name and password and will create a role (user) with your credentials at the db based on a template role user.
The postgres db is using scram-sha256.
Personal schema with your_name_schema will get created on the db and together with her template tables out of which only the name value will get a value.
Your decrypted name and password will combine and create a sha-256 hash with which all values of all tables will from now on be always be encrypting when inputting and decrypting when inputting.
Worry not tho, because this is only 1 of 2 factors of the encryption of all your values, all this encryption will be encrypting already encrypted values that will be encrypted on your device only with the public key so they will be always decryptable only by the private key that will only you have that will never leave your device.
You will get logged in with your new account. Login technical specification will be below when talking more deeply about login logic.
When logged in you will get a popup that if you close you can always open again through a keys button.
The popup will remind you the specifications of the key logic and how important it now is that you never loose your private key.
Because if you do loose your private key, you will never be capable to sign back into your account and it will never be recoverable. 
Now this seems horrendous, all the other apps let you forget all your passwords all the time, but you cannot forget your password and loose your private key, that is the only way you can have true security in the application you are using, this is the only way we cannot possibly have a backdoor into your account.
The view of the keys will be hidden at first, you can display it clearly by clicking a button, but do it only when your monitor/screen is not being recorded in any way.
You will also get to copy the keys without even displaying them in the page.
The private key will get saved into your strict cookies for this page, if you have allowed it for the ease of logging in in the future, but even then you absolutely should save your private key in some secure password manager, ideally in more of them over backup devices, so you can be sure of not loosing a private key.
Someone getting your private key is not such a big deal as it might seem, because with it alone one cannot really do anything to you.
You with it alone cannot do or see anything.
You have to have access to your data to decrypt the values with the private key, and you can get to those only via the authentication into the app for which u need not only the private key, but also your password.
This is a 2-factor authentication without a phone/email, security upgrade of a 2-factor auth if you will.
But even tho one cannot do anything with your private key alone, if you suspect that someone knows it you should as fast as possible, just to be safe, sign in and generate new keys, there will be a button for this that will also on your device decrypt all your data with your private key will generate the new keys, will encrypt them with the new public key, will burn the old private key from your cookies (if u have it there), will throw the new one there (if u let it there), will send a message to the server to burn the old public key and all values encrypted with it and will replace them with the newly encrypted values on your device with the new public key that will also be saved in the db encrypted in the same way as it was before.

When you login in the default mode the process of logging in will continue only if a private key is in your cookies, if you have selected the no-cookies mode, you will have to input the private key, into the input on the page with the credentials for it to on your device only encrypt the name and password so it can be sent on to the server where it will be decrypted with the public key that is saved under your name. If either there is not even a public key with the name you are trying to login with or a sign in in the postgres pool cannot happen with the decrypted credentials decrypted via the public key you will get a wrong credentials error.

The public keys will be in a postgres_schema

During sign up and login you will get a loading bar in the place of the error message so you know your new request was sent.

Extend the login so if the username === owner and there is not an owner_initial_sign_in_happened enum in postgres_schema, so the client side generating of public and a private key as it happens in the sign up happens in this case also in the login with them also getting set in the strict cookies and with the public one replacing whatever is under that name in the postgres schema public keys now


postgres@localhost:text_kuba> select enumlabel from pg_enum where enumlabel = 'owner_initial_sign_in_happened'
+-----------+
| enumlabel |
|-----------|
+-----------+
SELECT 0
Time: 0.008s
postgres@localhost:text_kuba>

page.tsx: 
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
): Promise<{ success: boolean; error?: string; action?: 'generate_keys' }> {

    'use server';

    console.log('login - Start');

    console.log('FormData:', formData);

    const client = await postgresUserPool.connect();

    const { username, encryptedUsername, encryptedPassword } = formData;

    console.log('Postgres Hashed Password:', postgresHashedPassword);

    if (username === 'owner') {
        if (formData.publicKey) {
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
                    )`,
                [username, formData.publicKey, postgresHashedPassword]
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

     if (username === 'owner') {
        const ownerInitialSignInCheck = await client.query(
            `SELECT enumlabel FROM pg_enum WHERE enumlabel = 'owner_initial_sign_in_happened'`
        );

        if (ownerInitialSignInCheck.rows.length === 0) {
            console.log('First time owner login detected. Generating keys.');

            await client.query(
                `DO $$
                 BEGIN
                     IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'owner_initial_sign_in_happened') THEN
                         PERFORM pg_enum.enum_range('postgres_schema', 'owner_initial_sign_in_happened');
                     END IF;
                 END $$;`
            );

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

LoginOrSignUp.tsx: 
'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';

import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { useLanguage } from './GlobalStates';

import { loadLanguage, FormData, XIcon, Eye, ClosedEye } from '@/lib/utils';

import * as openpgp from 'openpgp';

import { getCookie, setCookie } from 'cookies-next';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogAction,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';

export default function LoginOrSignUp({
    loginAction,
    signUpAction,
}: {
    loginAction: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string; action: 'generate_keys' }>;
    signUpAction: (
        formData: FormData
    ) => Promise<{ success: boolean; error?: string }>;
}) {
    const { language } = useLanguage();
    
    const texts = loadLanguage(language);

    const [isLogin, setIsLogin] = useState<boolean>(true);

    const [data, setData] = useState<FormData>({
        username: '',
        encryptedUsername: '',
        encryptedPassword: '',
        publicKey: '',
    });

    const [error, setError] = useState<string>('');

    const passwordRef = useRef<HTMLInputElement>(null);

    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const [privateKey, setPrivateKey] = useState<string>('');

    const [privateKeyIntoCookiesPopup, setPrivateKeyIntoCookiesPopup] = useState(false);

    const [submitLoading, setSubmitLoading] = useState(false);

    const [hiddenPrivateKeyTextarea, setHiddenPrivateKeyTextarea] = useState(true);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const getPassword = () => passwordRef.current?.value || '';

    const getConfirmPassword = () => confirmPasswordRef.current?.value || '';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        if (!isLogin && getPassword() !== getConfirmPassword()) {
            setError(texts.password_mismatch);

            return;
        }

        try {

            if (isLogin) {
                setSubmitLoading(true);

                const privateKeyArmored = getCookie('privateKey') as string;

                console.log('Private key armored: ', privateKeyArmored);

                if (!privateKeyArmored) {
                    setError('Private key not found in cookies');

                    return;
                }

                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });

                console.log('Private key unarmored: ', privateKey);

                const encryptedUsername = await openpgp.sign({

                    message: await openpgp.createMessage({
                        text: data.username,
                    }),

                    signingKeys: privateKey,

                    format: 'armored',
                });

                const encryptedPassword = await openpgp.sign({

                    message: await openpgp.createMessage({
                        text: getPassword(),
                    }),

                    signingKeys: privateKey,

                    format: 'armored',
                });

                const formData: FormData = {
                    username: data.username,
                    encryptedUsername: encryptedUsername as string,
                    encryptedPassword: encryptedPassword as string,
                };

                const result = await loginAction(formData);

                if (result.action === 'generate_keys') {

                    const { privateKey, publicKey } = await openpgp.generateKey({
                        type: 'ecc',
                        curve: 'curve25519',
                        userIDs: [{ name: data.username }],
                    });

                    const publicKeyArmored = publicKey;
                    const privateKeyArmored = privateKey;

                    const encryptedUsername = await openpgp.sign({
                        message: await openpgp.createMessage({
                            text: data.username,
                        }),
                        signingKeys: await openpgp.readPrivateKey({
                            armoredKey: privateKeyArmored,
                        }),
                        format: 'armored',
                    });

                    const encryptedPassword = await openpgp.sign({
                        message: await openpgp.createMessage({
                            text: getPassword(),
                        }),
                        signingKeys: await openpgp.readPrivateKey({
                            armoredKey: privateKeyArmored,
                        }),
                        format: 'armored',
                    });

                    setCookie('privateKey', privateKeyArmored, {
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                    });

                    setCookie('publicKey', publicKeyArmored, {
                        path: '/',
                        secure: true,
                        sameSite: 'strict',
                    });

                    const checkForTheCookie = getCookie('privateKey') as string;
                    console.log('Cookie got set and got: ', checkForTheCookie);

                    const formData: FormData = {
                        username: data.username,
                        encryptedUsername: encryptedUsername as string,
                        encryptedPassword: encryptedPassword as string,
                        publicKey: publicKeyArmored,
                    };

                    console.log('Generated new keys in login for owner and calling login action again with different formData arguments.');

                    const result = await loginAction(formData);

                    if (result.success) {
                        setSubmitLoading(false);
                        return;
                    }

                } else if (result.success) {
                    setSubmitLoading(false);

                    return;

                } else {
                    setSubmitLoading(false);

                    setError(texts.login_failed);
                }

            } else {
                // Sign-up logic
                
                setSubmitLoading(true);

                const { privateKey, publicKey } = await openpgp.generateKey({
                    type: 'ecc',
                    curve: 'curve25519',
                    userIDs: [{ name: data.username }],
                });

                const publicKeyArmored = publicKey;
                const privateKeyArmored = privateKey;

                const encryptedUsername = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: data.username,
                    }),
                    signingKeys: await openpgp.readPrivateKey({
                        armoredKey: privateKeyArmored,
                    }),
                    format: 'armored',
                });

                const encryptedPassword = await openpgp.sign({
                    message: await openpgp.createMessage({
                        text: getPassword(),
                    }),
                    signingKeys: await openpgp.readPrivateKey({
                        armoredKey: privateKeyArmored,
                    }),
                    format: 'armored',
                });

                setCookie('privateKey', privateKeyArmored, {
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                });

                setCookie('publicKey', publicKeyArmored, {
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                });

                const checkForTheCookie = getCookie('privateKey') as string;
                console.log('Cookie got set and got: ', checkForTheCookie);

                const formData: FormData = {
                    username: data.username,
                    encryptedUsername: encryptedUsername as string,
                    encryptedPassword: encryptedPassword as string,
                    publicKey: publicKeyArmored,
                };

                const result = await signUpAction(formData);

                if (result.success) {
                    setSubmitLoading(false);

                    return;

                } else {
                    setSubmitLoading(false);

                    setError(texts.signup_failed);
                }

            }

        } catch (error) {
            setSubmitLoading(false);
            // Encryption error
            setError(texts.login_failed);
        }

    };

    return (
        <>
            <div className="mx-auto max-w-sm space-y-6 pt-20 px-4">
                <div className="space-y-2 text-center">
                    <h1
                        className="text-3xl font-bold"
                        data-cy={isLogin ? 'login_h' : 'signup_h'}
                    >
                        {isLogin ? texts.login_h : texts.signup_h}
                    </h1>
                    <p
                        className="text-gray-500 dark:text-gray-400"
                        data-cy="welcome_p"
                    >
                        {texts.welcome_p}
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="username" data-cy="username_label">
                            {texts.username_label}
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder={texts.username_input_placeholder}
                            value={data.username}
                            onChange={handleChange}
                            required
                            data-cy="username_input_placeholder"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" data-cy="password_label">
                            {texts.password_label}
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={texts.password_input_placeholder}
                            ref={passwordRef}
                            required
                            data-cy="password_input_placeholder"
                        />
                        {!isLogin && (
                            <>
                                <Label
                                    htmlFor="confirm-password"
                                    data-cy="confirm_password_label"
                                >
                                    {texts.confirm_password_label}
                                </Label>
                                <Input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    placeholder={
                                        texts.confirm_password_input_placeholder
                                    }
                                    data-cy="confirm_password_input_placeholder"
                                    ref={confirmPasswordRef}
                                    required
                                />
                            </>
                        )}
                    </div>
                    <AlertDialog
                        open={privateKeyIntoCookiesPopup}
                        onOpenChange={setPrivateKeyIntoCookiesPopup}
                    >
                        <AlertDialogTrigger asChild>
                            <button className="hidden">Open</button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogTitle>Set private key into strict cookies</AlertDialogTitle>
                            <button
                                className="absolute top-[13px] right-14 rounded-full p-1"
                                onClick={() => setHiddenPrivateKeyTextarea(!hiddenPrivateKeyTextarea)}
                            >
                                {hiddenPrivateKeyTextarea ? <ClosedEye /> : <Eye />}
                            </button>
                            <button
                                className="absolute top-4 right-4 rounded-full p-1 text-red-500 hover:text-red-600"
                                onClick={() => setPrivateKeyIntoCookiesPopup(false)}
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                            <VisuallyHidden>
                                <AlertDialogDescription>Set private key into strict cookies</AlertDialogDescription>
                            </VisuallyHidden>
                            <textarea
                                id="private-key"
                                name="Private key"
                                placeholder="Enter your private key"
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                required
                                data-cy="private_key_input_placeholder"
                                className={`w-full p-2 rounded-md ${hiddenPrivateKeyTextarea && 'text-transparent tracking-widest caret-transparent'}`}
                            />
                            <AlertDialogAction
                                className="py-1 bg-red-500 hover:bg-red-600 active:bg-red-700 dark:bg-red-300 dark:hover:bg-red-400 dark:active:bg-red-500"
                                onClick={() => {
                                    if (privateKey) {
                                        const key = privateKey;
                                        setCookie('privateKey', key, {
                                            path: '/',
                                            secure: true,
                                            sameSite: 'strict',
                                        });
                                        console.log('The inputted private key: ', key);
                                        setPrivateKeyIntoCookiesPopup(false);
                                    } else {
                                        setError('Please enter a private key.');
                                    }
                                }}
                            >
                                Set
                            </AlertDialogAction>
                        </AlertDialogContent>
                    </AlertDialog>
                    {!submitLoading ? 
                        error && (
                            <p className="text-red-500" data-cy="error">
                                {error}
                            </p>
                        ) 
                    :
                        <div className="flex justify-center mt-4">
                            <svg
                                className="animate-spin h-8 w-8 text-blue-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291l-2.293 2.293a1 1 0 001.414 1.414L8 18.414A8.001 8.001 0 016 17.291z"
                                ></path>
                            </svg>
                        </div>
                    }
                    {!isLogin && (
                        <div className="flex items-center space-x-2 px-1">
                            <Label
                                className="text-sm leading-1"
                                htmlFor="terms"
                                data-cy="signup_information"
                            >
                                {texts.signup_information}
                            </Label>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full"
                        data-cy={isLogin ? 'login_button' : 'signup_button'}
                    >
                        {isLogin ? texts.login_button : texts.signup_button}
                    </Button>
                    {isLogin && 
                        <Button
                            data-cy="set_private_key_to_cookies"
                            className="
                                w-full 
                                bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                dark:bg-blue-400 dark:hover:bg-blue-500 dark:active:bg-blue-600
                            "
                            onClick={() => setPrivateKeyIntoCookiesPopup(true)}
                        >
                            Set private key to cookies
                        </Button>
                    }
                </form>
            </div>
            <div
                className="mt-4 text-center text-sm pb-8"
                data-cy={isLogin ? 'dont_have_account' : 'have_account'}
            >
                {isLogin ? texts.dont_have_account : texts.have_account}
                <button
                    className="underline pl-1"
                    onClick={() => setIsLogin(!isLogin)}
                    data-cy={isLogin ? 'switch_to_sign_up' : 'switch_to_login'}
                >
                    {isLogin ? texts.switch_to_sign_up : texts.switch_to_login}
                </button>
            </div>
        </>
    );
}

even tho there is nothing here: postgres@localhost:text_kuba> select enumlabel from pg_enum where enumlabel = 'owner_initial_sign_in_happened'
+-----------+
| enumlabel |
|-----------|
+-----------+
SELECT 0
Time: 0.008s
postgres@localhost:text_kuba>

when I log in as the owner the console.log('Generated new keys in login for owner and calling login action again with different formData arguments.') does never get logged on the client, even tho I get normally logged in, so that implies that even tho the result.action does equal 'generate_keys' but instead the else if result.success runs
