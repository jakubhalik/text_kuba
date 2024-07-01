import SwitcherToLoginOrSignUp from '@/components/SwitcherToLoginOrSignUp';
import Login from '@/components/Login';
import { SignUp } from '@/components/SignUp';
import GlobalStates from '@/components/GlobalStates';
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
    return (
        <GlobalStates>
            <header className="flex px-6 sm:px-8 py-4 border-b">
                <nav className="flex gap-4 md:gap-8 ml-auto">
                    <ModeToggle />
                </nav>
            </header>
            <SwitcherToLoginOrSignUp signUp={<SignUp />} login={<Login />} />
        </GlobalStates>
    );
}
