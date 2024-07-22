const { Pool } = require('pg');
const crypto = require('crypto');
const openpgp = require('openpgp');
const readline = require('readline');
require('dotenv').config(); // Load environment variables from .env file

const owner = process.env.owner;
const host = process.env.host;
const port = process.env.port;
const postgres_password = process.env.postgres_password;

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
    let client;
    try {
        console.log('Starting sign-up process...');
        client = await postgresUserPool.connect();
        console.log('Connected to PostgreSQL');

        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'ecc',
            curve: 'curve25519',
            userIDs: [{ name: username }],
            passphrase: password,
        });
        console.log('PGP keys generated');

        const encryptedUsername = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: username }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
        });

        const encryptedPassword = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: password }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
        });
        console.log('Username and password encrypted');

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

        // Test the basic decryption within PostgreSQL
        const testQuery = `
            DO $$
            DECLARE
                decrypted_username text;
                decrypted_password text;
            BEGIN
                RAISE NOTICE 'Encrypted Username: %', '${escapedEncryptedUsername}';
                RAISE NOTICE 'Public Key: %', '${escapedPublicKey}';

                decrypted_username := pgp_pub_decrypt('${escapedEncryptedUsername}', '${escapedPublicKey}');
                decrypted_password := pgp_pub_decrypt('${escapedEncryptedPassword}', '${escapedPublicKey}');

                RAISE NOTICE 'Decrypted Username: %', decrypted_username;
                RAISE NOTICE 'Decrypted Password: %', decrypted_password;
            END;
            $$;
        `;

        console.log('Executing test query:');
        console.log(testQuery);

        await client.query(testQuery);
        console.log('Test query executed successfully');
    } catch (error) {
        console.error('SignUp error:', error);
    } finally {
        if (client) {
            try {
                await client.release();
                console.log('PostgreSQL client released');
            } catch (releaseError) {
                console.error(
                    'Error releasing PostgreSQL client:',
                    releaseError
                );
            }
        }
        await postgresUserPool.end();
    }
}

async function main() {
    const username = await prompt('Enter username: ');
    const password = await prompt('Enter password: ');
    await signUp(username, password);
    rl.close();
}

main();
