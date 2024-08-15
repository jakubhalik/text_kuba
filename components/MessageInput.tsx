'use client';

import Image from 'next/image';

import { useState, ChangeEvent } from 'react';

import { Textarea } from '@/components/ui/textarea';

import { Button } from '@/components/ui/button';

import { MessageInputProps } from '@/lib/utils';



export default function MessageInput({
    onSendMessage,
    paperclipIcon,
}: MessageInputProps) {
    const [newMessage, setNewMessage] = useState('');

    const [file, setFile] = useState<File | null>(null);

    const [filePreview, setFilePreview] = useState<string | null>(null);

    const handleSendMessage = async () => {

        if (newMessage.trim() !== '' || file) {
            let fileBase64 = null;
            let fileName = null;
            if (file) {
                fileBase64 = await toBase64(file);
                fileName = file.name;
            }

            onSendMessage({messageText: newMessage, fileBase64: fileBase64 as ArrayBuffer, fileName: fileName});
            setNewMessage('');
            setFile(null);
            setFilePreview(null);
        }
    };

    const toBase64 = (file: File): Promise<string | ArrayBuffer | null> =>

        new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result);

            reader.onerror = (error) => reject(error);
        });

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {

        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setFilePreview(fileUrl);
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
        <div className="
            flex items-center p-4 space-x-4 pt-4 fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800
        ">
            {filePreview &&
                (isImageFile(file?.name!) ? (
                    <div className="flex-shrink-0">
                        <Image
                            src={filePreview}
                            alt="File Preview"
                            className="rounded"
                            width="50"
                            height="50"
                        />
                    </div>
                ) : (
                    <div className="flex-shrink-0 text-sm text-blue-500">
                        {file?.name}
                    </div>
                ))}
            <Textarea
                className="min-h-0 max-h-40 overflow-hidden resize-none flex-1"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
            />
            <div className="relative inline-block">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                />
                {paperclipIcon}
            </div>
            <Button size="sm" onClick={handleSendMessage}>
                <p className="text-[15px] font-medium">Send</p>
            </Button>
        </div>
    );
}
