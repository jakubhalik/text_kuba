'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function Icon() {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    return (
        <Image
            alt="Avatar"
            className="rounded-full"
            height="40"
            src={`/avatar${isDarkMode ? '_dark' : ''}.jpg`}
            style={{
                aspectRatio: '40/40',
                objectFit: 'cover',
            }}
            width="40"
        />
    )
}
