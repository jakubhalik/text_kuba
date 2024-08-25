'use client';

import * as React from 'react';
import Flag from './Flag';
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
                    <Flag language={language} />
                    <span className="sr-only" data-cy="lang_toggle">{texts.lang_toggle}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLanguage('us')}
                    data-cy="us_button_in_the_dropdown_menu_for_lang_toggle"
                >
                    {texts.lang_toggle_english_dropdown_menu_item}
                    <span className="ml-auto">
                        <Flag language={'us'} />
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage('cz')}
                    data-cy="cz_button_in_the_dropdown_menu_for_lang_toggle"
                >
                    {texts.lang_toggle_czech_dropdown_menu_item}
                    <span className="ml-auto">
                        <Flag language={'cz'} />
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
