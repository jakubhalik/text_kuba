'use client';

import { useEffect, useState } from 'react';

interface SelectedUserHeadingProps {
    initialSelectedUser: string;
    onUserChange: (newSelectedUser: string) => Promise<void>;
}

export default function SelectedUserHeading({
    initialSelectedUser,
    onUserChange,
}: SelectedUserHeadingProps) {
    const [currentSelectedUser, setCurrentSelectedUser] =
        useState<string>(initialSelectedUser);

    useEffect(() => {
        setCurrentSelectedUser(initialSelectedUser);
    }, [initialSelectedUser]);

    useEffect(() => {
        async function updateUser() {
            await onUserChange(currentSelectedUser);
            console.log(
                'selected user got updated from the useEffect in the SelectedUserHeading component'
            );
        }
        updateUser();
    }, [currentSelectedUser, onUserChange]);

    return <h2 className="font-semibold">{currentSelectedUser}</h2>;
}
