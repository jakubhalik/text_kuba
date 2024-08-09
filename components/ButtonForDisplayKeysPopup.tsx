'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { KeyIcon } from 'lucide-react';

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

import { getCookie } from 'cookies-next';

export default function ButtonForDisplayKeysPopup() {

    const [displayKeysPopup, setDisplayKeysPopup] = useState(false);

    const publicKeyArmored = getCookie('publicKey') as string;

    const privateKeyArmored = getCookie('privateKey') as string;

    const [publicKey, setPublicKey] = useState('');

    const [privateKey, setPrivateKey] = useState('');

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
        console.log(text);
    };

    return (
        <>

            <Button
                variant="outline"
                size="icon"
                onClick={() => setDisplayKeysPopup(true)}
            >
                <KeyIcon size="20" />
            </Button>

            <Dialog open={displayKeysPopup} onOpenChange={setDisplayKeysPopup}>

                <DialogTrigger asChild>
                    <button className="hidden">Open</button>
                </DialogTrigger>

                <DialogContent>

                    <DialogTitle>Your pgp keys</DialogTitle>
                    <DialogDescription>
                        As you already know, you cannot afford to loose your private key, so copy it and back it up in a password manager.
                    </DialogDescription>
                    <DialogDescription>
                        Make sure nothing is recording your monitor when displaying the keys.
                    </DialogDescription>
                    <br />

                <Button size="tiny" onClick={() => copyToClipboard(publicKeyArmored)}>Public key to clipboard</Button>
                <Button size="tiny" onClick={() => copyToClipboard(privateKeyArmored)}>Private key to clipboard</Button>
                <Button size="tiny" onClick={() => publicKey !== publicKeyArmored ? setPublicKey(publicKeyArmored) : setPublicKey('')}>Show public key</Button>
                {publicKey && <p className="text-[6px] sm:text-xs">{publicKey}</p>}
                <Button size="tiny" onClick={() => privateKey !== privateKeyArmored ? setPrivateKey(privateKeyArmored) : setPrivateKey('')}>Show private key</Button>
                {privateKey && <p className="text-[6px] sm:text-xs">{privateKey}</p>}

                </DialogContent>

            </Dialog>
        </>
    )
}
