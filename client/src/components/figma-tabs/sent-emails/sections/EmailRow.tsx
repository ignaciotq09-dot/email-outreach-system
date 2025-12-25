// Email Row Component for Sent Emails List

import { ChevronDown } from 'lucide-react';
import type { SentEmail } from '../types';
import { getStatusConfig } from '../helpers';

interface EmailRowProps {
    email: SentEmail;
    isDarkMode: boolean;
}

export function EmailRow({ email, isDarkMode }: EmailRowProps) {
    const statusConfig = getStatusConfig(email.status, isDarkMode);
    const StatusIcon = statusConfig.icon;

    return (
        <div
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center text-base transition-all ${isDarkMode
                ? 'hover:bg-white/5 border-white/5'
                : 'hover:bg-purple-50/50 border-gray-100'
                }`}
        >
            {/* Recipient */}
            <div className={`col-span-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {email.recipientName}
            </div>

            {/* Company */}
            <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {email.company}
            </div>

            {/* Email */}
            <div className={`col-span-3 text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {email.email}
            </div>

            {/* Date */}
            <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {email.date}
            </div>

            {/* Status */}
            <div className="col-span-2">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${statusConfig.bgColor
                    } ${statusConfig.borderColor} ${statusConfig.textColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig.label}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 text-right">
                <button className={`p-1.5 rounded hover:bg-white/10 transition-all ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                    }`}>
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
