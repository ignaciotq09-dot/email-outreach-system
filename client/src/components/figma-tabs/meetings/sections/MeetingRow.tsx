// Meeting Row Component for Meetings List

import { Video, Edit, XCircle } from 'lucide-react';
import type { Meeting } from '../types';
import { getPlatformConfig, getStatusConfig } from '../helpers';

interface MeetingRowProps {
    meeting: Meeting;
    isDarkMode: boolean;
    onCancel: (id: string) => void;
}

export function MeetingRow({ meeting, isDarkMode, onCancel }: MeetingRowProps) {
    const platformConfig = getPlatformConfig(meeting.platform, isDarkMode);
    const statusConfig = getStatusConfig(meeting.status, isDarkMode);
    const PlatformIcon = platformConfig.icon;

    return (
        <div
            className={`px-5 py-4 transition-all ${isDarkMode
                ? 'hover:bg-white/5 border-white/5'
                : 'hover:bg-purple-50/50 border-gray-100'
                } ${meeting.status === 'upcoming' ? 'bg-purple-500/5' : ''}`}
        >
            <div className="flex items-start gap-4">
                {/* Calendar Icon */}
                <div className={`p-2.5 rounded-lg mt-1 ${platformConfig.bgColor}`}>
                    <PlatformIcon className={`w-5 h-5 ${platformConfig.color}`} />
                </div>

                {/* Meeting Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {meeting.title}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {meeting.attendeeName}
                                </span>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {meeting.company}
                                </span>
                            </div>
                            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                {meeting.email}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Date & Time */}
                            <div className={`text-right`}>
                                <p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {meeting.date}
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {meeting.time} • {meeting.duration}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm whitespace-nowrap ${statusConfig.bgColor
                                } ${statusConfig.borderColor} ${statusConfig.color}`}>
                                <span>{statusConfig.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform & Notes */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${platformConfig.bgColor
                            } ${platformConfig.borderColor} ${platformConfig.color}`}>
                            <PlatformIcon className="w-3.5 h-3.5" />
                            <span>{platformConfig.label}</span>
                        </div>

                        {meeting.notes && (
                            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                Note: {meeting.notes}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {meeting.status === 'upcoming' && meeting.meetingLink && (
                            <button
                                onClick={() => window.open(meeting.meetingLink, '_blank')}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                    }`}>
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Meeting</span>
                            </button>
                        )}

                        {meeting.status === 'upcoming' && (
                            <>
                                <button className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                                    ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Reschedule</span>
                                </button>

                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to cancel this meeting?')) {
                                            onCancel(meeting.id);
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                        }`}>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Cancel</span>
                                </button>
                            </>
                        )}

                        {meeting.status === 'completed' && (
                            <button className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                                ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                }`}>
                                <Edit className="w-3.5 h-3.5" />
                                <span>Add Notes</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
