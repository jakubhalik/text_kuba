'use client';

import Image from 'next/image';
import { Message, User } from '../lib/utils';
import { useState } from 'react';

interface SidebarProps {
    sidebarMessages: Message[];
    users: User[];
    onUserSelect: (username: string) => Promise<void>; // Notify the parent component
}

export default function Sidebar({
    sidebarMessages,
    users,
    onUserSelect,
}: SidebarProps) {
    const [selectedUser, setSelectedUser] = useState<string>(users[0].username);

    const handleUserClick = async (username: string) => {
        setSelectedUser(username);
        await onUserSelect(username); // Notify the parent component
        console.log(
            'selected user got updated from the the handleUserClick function in the Sidebar component: ',
            username
        );
    };

    return users.map((user, index) => (
        <li key={index} className="bg-gray-100 p-4 dark:bg-gray-900">
            <div
                className="flex items-center gap-4 p-4 rounded-lg cursor-pointer"
                onClick={() => handleUserClick(user.username)}
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
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sidebarMessages.find(
                            (message) => message.sent_by === user.username
                        )?.text || 'No messages yet'}
                    </p>
                </div>
                <span className="text-sm">
                    {sidebarMessages.find(
                        (message) => message.sent_by === user.username
                    )?.datetime_from || ''}
                </span>
            </div>
        </li>
    ));
}
