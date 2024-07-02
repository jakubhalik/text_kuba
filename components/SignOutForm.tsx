'use client';

interface SignOutFormProps {
    action: () => Promise<void>;
}

export default function SignOutForm({ action }: SignOutFormProps) {
    return (
        <form
            method="post"
            onSubmit={async (e) => {
                e.preventDefault();
                await action();
                window.location.href = '/';
            }}
        >
            <button type="submit" className="text-white">
                Sign Out
            </button>
        </form>
    );
}
