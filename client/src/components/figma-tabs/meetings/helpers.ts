// Helper functions for Meetings component

import { Video, Phone, MapPin } from 'lucide-react';
import type { PlatformConfig, StatusConfig } from './types';

export function getPlatformConfig(platform: string, isDarkMode: boolean): PlatformConfig {
    switch (platform) {
        case 'zoom':
            return {
                label: 'Zoom',
                icon: Video,
                color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
                bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
                borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
            };
        case 'google-meet':
            return {
                label: 'Google Meet',
                icon: Video,
                color: isDarkMode ? 'text-green-400' : 'text-green-600',
                bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
                borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
            };
        case 'teams':
            return {
                label: 'Teams',
                icon: Video,
                color: isDarkMode ? 'text-purple-400' : 'text-purple-600',
                bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100',
                borderColor: isDarkMode ? 'border-purple-500/30' : 'border-purple-300'
            };
        case 'phone':
            return {
                label: 'Phone Call',
                icon: Phone,
                color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
                bgColor: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100',
                borderColor: isDarkMode ? 'border-amber-500/30' : 'border-amber-300'
            };
        default:
            return {
                label: 'In Person',
                icon: MapPin,
                color: isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
                bgColor: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100',
                borderColor: isDarkMode ? 'border-indigo-500/30' : 'border-indigo-300'
            };
    }
}

export function getStatusConfig(status: string, isDarkMode: boolean): StatusConfig {
    switch (status) {
        case 'completed':
            return {
                label: 'Completed',
                color: isDarkMode ? 'text-green-400' : 'text-green-600',
                bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
                borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                color: isDarkMode ? 'text-red-400' : 'text-red-600',
                bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-100',
                borderColor: isDarkMode ? 'border-red-500/30' : 'border-red-300'
            };
        default:
            return {
                label: 'Upcoming',
                color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
                bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
                borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
            };
    }
}

export function calculateStats(meetings: { status: string }[]) {
    return {
        total: meetings.length,
        upcoming: meetings.filter(m => m.status === 'upcoming').length,
        completed: meetings.filter(m => m.status === 'completed').length,
        cancelled: meetings.filter(m => m.status === 'cancelled').length,
    };
}
