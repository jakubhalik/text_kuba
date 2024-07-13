'use client';

import Image from 'next/image';
import { Message, User } from '../lib/utils';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ChatProps {
    users: User[];
    onUserSelect: (username: string) => Promise<void>;
    onSendMessage: (message: string) => void;
    conditionalForOwner: boolean;
    iconsAndMoreForUpperSidebar: React.ReactNode;
    arrowForLeftIcon: React.ReactNode;
    buttonsIconsAndMoreForUpperChat: React.ReactNode;
    chatMessages: Message[];
    username: string;
    password: string;
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
}: ChatProps) {
    const [selectedUser, setSelectedUser] = useState<string>(users[0].username);

    const handleUserClick = async (username: string) => {
        setSelectedUser(username);
        await onUserSelect(username);
    };

    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim() !== '') {
            onSendMessage(username, password, selectedUser, newMessage);
            setNewMessage('');
        }
    };

    const filteredChatMessages = chatMessages.filter(
        (message) =>
            (message.sent_by === username &&
                message.send_to === selectedUser) ||
            (message.sent_by === selectedUser && message.send_to === username)
    );

    const getLastMessage = (user: User) => {
        const messages = chatMessages
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

    return (
        <>
            {conditionalForOwner && (
                <div className="border-r flex flex-col w-full md:max-w-[300px]">
                    {iconsAndMoreForUpperSidebar}
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y">
                            {users.map((user, index) => {
                                const lastMessage = getLastMessage(user);
                                let lastMessageText = 'No messages yet';
                                let lastMessageTime = '';

                                if (lastMessage) {
                                    if (
                                        lastMessage.sent_by === user.username ||
                                        lastMessage.send_to === user.username
                                    ) {
                                        lastMessageText = lastMessage.text;
                                        lastMessageTime = new Date(
                                            lastMessage.datetime_from
                                        ).toLocaleString();
                                    }
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
                        </ul>{' '}
                    </div>
                </div>
            )}
            <div className="flex flex-col w-full h-[calc(100vh-88px)] pb-16">
                <div className="border-b flex items-center p-4 space-x-4">
                    <div className="flex items-center space-x-2">
                        {arrowForLeftIcon}
                        <h2 className="font-semibold">{selectedUser}</h2>
                    </div>
                    {buttonsIconsAndMoreForUpperChat}
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    {filteredChatMessages && filteredChatMessages.length > 0 ? (
                        filteredChatMessages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.sent_by === username ? 'flex-row-reverse' : ''} items-start`}
                            >
                                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
                                    <p>{message.text}</p>
                                </div>
                                <span className="text-sm text-gray-500 self-end ml-2 dark:text-gray-400 pr-2">
                                    {new Date(
                                        message.datetime_from
                                    ).toLocaleString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div>No messages yet</div>
                    )}
                </div>{' '}
                <div className="flex items-center p-4 space-x-4 pt-4 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800">
                    <Textarea
                        className="min-h-0 max-h-40 overflow-hidden resize-none"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button size="sm" onClick={handleSendMessage}>
                        <p className="text-md font-medium">Send</p>
                    </Button>
                </div>
            </div>
        </>
    );
}
