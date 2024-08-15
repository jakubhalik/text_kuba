'use server';

import * as openpgp from 'openpgp';

export async function decryptWithPublicKey(
    publicKeyArmored: string,
    encryptedText: string
): Promise<string> {

    'use server';

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

        await verified;

        const decrypted = message.getText();

        console.log('Decrypted Text:', decrypted);

        console.log('decryptWithPublicKey - End');

        return decrypted as string;

    } catch (error) {
        console.error('Error in decryptWithPublicKey:', error);
        throw error;
    }
}


