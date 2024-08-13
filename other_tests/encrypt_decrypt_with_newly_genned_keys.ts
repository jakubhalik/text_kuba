import * as openpgp from 'openpgp';

async function generateAndTestKeyPair() {
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: 'Test User' }],
    });

    console.log('Public Key:', publicKey);
    console.log('Private Key:', privateKey);

    const message = 'Hello, this is a test message!';

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
    });

    console.log('Encrypted Message:', encrypted);

    const decrypted = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encrypted }),
        decryptionKeys: await openpgp.readPrivateKey({ armoredKey: privateKey }),
    });

    console.log('Decrypted Message:', decrypted.data);
}

generateAndTestKeyPair();
