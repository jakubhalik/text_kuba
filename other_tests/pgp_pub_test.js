const { Pool } = require('pg');
const crypto = require('crypto');
const openpgp = require('openpgp');
const readline = require('readline');
require('dotenv').config(); // Load environment variables from .env file

const owner = process.env.owner;
const host = process.env.host;
const port = process.env.port;
const postgres_password = process.env.postgres_password;

console.log(`Owner: ${owner}`);
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Postgres Password: ${postgres_password ? '****' : 'Not Set'}`);

if (!owner || !host || !port || !postgres_password) {
    console.error('One or more required environment variables are not set.');
    process.exit(1);
}

const postgresUserPool = new Pool({
    host,
    port,
    database: `text_${owner}`,
    user: 'postgres',
    password: postgres_password,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function prompt(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function signUp(username, password) {
    try {
        console.log('Starting sign-up process...');

        // Connect to PostgreSQL
        console.log('Connecting to PostgreSQL...');
        await postgresUserPool.connect();
        console.log('Connected to PostgreSQL');

        // Generate PGP keys
        console.log('Generating PGP keys...');
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'ecc',
            curve: 'curve25519',
            userIDs: [{ name: username }],
            passphrase: password,
        });
        console.log('PGP keys generated');

        // Encrypt username and password
        console.log('Encrypting username and password...');
        const encryptedUsername = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: username }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
        });
        const encryptedPassword = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: password }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
        });
        console.log('Username and password encrypted');

        // Hash the PostgreSQL password
        const postgresCombinedPassword = `postgres${postgres_password}`;
        const postgresHashedPassword = crypto
            .createHash('sha256')
            .update(postgresCombinedPassword)
            .digest('hex');
        console.log('PostgreSQL password hashed');

        const escapedEncryptedUsername = encryptedUsername
            .split('\n')
            .join('\\n');
        const escapedEncryptedPassword = encryptedPassword
            .split('\n')
            .join('\\n');
        const escapedPublicKey = publicKey.split('\n').join('\\n');

        // Construct the query
        const query = `
            DO $$
            DECLARE
                decrypted_username text;
                decrypted_password text;
            BEGIN
                decrypted_username := pgp_pub_decrypt('${escapedEncryptedUsername}', '${escapedPublicKey}');
                decrypted_password := pgp_pub_decrypt('${escapedEncryptedPassword}', '${escapedPublicKey}');

                IF NOT EXISTS (
                    SELECT FROM pg_tables
                    WHERE schemaname = 'postgres_schema' AND tablename = 'public_keys'
                ) THEN
                    CREATE TABLE "postgres_schema".public_keys (
                        username TEXT,
                        public_key TEXT
                    );
                END IF;

                INSERT INTO "postgres_schema".public_keys (username, public_key)
                VALUES (pgp_sym_encrypt('${username}', '${postgresHashedPassword}'), pgp_sym_encrypt('${escapedPublicKey}', '${postgresHashedPassword}'));

                EXECUTE format('CREATE USER %I WITH PASSWORD %L', decrypted_username, decrypted_password);
                EXECUTE format('CREATE SCHEMA %I_schema AUTHORIZATION %I', decrypted_username, decrypted_username);
                EXECUTE format('GRANT ALL ON SCHEMA %I_schema TO %I', decrypted_username, decrypted_username);

                -- Create tables in user schema
                EXECUTE format('CREATE TABLE %I_schema.messages_table (
                    datetime_from TEXT, sent_by TEXT, send_to TEXT, text TEXT, file BYTEA, filename TEXT
                )', decrypted_username);

                EXECUTE format('CREATE TABLE %I_schema.profile_table (
                    name TEXT, email TEXT, phone_number TEXT, avatar BYTEA, theology TEXT, philosophy TEXT
                )', decrypted_username);

                EXECUTE format('INSERT INTO %I_schema.profile_table (name) VALUES (%L)', decrypted_username, decrypted_username);

                -- Encrypt profile data
                EXECUTE format('UPDATE %I_schema.profile_table SET
                    name = pgp_sym_encrypt(name::text, %L), email = pgp_sym_encrypt(email::text, %L), phone_number = pgp_sym_encrypt(phone_number::text, %L), avatar = pgp_sym_encrypt(encode(avatar, %L), %L), theology = pgp_sym_encrypt(theology::text, %L), philosophy = pgp_sym_encrypt(philosophy::text, %L)
                ', decrypted_password, 'hex', decrypted_password, decrypted_password, decrypted_password, decrypted_password);

                -- Encrypt messages data
                EXECUTE format('UPDATE %I_schema.messages_table SET
                    datetime_from = pgp_sym_encrypt(datetime_from::text, %L), sent_by = pgp_sym_encrypt(sent_by::text, %L), send_to = pgp_sym_encrypt(send_to::text, %L), text = pgp_sym_encrypt(text::text, %L), file = pgp_sym_encrypt(encode(file, %L), %L), filename = pgp_sym_encrypt(filename::text, %L)
                ', decrypted_password, decrypted_password, decrypted_password, decrypted_password, 'hex', decrypted_password, decrypted_password);
            END;
            $$;
        `;

        console.log('Executing query:');
        console.log(query);

        // Execute the query
        await postgresUserPool.query(query);
        await postgresUserPool.end();
        console.log('User successfully signed up!');
    } catch (error) {
        console.error('SignUp error:', error);
    }
}

async function main() {
    const username = await prompt('Enter username: ');
    const password = await prompt('Enter password: ');
    await signUp(username, password);
    rl.close();
}

main();
