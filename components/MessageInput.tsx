'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
    onSendMessage: (message: string) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim() !== '') {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    return (
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
    );
}
