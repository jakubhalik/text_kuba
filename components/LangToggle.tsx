'use client';

import * as React from 'react';

import '/node_modules/flag-icons/css/flag-icons.min.css';

import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LangToggle() {
    const { language, setLanguage } = useLanguage();
    const texts = loadLanguage(language);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    data-cy="button_for_dropdown_menu_for_lang_toggle"
                >
                    <span className={`fi fi-${language}`}></span>
                    <span className="sr-only"> data-cy="lang_toggle">
    {texts.lang_toggle}
</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLanguage('us')}
                    data-cy="us_button_in_the_dropdown_menu_for_lang_toggle"
                >
                    {texts.lang_toggle_english_dropdown_menu_item}
                    <span className="ml-auto">
                        <span className="fi fi-us"></span>
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage('cz')}
                    data-cy="cz_button_in_the_dropdown_menu_for_lang_toggle"
                >
                    {texts.lang_toggle_czech_dropdown_menu_item}
                    <span className="ml-auto">
                        <span className="fi fi-cz"></span>
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
