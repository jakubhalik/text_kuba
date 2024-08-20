'use client';
import { Label } from '@/components/ui/label';
import { useLanguage } from './GlobalStates';
import { loadLanguage } from '@/lib/utils';
export default function PrivacyModelInfo() {
    const { language } = useLanguage();
    const texts = loadLanguage(language);
    return (
    <div className="flex items-center space-x-2 px-1">
        <Label
            className="text-sm leading-1"
            htmlFor="terms"
            data-cy="signup_information"
        >
            {texts.signup_info_1}
            <br />
            <br />
            {texts.signup_info_2}
            <br />
            <br />
            {texts.signup_info_3}
            <br />
            {texts.signup_info_4}
            <br />
            <br />
            {texts.signup_info_5}
            <br />
            <br />
            {texts.signup_info_6}
            <br />
            <br />
            {texts.signup_info_7}
            <br />
            <br />
            {texts.signup_info_8}
            <br />
            <br />
            {texts.signup_info_9}
            <br />
            <br />
            {texts.signup_info_10}
            <br />
            <br />
            {texts.signup_info_11}
            <br />
            {texts.signup_info_12}
            <br />
            {texts.signup_info_13}
            <br />
            <br />
            {texts.signup_info_14}
            <br />
            <br />
            {texts.signup_info_15}
            <br />
            {texts.signup_info_16}
            <br />
            <br />
            {texts.signup_info_17}
        </Label>
    </div>
    )
}
