'use client';

import Image from 'next/image';

import { Message, User, ChatProps, ChatComponentProps, OnSendMessage } from '../lib/utils';

import { useState, useEffect } from 'react';

import MessageInput from './MessageInput';

import * as openpgp from 'openpgp';

import { getCookie, setCookie } from 'cookies-next';





export default function Chat({
    users,
    iconsAndMoreForUpperSidebar,
    arrowForLeftIcon,
    buttonsIconsAndMoreForUpperChat,
    chatMessages,
    onSendMessage,
    username,
    paperclipIcon,
    publicKeys,
    avatarFiles
}: ChatProps) {
    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const [localChatMessages, setLocalChatMessages] =
        useState<Message[]>(chatMessages);
    
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
            const messageFromWebSockets = JSON.parse(event.data);
            // console.log('message sent to you through web sockets: ', messageFromWebSockets);
            const messagesArray = Array.isArray(messageFromWebSockets) ? messageFromWebSockets : [messageFromWebSockets];
            const decryptedMessage = Promise.all(
                messagesArray.map(async (message: Message) => {
                const privateKeyArmored = getCookie('privateKey') as string;
                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });
                let decryptedMessageText = null;
                let decryptedDatetimeFrom = null;
                let file = null;
                let decryptedFileName = null;
                try {
                    decryptedMessageText = await openpgp.decrypt({
                        message: await openpgp.readMessage({
                            armoredMessage: message.text,
                        }),
                        decryptionKeys: privateKey,
                        verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                    });
                    // console.log('this message was sent by the other person to you through web sockets: ', decryptedMessageText.data);
                } catch (e) {
                    console.error('error in transferring message text sent by the other person than me to me through web sockets: ', e);
                    return { ...message, text: 'error in transferring message text sent by the other person than me to me through web sockets' }
                }
                try {
                    decryptedDatetimeFrom = await openpgp.decrypt({
                        message: await openpgp.readMessage({
                            armoredMessage: message.datetime_from,
                        }),
                        decryptionKeys: privateKey,
                        verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                    });
                    // console.log('this is datetime_from of the message that was sent by the other person to you through web sockets: ', decryptedDatetimeFrom);
                } catch (e) {
                    console.error('error in transferring datetime_from of the message sent by the other person than me to me through web sockets: ', e);
                    return { ...message, text: 'error in transferring datetime_from of the message sent by the other person than me to me through web sockets' }
                }
                if (message.file) {
                    try {
                        const decryptedFile = await openpgp.decrypt({
                            message: await openpgp.readMessage({
                                armoredMessage: message.file,
                            }),
                            decryptionKeys: privateKey,
                            verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                        });
                        file = decryptedFile.data as string;
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
                            verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                        });
                    } catch (e) {
                        console.error('Error decrypting filename:', e);
                    }
                }
                const fileUrl = isImageFile(decryptedFileName!.data as string) &&  createBlobUrl(file!);
                return {
                    ...message,
                    text: decryptedMessageText.data as string,
                    datetime_from: new Date(decryptedDatetimeFrom.data as string).toLocaleString(),
                    file: fileUrl ? fileUrl : null,
                    filename: decryptedFileName ? decryptedFileName.data as string : null,
                };
            }))
            decryptedMessage.then((resolvedMessages) => {
                setLocalChatMessages((prevMessages) => [...prevMessages, ...resolvedMessages]);
            });
        };
        setWs(webSocket);
    }, [users, owner, username, stringifiedOwner, publicKeys]);

    useEffect(() => {
        if (username === owner && selectedUser) {
            localStorage.setItem('selectedUser', selectedUser);
        }
    }, [selectedUser, owner, username]);

    useEffect(() => {
        const decryptMessages = async () => {
            const myPublicKey = publicKeys[username];
            // console.log('my public key: ', myPublicKey);
            const publicKey = getCookie('publicKey') as string;
            if (myPublicKey !== publicKey) {
                setCookie('publicKey', myPublicKey, {
                    path: '/',
                    secure: true,
                    sameSite: 'strict',
                });
                // console.log('public key exchanged for the one you are using now');
            }
            if (!chatMessages.length) { 
                setLoading(false);
                return;
            }
            try {
                const privateKeyArmored = getCookie('privateKey') as string;
                // console.log('Private Key (Armored):', privateKeyArmored);
                const privateKey = await openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });
                // console.log('Private Key (Unarmored):', privateKey);
                // console.log('Key Packet:', privateKey.keyPacket);
                // console.log('Subkeys:', privateKey.subkeys);
                // console.log('Users:', privateKey.users);
                // console.log('Private Key Fingerprint:', privateKey.getFingerprint());
                // console.log('public keys: ', publicKeys);
                const decryptedMessages = await Promise.all(chatMessages.map(async (message) => {
                    try {
                        // console.log('starting a try block of decrypting a message');
                        // console.log('public keys: ', publicKeys);
                        try {
                            let decryptedMessageText = null;
                            let decryptedDatetimeFrom = null;
                            let file = null;
                            let decryptedFileName = null;
                            if (message.send_to === username) {
                                try {
                                    decryptedMessageText = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.text,
                                        }),
                                        decryptionKeys: privateKey,
                                        verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                                    });
                                    // console.log('this message was sent by the other person to you: ', decryptedMessageText);
                                } catch (e) {
                                    console.error('error in transferring message text sent by the other person than me to me: ', e);
                                    return { ...message, text: 'error in transferring message text sent by the other person than me to me' }
                                }
                                try {
                                    decryptedDatetimeFrom = await openpgp.decrypt({
                                        message: await openpgp.readMessage({
                                            armoredMessage: message.datetime_from,
                                        }),
                                        decryptionKeys: privateKey,
                                        verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                                    });
                                    // console.log('this is datetime_from of the message that was sent by the other person to you: ', decryptedMessageText);
                                } catch (e) {
                                    console.error('error in transferring datetime_from of the message sent by the other person than me to me: ', e);
                                    return { ...message, text: 'error in transferring datetime_from of the message sent by the other person than me to me' }
                                }
                                if (message.file) {
                                    try {
                                        const decryptedFile = await openpgp.decrypt({
                                            message: await openpgp.readMessage({
                                                armoredMessage: message.file,
                                            }),
                                            decryptionKeys: privateKey,
                                            verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                                        });
                                        file = decryptedFile.data as string;
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
                                            verificationKeys: await openpgp.readKey({ armoredKey: publicKeys[message.sent_by] }),
                                        });
                                    } catch (e) {
                                        console.error('Error decrypting filename:', e);
                                    }
                                }
                                return {
                                    ...message,
                                    text: decryptedMessageText.data as string,
                                    datetime_from: new Date(decryptedDatetimeFrom.data as string).toLocaleString(),
                                    file: file ? file : null,
                                    filename: decryptedFileName ? decryptedFileName.data as string : null,
                                };
                            } else {
                                decryptedMessageText = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.text,
                                    }),
                                    decryptionKeys: privateKey,
                                });
                                // console.log('this message was sent by you: ', decryptedMessageText);
                                decryptedDatetimeFrom = await openpgp.decrypt({
                                    message: await openpgp.readMessage({
                                        armoredMessage: message.datetime_from,
                                    }),
                                    decryptionKeys: privateKey,
                                });
                                // console.log('this datetime_from is from the message that was sent by you: ', decryptedMessageText);
                                if (message.file) {
                                    try {
                                        const decryptedFile = await openpgp.decrypt({
                                            message: await openpgp.readMessage({
                                                armoredMessage: message.file,
                                            }),
                                            decryptionKeys: privateKey,
                                        });
                                        file = decryptedFile.data as string;
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
                                    datetime_from: new Date(decryptedDatetimeFrom.data as string).toLocaleString(),
                                    file: file ? file : null,
                                    filename: decryptedFileName ? decryptedFileName.data as string : null,
                                };
                            }
                        } catch (e) { 
                            console.error('Error even executing the if username === message.send_to: ', e); 
                            return { ...message, text: 'Error even executing the if username === message.send_to: ', e } 
                        }
                    } catch (e) {
                        console.error('Error decrypting message text:', e);
                        return { ...message, text: 'Error decrypting message' };
                    }
                }));
                // console.log('Chat messages as you get them from the server:', chatMessages);
                // console.log('Decrypted messages:', decryptedMessages);
                decryptedMessages.sort((a, b) => new Date(a.datetime_from).getTime() - new Date(b.datetime_from).getTime());
                setLocalChatMessages(decryptedMessages);
                setLoading(false);
            } catch (e) {
                console.error('Error in decryptMessages function:', e);
                setLoading(false);
            }
        };
        decryptMessages();
    }, [chatMessages, publicKeys, username]);

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
        // console.log('public key: ', publicKey);
        const encryptedMessageText = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: messageText }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string;
        const encryptedDatetimeFrom = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: new Date().toISOString() }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string;
        let stringFile = null;
        const encryptedFile = fileBase64 ? await openpgp.encrypt({
            message: await openpgp.createMessage({ text: fileBase64 as unknown as string }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string : null;
        const encryptedFileName = fileName ? await openpgp.encrypt({
            message: await openpgp.createMessage({ text: fileName }),
            encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }),
            format: 'armored',
        }) as string : null;
        // console.log('encrypted message text: ', encryptedMessageText);
        // console.log('encrypted file: ', encryptedFile);
        // console.log('encrypted filename: ', encryptedFileName);
        const recipientPublicKey = publicKeys[selectedUser!];
        const privateKeyArmored = getCookie('privateKey') as string;
        const privateKey = await openpgp.readPrivateKey({
            armoredKey: privateKeyArmored,
        });
        if (!recipientPublicKey) {
            console.warn('Recipient public key not found. Skipping encryption for recipient.');
        } else {
            // console.log('public keys: ', publicKeys);
            // console.log('recipient public key: ', recipientPublicKey);
            const encryptedMessageTextForRecipient = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: messageText }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                signingKeys: privateKey,
                format: 'armored',
            }) as string;
            const encryptedDatetimeFromForRecipient = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: new Date().toISOString() }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                signingKeys: privateKey,
                format: 'armored',
            }) as string;
            const encryptedFileForRecipient = fileBase64 ? await openpgp.encrypt({
                message: await openpgp.createMessage({ text: fileBase64 as unknown as string }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                signingKeys: privateKey,
                format: 'armored',
            }) as string : null;
            const encryptedFileNameForRecipient = fileName ? await openpgp.encrypt({
                message: await openpgp.createMessage({ text: fileName }),
                encryptionKeys: await openpgp.readKey({ armoredKey: recipientPublicKey }),
                signingKeys: privateKey,
                format: 'armored',
            }) as string : null;
            if (ws) {
                ws.send(
                    JSON.stringify({
                        sendTo: selectedUser,
                        text: encryptedMessageTextForRecipient,
                        datetimeFrom: encryptedDatetimeFromForRecipient,
                        file: encryptedFileForRecipient,
                        filename: encryptedFileNameForRecipient,
                    })
                );
            }
            onSendMessage(
                username,
                selectedUser!,
                encryptedMessageText,
                encryptedDatetimeFrom,
                encryptedMessageTextForRecipient,
                encryptedDatetimeFromForRecipient,
                encryptedFile,
                encryptedFileName,
                encryptedFileForRecipient,
                encryptedFileNameForRecipient
            );
        }
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
        if (base64Data.startsWith('data:image/')) {
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
        if (!filename) { 
            return false; 
        }
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
                username !== owner
                    ? owner!
                    : !selectedUser
                        ? users[0]?.username
                        : selectedUser
            }
            filteredChatMessages={filteredChatMessages}
            getLastMessage={getLastMessage}
            iconsAndMoreForUpperSidebar={iconsAndMoreForUpperSidebar}
            arrowForLeftIcon={arrowForLeftIcon}
            buttonsIconsAndMoreForUpperChat={buttonsIconsAndMoreForUpperChat}
            username={username}
            paperclipIcon={paperclipIcon}
            createBlobUrl={createBlobUrl}
            isImageFile={isImageFile}
            handleSendMessage={handleSendMessage}
            avatarFiles={avatarFiles}
        /> : 
        <>
            {username === owner && (
                <div className="border-r flex flex-col w-full md:max-w-[300px] h-full">
                    {iconsAndMoreForUpperSidebar}
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y max-h-[calc(100vh-150px)] overflow-y-auto">
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
    iconsAndMoreForUpperSidebar,
    arrowForLeftIcon,
    buttonsIconsAndMoreForUpperChat,
    username,
    paperclipIcon,
    createBlobUrl,
    isImageFile,
    handleSendMessage,
    avatarFiles
}: ChatComponentProps) {
    const owner = process.env.NEXT_PUBLIC_OWNER;
    return (
        <>
            {username === owner && (
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
                                        className={`p-4 ${user.username === selectedUser ? 
                                            'bg-blue-200 dark:bg-slate-900' 
                                            : 'bg-gray-100 dark:bg-gray-900'}`}
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
                                                src={`/${avatarFiles[Math.floor(Math.random() * avatarFiles.length)]}`}
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
