'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
    const { setTheme } = useTheme();

    const { language } = useLanguage();
    const texts = loadLanguage(language);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    data-cy="button_for_dropdown_menu_for_theme_toggle"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only"> data-cy="theme_toggle">
    {texts.theme_toggle}
</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    data-cy="light_theme_button_in_the_dropdown_menu_for_theme_toggle"
                >
                    {texts.theme_toggle_light_dropdown_menu_item}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    data-cy="dark_theme_button_in_the_dropdown_menu_for_theme_toggle"
                >
                    {texts.theme_toggle_dark_dropdown_menu_item}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    data-cy="system_theme_button_in_the_dropdown_menu_for_theme_toggle"
                >
                    {texts.theme_toggle_system_dropdown_menu_item}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
