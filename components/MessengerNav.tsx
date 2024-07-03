import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { FileEditIcon } from 'lucide-react';
import { MoreHorizontalIcon } from 'lucide-react';

export default async function MessengerNav() {
    return (
        <div className="border-r flex flex-col w-full md:max-w-[300px]">
            <div className="border-b flex items-center p-4 space-x-4">
                <div className="flex items-center space-x-2">
                    <FileEditIcon className="w-6 h-6 text-gray-500 rounded-lg hover:text-gray-900 dark:hover:text-gray-100" />
                    <MoreHorizontalIcon className="w-6 h-6 text-gray-500 rounded-lg hover:text-gray-900 dark:hover:text-gray-100" />
                </div>
                <Button className="ml-auto" variant="ghost" size="icon">
                    <FileEditIcon className="w-6 h-6" />
                    <span className="sr-only">New chat</span>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <ul className="divide-y">
                    {other_user_names &&
                        messages_table_selected_latest_from_each.map(
                            <li className="bg-gray-100 p-4 dark:bg-gray-900">
                                <Link
                                    className="flex items-center gap-4 p-4 rounded-lg -m-4"
                                    href="#"
                                >
                                    <Image
                                        alt="Avatar"
                                        className="rounded-full"
                                        height="40"
                                        src="/placeholder.svg"
                                        style={{
                                            aspectRatio: '40/40',
                                            objectFit: 'cover',
                                        }}
                                        width="40"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                            {other_user_name && other_user_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {other_user_latest_message &&
                                                other_user_latest_message}
                                        </p>
                                    </div>
                                    <span className="text-sm">
                                        {other_user_time_of_sending_you_latest_message &&
                                            other_user_time_of_sending_you_latest_message}
                                    </span>
                                </Link>
                            </li>
                        )}
                </ul>
            </div>
        </div>
    );
}
