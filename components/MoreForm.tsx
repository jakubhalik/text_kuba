'use client';

import { useState, useRef, FormEvent } from 'react';
import { useLanguage } from './GlobalStates';
import { loadLanguage, handleEncryptedLogin, FormData, ChangePasswordInterface } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogTitle,
    DialogTrigger,
    DialogContent,
    DialogDescription
} from '@/components/ui/dialog';
import Loading from './Loading';
import { getCookie } from 'cookies-next';

interface MoreFormProps {
    signoutAction: (username: string) => Promise<void>;
    changePasswordAction: (formData: FormData, newPassword: string) => Promise<ChangePasswordInterface>;
    username: string;
}
export default function MoreForm({ signoutAction, changePasswordAction, username }: MoreFormProps) {
    const { language } = useLanguage();
    const texts = loadLanguage(language);
    const [passwordPopup, setPasswordPopup] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const getPassword = () => passwordRef.current?.value || '';
    const getNewPassword = () => newPasswordRef.current?.value || '';
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitLoading(true);
        setErrorPopup(false);
        setSuccess(false);
        const formData = await handleEncryptedLogin({
            username: username,
            setError,
            texts: { login_failed: texts.display_keys_gen_new_keys_error, private_key_not_in_cookies: texts.private_key_not_in_cookies },
            getPassword,
            setSubmitLoading,
            getCookie,
        });
        const result = await changePasswordAction(formData!, getNewPassword());
        if (result.success) {
            setSubmitLoading(false);
            setSuccess(true);
        }
        if (!result.success && result.action === 'fail') {
            setError(texts.change_password_error);
            setSubmitLoading(false);
            setErrorPopup(true);
        }
        if (!result.success && result.action === 'critical fail') {
            setError(texts.change_password_critical_error);
            setSubmitLoading(false);
            setErrorPopup(true);
        }
    }
    return (
        <>
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
                            await signoutAction(username);
                            return;
                        }}
                        data-cy="signout_button"
                    >
                        {texts.signout_button}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPasswordPopup(true)}>{texts.open_change_password_popup_button}</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={passwordPopup} onOpenChange={setPasswordPopup}>
                <DialogTrigger asChild>
                    <button className="hidden">Open</button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>{texts.change_password_title}</DialogTitle> 
                    <DialogDescription>{texts.change_password_dialog_description}</DialogDescription>
                    <form className="grid grid-cols-1 items-center gap-4" onSubmit={handleSubmit}>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            ref={passwordRef}
                            required
                            placeholder={texts.change_password_input_placeholder}
                        />
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            ref={newPasswordRef}
                            required
                            placeholder={texts.change_password_new_password_input_placeholder}
                        />
                        {!submitLoading && <Button type="submit" className="bg-red-500 hover:bg-red-600 active:bg-red-700 dark:bg-red-300 dark:hover:bg-red-400 dark:active:bg-red-500">{texts.change_password_submit_button}</Button>}
                        {submitLoading && <Loading />}
                        {submitLoading && <DialogDescription>{texts.change_password_loading_dialog_description}</DialogDescription>}
                        {errorPopup && error && <p className="text-red-500">{error}</p>}
                    </form>
                    {success && <p className="text-green-500">{texts.change_password_success}</p>}
                </DialogContent>
            </Dialog>
        </>
    );
}
