import type { Metadata } from 'next';
import './globals.css';
import { capitalizeFirstLetter } from '@/lib/utils';
import { ownerString } from '@/postgresConfig';

const ownerNameForMetadata = `Text ${capitalizeFirstLetter(ownerString)}`;

export const metadata: Metadata = {
    title: ownerNameForMetadata,
    description: ownerNameForMetadata,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
