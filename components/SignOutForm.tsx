'use client';

import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SignOutFormProps {
    action: () => Promise<void>;
}

export default function SignOutForm({ action }: SignOutFormProps) {
    const { language } = useLanguage();
    const texts = loadLanguage(language);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    data-cy="button_for_dropdown_menu_for_signout"
                >
                    <MoreHorizontal className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only" data-cy="more_options_toggle">
                        {texts.more_options_toggle}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={async (e) => {
                        e.preventDefault();
                        await action();
                        window.location.href = '/';
                    }}
                    data-cy="signout_button"
                >
                    {texts.signout_button}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
