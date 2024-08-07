'use client';

import Image from 'next/image';
import { Message, User } from '../lib/utils';
import { useState, useEffect } from 'react';
import MessageInput from './MessageInput';

interface ChatProps {
    users: User[];
    onUserSelect: (username: string) => Promise<void>;
    onSendMessage: (
        username: string,
        password: string,
        sendTo: string,
        messageText: string,
        fileBase64?: string | null,
        fileName?: string | null
    ) => void;
    conditionalForOwner: boolean;
    iconsAndMoreForUpperSidebar: React.ReactNode;
    arrowForLeftIcon: React.ReactNode;
    buttonsIconsAndMoreForUpperChat: React.ReactNode;
    chatMessages: Message[];
    username: string;
    password: string;
    paperclipIcon: React.ReactNode;
}

export default function Chat({
    users,
    onUserSelect,
    conditionalForOwner,
    iconsAndMoreForUpperSidebar,
    arrowForLeftIcon,
    buttonsIconsAndMoreForUpperChat,
    chatMessages,
    onSendMessage,
    username,
    password,
    paperclipIcon,
}: ChatProps) {
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
            if (initialUser) {
                onUserSelect(initialUser);
            }
        } else {
            setSelectedUser(stringifiedOwner);
        }

        const webSocket = new WebSocket(
            `ws://localhost:8080?username=${username}`
        );
        webSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setLocalChatMessages((prevMessages) => [...prevMessages, message]);
        };
        setWs(webSocket);
    }, [onUserSelect, users, owner, username, stringifiedOwner]);

    useEffect(() => {
        if (username === owner && selectedUser) {
            localStorage.setItem('selectedUser', selectedUser);
        }
    }, [selectedUser, owner, username]);

    const handleUserClick = async (username: string) => {
        setSelectedUser(username);
        await onUserSelect(username);
    };

    const handleSendMessage = async (
        messageText: string,
        fileBase64?: string | null,
        fileName?: string | null
    ) => {
        const newMsg: Message = {
            datetime_from: new Date().toLocaleString(),
            sent_by: username,
            send_to: selectedUser!,
            text: messageText,
            file: fileBase64 || null,
            filename: fileName || null,
        };

        setLocalChatMessages((prevMessages) => [...prevMessages, newMsg]);

        if (ws) {
            ws.send(
                JSON.stringify({
                    sendTo: selectedUser,
                    text: messageText,
                    file: fileBase64,
                    filename: fileName,
                })
            );
        }

        onSendMessage(
            username,
            password,
            selectedUser!,
            messageText,
            fileBase64,
            fileName
        );
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

    return (
        <ChatComponent
            users={users}
            handleUserClick={handleUserClick}
            selectedUser={
                !conditionalForOwner
                    ? owner
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
        />
    );
}

interface ChatComponentProps {
    users: User[];
    handleUserClick: (username: string) => Promise<void>;
    selectedUser: string | null;
    filteredChatMessages: Message[];
    getLastMessage: (user: User) => Message | null;
    conditionalForOwner: boolean;
    iconsAndMoreForUpperSidebar: React.ReactNode;
    arrowForLeftIcon: React.ReactNode;
    buttonsIconsAndMoreForUpperChat: React.ReactNode;
    username: string;
    paperclipIcon: React.ReactNode;
    createBlobUrl: (base64Data: string) => string;
    isImageFile: (filename: string | null) => boolean;
    handleSendMessage: (
        messageText: string,
        fileBase64?: string | null,
        fileName?: string | null
    ) => Promise<void>;
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
                        <ul className="divide-y max-h-[calc(100vh-235px)] overflow-y-auto">
                            {users.map((user, index) => {
                                const lastMessage = getLastMessage(user);
                                let lastMessageText = 'No messages yet';
                                let lastMessageTime = '';

                                if (lastMessage) {
                                    lastMessageText = lastMessage.text;
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
                <div className="border-b flex items-center p-4 space-x-4">
                    <div className="flex items-center space-x-2">
                        {arrowForLeftIcon}
                        <h2 className="font-semibold">{selectedUser}</h2>
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
                                    <p>{message.text}</p>
                                    {message.file &&
                                        (isImageFile(message.filename) ? (
                                            <>
                                                <img
                                                    src={createBlobUrl(
                                                        message.file
                                                    )}
                                                    alt={message.filename}
                                                    className="max-w-full h-auto rounded mt-2"
                                                    width="300"
                                                    height="300"
                                                />
                                                <a
                                                    href={createBlobUrl(
                                                        message.file
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
                                                    message.file
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
