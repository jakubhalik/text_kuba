'use client';

import Image from 'next/image';

import { Message, User, ChatProps, ChatComponentProps, OnSendMessage } from '../lib/utils';

import { useState, useEffect } from 'react';

import MessageInput from './MessageInput';

import * as openpgp from 'openpgp';

import { getCookie } from 'cookies-next';





export default function Chat({
    users,
    conditionalForOwner,
    iconsAndMoreForUpperSidebar,
    arrowForLeftIcon,
    buttonsIconsAndMoreForUpperChat,
    chatMessages,
    onSendMessage,
    username,
    paperclipIcon,
    publicKeys
}: ChatProps) {
    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const [localChatMessages, setLocalChatMessages] =
        useState<Message[]>(chatMessages);

    
    useEffect(() => {

        const decryptMessages = async () => {
            if (!chatMessages.length) { 
                setLoading(false);
                return;
            }

            try {
                const privateKeyArmored = getCookie('privateKey') as string;
                console.log('Private Key (Armored):', privateKeyArmored);

                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });

                console.log('Private Key (Unarmored):', privateKey);
                console.log('Key Packet:', privateKey.keyPacket);
                console.log('Subkeys:', privateKey.subkeys);
                console.log('Users:', privateKey.users);
                console.log('Private Key Fingerprint:', privateKey.getFingerprint());

                const decryptedMessages = await Promise.all(chatMessages.map(async (message) => {
                    try {
                        const decryptedMessageText = await openpgp.decrypt({
                            message: await openpgp.readMessage({
                                armoredMessage: message.text,
                            }),
                            decryptionKeys: privateKey,
                        });

                        let file = null;
                        let decryptedFileName = null;

                        if (message.file) {
                            try {
                                const decryptedFile = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.file,
                                    }),
                                    decryptionKeys: privateKey,
                                });

                                const fileData = decryptedFile.data as Uint8Array;

                                file = `data:image/*;base64,${Buffer.from(fileData).toString('base64')}`;

                            } catch (e) {
                                console.error('Error decrypting file:', e);
                            }
                        }

                        if (message.filename) {
                            try {
                                decryptedFileName = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.filename,
                                    }),
                                    decryptionKeys: privateKey,
                                });
                            } catch (e) {
                                console.error('Error decrypting filename:', e);
                            }
                        }

                        return {
                            ...message,
                            text: decryptedMessageText.data as string,
                            file: file ? file : null,
                            filename: decryptedFileName ? decryptedFileName.data as string : null,
                        };

                    } catch (e) {
                        console.error('Error decrypting message text:', e);
                        return { ...message, text: 'Error decrypting message' };
                    }
                }));

                console.log('Chat messages as you get them from the server:', chatMessages);
                console.log('Decrypted messages:', decryptedMessages);

               setLocalChatMessages(decryptedMessages);
                setLoading(false);

            } catch (e) {
                console.error('Error in decryptMessages function:', e);
                setLoading(false);
            }
        };

        decryptMessages();

    }, [chatMessages]);

    const [ws, setWs] = useState<WebSocket | null>(null);

    const owner = process.env.NEXT_PUBLIC_OWNER;

    const stringifiedOwner = String(owner);

    useEffect(() => {
        if (username === stringifiedOwner) {

            const savedUser = localStorage.getItem('selectedUser');
            const initialUser = savedUser || users[0]?.username;
            setSelectedUser(initialUser);

        } else {
            setSelectedUser(stringifiedOwner);
        }

        const webSocketPort = process.env.NEXT_PUBLIC_WEB_SOCKET_PORT;

        const webSocket = new WebSocket(
            `${webSocketPort}?username=${username}`
        );

        webSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setLocalChatMessages((prevMessages) => [...prevMessages, message]);
        };

        setWs(webSocket);

    }, [users, owner, username, stringifiedOwner]);

    useEffect(() => {
        if (username === owner && selectedUser) {
            localStorage.setItem('selectedUser', selectedUser);
        }
    }, [selectedUser, owner, username]);

    const handleUserClick = async (username: string) => {
        setSelectedUser(username);
    };

    const handleSendMessage = async ({
        messageText,
        fileBase64,
        fileName,
    }: OnSendMessage) => {
        const newMsg: Message = {
            datetime_from: new Date().toLocaleString(),
            sent_by: username,
            send_to: selectedUser!,
            text: messageText,
            file: fileBase64 || null,
            filename: fileName || null,
        };

        setLocalChatMessages((prevMessages) => [...prevMessages, newMsg]);

        const publicKey = getCookie('publicKey') as string;

        console.log('public key: ', publicKey);

        const encryptedMessageText = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: messageText }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string;

        let stringFile = null;

        if (fileBase64) {
            const base64Data = Buffer.from(fileBase64).toString('base64'); // Remove the data URL prefix
            // const base64Data = fileBase64.split(',')[1]; // Remove the data URL prefix
            stringFile = base64Data;
            console.log('filebase64: ', fileBase64);
        }

        const encryptedFile = stringFile ? await openpgp.encrypt({
            message: await openpgp.createMessage({ text: stringFile }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string : null;

        const encryptedFileName = fileName ? await openpgp.encrypt({
            message: await openpgp.createMessage({ text: fileName }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string : null;

        console.log('encrypted message text: ', encryptedMessageText);
        console.log('encrypted file: ', encryptedFile);
        console.log('encrypted filename: ', encryptedFileName);

        const recipientPublicKey = publicKeys[selectedUser!];

        if (!recipientPublicKey) {
            console.warn('Recipient public key not found. Skipping encryption for recipient.');
        } else {

            const encryptedMessageTextForRecipient = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: encryptedMessageText }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                format: 'armored',
            }) as string;

            const encryptedFileForRecipient = encryptedFile ? await openpgp.encrypt({
                message: await openpgp.createMessage({ text: encryptedFile }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                format: 'armored',
            }) as string : null;

            const encryptedFileNameForRecipient = encryptedFileName ? await openpgp.encrypt({
                message: await openpgp.createMessage({ text: encryptedFileName }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                format: 'armored',
            }) as string : null;

            if (ws) {
                ws.send(
                    JSON.stringify({
                        sendTo: selectedUser,
                        text: encryptedMessageTextForRecipient,
                        file: encryptedFileForRecipient,
                        filename: encryptedFileNameForRecipient,
                    })
                );
            }

            onSendMessage(
                username,
                selectedUser!,
                encryptedMessageText,
                encryptedMessageTextForRecipient,
                encryptedFile,
                encryptedFileName,
                encryptedFileForRecipient,
                encryptedFileNameForRecipient
            );

        }

        // This block is for a client side test ->

        const privateKeyArmored = getCookie('privateKey') as string;
        if (!privateKeyArmored || !publicKey) {
            console.error('Missing or corrupted key(s)');
        } else {
            console.log('Keys are not missing.');
        }
        console.log('public key: ', publicKey);
        console.log('private key armored: ', privateKeyArmored);

        try {
            const privateKey = await openpgp.readPrivateKey({
                armoredKey: privateKeyArmored,
            });
            console.log('Unarmored Private Key:', privateKey);
            try {
                const testMessage = 'Test message';
                const encryptedMessage = await openpgp.encrypt({
                    message: await openpgp.createMessage({ text: testMessage }),
                    encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
                });
                console.log('test message encrypted with the public key: ', encryptedMessage);
                try {
                    const decryptedMessage = await openpgp.decrypt({
                        message: await openpgp.readMessage({ armoredMessage: encryptedMessage }),
                        decryptionKeys: privateKey,
                    });
                    console.log('Decrypted message:', decryptedMessage.data);
                    try {
                        const decryptedEncryptedMessageText = await openpgp.decrypt({
                            message: await openpgp.readMessage({
                                armoredMessage: encryptedMessageText,
                            }),
                            decryptionKeys: privateKey
                        })
                        const decryptedEncryptedFile = encryptedFile ? await openpgp.decrypt({
                            message: await openpgp.readMessage({
                                armoredMessage: encryptedFile,
                            }),
                            decryptionKeys: privateKey
                        }) : null
                        const decryptedEncryptedFileName = encryptedFileName ? await openpgp.decrypt({
                            message: await openpgp.readMessage({
                                armoredMessage: encryptedFileName,
                            }),
                            decryptionKeys: privateKey
                        }) : null
                        console.log(
                            'The decrypted encrypted message text only here on the client for test: ', 
                            decryptedEncryptedMessageText
                        );
                        console.log(
                            'The decrypted encrypted file only here on the client for test: ', 
                            decryptedEncryptedFile
                        )
                        console.log(
                            'The decrypted encrypted filename only here on the client for test: ',
                            decryptedEncryptedFileName
                        )
                    } catch (error) {
                        console.error('Failed to decrypt the message that was actually sent by the user', error);
                    }
                } catch (error) {
                    console.error('Failed decrypting the test message: ', error);
                }
            } catch (error) {
                console.error('Failed generating test message with the public key: ', error);
            }
        } catch (error) {
            console.error('Failed to unarmor the private key:', error);
        }
        
        // This block is for a client side test <-
        
    };

    const filteredChatMessages = localChatMessages.filter(
        (message) =>
            (message.sent_by === username &&
                message.send_to === selectedUser) ||
            (message.sent_by === selectedUser && message.send_to === username)
    );

    const getLastMessage = (user: User) => {
        const messages = localChatMessages

            .filter(
                (message) =>

                    (message.sent_by === username &&
                        message.send_to === user.username) ||

                    (message.sent_by === user.username &&
                        message.send_to === username)
            )
            .sort(
                (a, b) =>
                    new Date(b.datetime_from).getTime() -
                    new Date(a.datetime_from).getTime()
            );

        return messages.length > 0 ? messages[0] : null;
    };

    const createBlobUrl = (base64Data: string) => {

        if (base64Data.startsWith('data:')) {
            return base64Data;
        }

        try {
            const byteCharacters = atob(base64Data);

            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);

            const blob = new Blob([byteArray]);

            return URL.createObjectURL(blob);

        } catch (error) {
            console.error('Invalid base64 string:', error);
            return '';
        }
    };

    const isImageFile = (filename: string | null) => {

        if (!filename) return false;

        const extension = filename.split('.').pop()?.toLowerCase();

        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(
            extension!
        );

    };

    return !loading ? 
        <ChatComponent
            users={users}
            handleUserClick={handleUserClick}
            selectedUser={
                !conditionalForOwner
                    ? owner!
                    : !selectedUser
                        ? users[0]?.username
                        : selectedUser
            }
            filteredChatMessages={filteredChatMessages}
            getLastMessage={getLastMessage}
            conditionalForOwner={conditionalForOwner}
            iconsAndMoreForUpperSidebar={iconsAndMoreForUpperSidebar}
            arrowForLeftIcon={arrowForLeftIcon}
            buttonsIconsAndMoreForUpperChat={buttonsIconsAndMoreForUpperChat}
            username={username}
            paperclipIcon={paperclipIcon}
            createBlobUrl={createBlobUrl}
            isImageFile={isImageFile}
            handleSendMessage={handleSendMessage}
        /> : 
        <>
            {conditionalForOwner && (
                <div className="border-r flex flex-col w-full md:max-w-[300px] h-full">
                    {iconsAndMoreForUpperSidebar}
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y max-h-[calc(100vh-150px)] overflow-y-auto">
                            <li
                                className="bg-gray-100 p-4 dark:bg-gray-900"
                            >
                                <div
                                    className="flex items-center gap-4 p-4 rounded-lg cursor-pointer"
                                >
                                    <Image
                                        alt="Avatar"
                                        className="rounded-full"
                                        height="40"
                                        src="/placeholder.svg"
                                        style={{
                                            aspectRatio: '40/40',
                                            objectFit: 'cover',
                                        }}
                                        width="40"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                        </p>
                                    </div>
                                    <span className="text-sm">
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
            <div className="flex flex-col w-full h-[calc(100vh-88px)] pb-[75px]">
                <div className="border-b flex items-center px-4 py-5 justify-between">
                </div>
                <div className="pt-60 inset-x-0 mx-auto flex justify-center">
                    <svg
                        className="animate-spin h-24 w-24 text-blue-500"
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
                <MessageInput
                    onSendMessage={handleSendMessage}
                    paperclipIcon={paperclipIcon}
                />
            </div>
        </>
}

function ChatComponent({
    users,
    handleUserClick,
    selectedUser,
    filteredChatMessages,
    getLastMessage,
    conditionalForOwner,
    iconsAndMoreForUpperSidebar,
    arrowForLeftIcon,
    buttonsIconsAndMoreForUpperChat,
    username,
    paperclipIcon,
    createBlobUrl,
    isImageFile,
    handleSendMessage,
}: ChatComponentProps) {

    return (
        <>
            {conditionalForOwner && (
                <div className="border-r flex flex-col w-full md:max-w-[300px] h-full">
                    {iconsAndMoreForUpperSidebar}
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y max-h-[calc(100vh-150px)] overflow-y-auto">
                            {users.map((user, index) => {
                                const lastMessage = getLastMessage(user);
                                let lastMessageText = 'No messages yet';
                                let lastMessageTime = '';

                                if (lastMessage) {
                                    if (typeof lastMessage.text === 'string') {
                                        lastMessageText = lastMessage.text.length > 10 ?
                                            `${lastMessage.text.substring(0, 10)}...` :
                                            lastMessage.text;
                                    } else {
                                        lastMessageText = 'Invalid message type';
                                    }
                                    lastMessageTime = new Date(
                                        lastMessage.datetime_from
                                    ).toLocaleString();
                                }

                                return (
                                    <li
                                        key={index}
                                        className="bg-gray-100 p-4 dark:bg-gray-900"
                                    >
                                        <div
                                            className="flex items-center gap-4 p-4 rounded-lg cursor-pointer"
                                            onClick={() =>
                                                handleUserClick(user.username)
                                            }
                                        >
                                            <Image
                                                alt="Avatar"
                                                className="rounded-full"
                                                height="40"
                                                src="/placeholder.svg"
                                                style={{
                                                    aspectRatio: '40/40',
                                                    objectFit: 'cover',
                                                }}
                                                width="40"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {user.username}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {lastMessageText}
                                                </p>
                                            </div>
                                            <span className="text-sm">
                                                {lastMessageTime}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
            <div className="flex flex-col w-full h-[calc(100vh-88px)] pb-[75px]">

                <div className="border-b flex items-center px-4 py-2 justify-between">
                    <div>
                        {arrowForLeftIcon}
                        <h2 className="font-semibold pr-14">{selectedUser}</h2>
                    </div>
                    {buttonsIconsAndMoreForUpperChat}
                </div>

                <div className="flex-1 p-4 pb-10 space-y-4 overflow-y-auto">
                    {filteredChatMessages &&
                        filteredChatMessages.length > 0 &&
                        filteredChatMessages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.sent_by === username
                                        ? 'flex-row-reverse'
                                        : ''
                                    } items-start`}
                            >
                                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
                                    <p>{typeof message.text === 'string' && message.text}</p>
                                    {message.file &&
                                        (isImageFile(message.filename) ? (
                                            <>
                                                <img
                                                    src={createBlobUrl(
                                                        message.file as string
                                                    )}
                                                    alt={message.filename!}
                                                    className="max-w-full h-auto rounded mt-2"
                                                    width="300"
                                                    height="300"
                                                />
                                                <a
                                                    href={createBlobUrl(
                                                        message.file as string
                                                    )}
                                                    download={message.filename}
                                                    className="text-blue-500 underline block mt-2"
                                                >
                                                    Download Image
                                                </a>
                                            </>
                                        ) : (
                                            <a
                                                href={createBlobUrl(
                                                    message.file as string
                                                )}
                                                download={message.filename}
                                                className="text-blue-500 underline"
                                            >
                                                {message.filename}
                                            </a>
                                        ))}
                                </div>
                                <span className="text-sm text-gray-500 self-end ml-2 dark:text-gray-400 pr-2">
                                    {new Date(
                                        message.datetime_from
                                    ).toLocaleString()}
                                </span>
                            </div>
                        ))}
                </div>

                <MessageInput
                    onSendMessage={handleSendMessage}
                    paperclipIcon={paperclipIcon}
                />

            </div>
        </>
    );
}
