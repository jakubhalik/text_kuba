'use client';

import { Button } from '@/components/ui/button';
import { KeyIcon } from 'lucide-react';

export default function ButtonForDisplayKeysPopup() {
    return (
        <Button
            variant="outline"
            size="icon"
        >
            <KeyIcon size="20" />
        </Button>
    )
}
