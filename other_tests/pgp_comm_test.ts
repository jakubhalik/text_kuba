import * as openpgp from 'openpgp';

async function generateKeys() {
    const keyPair1 = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{}]
    });
    console.log('Key Pair 1:', keyPair1);

    const keyPair2 = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{}]
    });
    console.log('Key Pair 2:', keyPair2);

    const privateKey1 = await openpgp.readPrivateKey({ armoredKey: keyPair1.privateKey });
    const publicKey1 = await openpgp.readKey({ armoredKey: keyPair1.publicKey });
    const privateKey2 = await openpgp.readPrivateKey({ armoredKey: keyPair2.privateKey });
    const publicKey2 = await openpgp.readKey({ armoredKey: keyPair2.publicKey });

    console.log('Private Key 1:', privateKey1);
    console.log('Public Key 1:', publicKey1);
    console.log('Private Key 2:', privateKey2);
    console.log('Public Key 2:', publicKey2);

    const message = 'This is a secret message';
    console.log('Message:', message);

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: publicKey2,
        signingKeys: privateKey1
    });
    console.log('Encrypted Message:', encrypted);

    const decrypted = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encrypted }),
        decryptionKeys: privateKey2,
        verificationKeys: publicKey1
    });
    console.log('Decrypted Message:', decrypted);

    const decryptedText = decrypted.data;
    console.log('Decrypted Text:', decryptedText);
}

generateKeys();

