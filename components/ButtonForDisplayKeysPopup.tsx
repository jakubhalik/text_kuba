'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { KeyIcon } from 'lucide-react';

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogAction,
    AlertDialogTitle,
    AlertDialogDescription
} from '@/components/ui/alert-dialog';

import { getCookie } from 'cookies-next';

export default function ButtonForDisplayKeysPopup() {

    const [displayKeysPopup, setDisplayKeysPopup] = useState(false);

    const publicKeyArmored = getCookie('publicKey') as string;

    const privateKeyArmored = getCookie('privateKey') as string;

    const [publicKey, setPublicKey] = useState('');

    const [privateKey, setPrivateKey] = useState('');

    return (
        <>

            <Button
                variant="outline"
                size="icon"
                onClick={() => setDisplayKeysPopup(true)}
            >
                <KeyIcon size="20" />
            </Button>

            <AlertDialog open={displayKeysPopup} onOpenChange={setDisplayKeysPopup}>

                <AlertDialogTrigger asChild>
                    <button className="hidden">Open</button>
                </AlertDialogTrigger>

                <AlertDialogContent>

                    <AlertDialogTitle>Your pgp keys</AlertDialogTitle>
                    <AlertDialogDescription>
                        As you already know, you cannot afford to loose your private key, so copy it and back it up in a password manager.
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                        Make sure nothing is recording your monitor when displaying the keys.
                    </AlertDialogDescription>

                <AlertDialogAction>Public key to clipboard</AlertDialogAction>
                <AlertDialogAction>Private key to clipboard</AlertDialogAction>
                <AlertDialogAction onClick={() => setPublicKey(publicKey)}>Show public key</AlertDialogAction>
                <p>{publicKey}</p>
                <AlertDialogAction onClick={() => setPrivateKey(privateKey)}>Show private key</AlertDialogAction>
                <p>{privateKey}</p>

                </AlertDialogContent>

            </AlertDialog>
        </>
    )
}
