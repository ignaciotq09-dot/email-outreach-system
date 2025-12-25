// Constants for ComposeAndSend component

import { Mail, MessageSquare } from 'lucide-react';
import type { Channel } from './types';

export const CHANNELS: Channel[] = [
    { id: 'email', name: 'Email', icon: Mail, enabled: true },
    { id: 'sms', name: 'SMS', icon: MessageSquare, enabled: false },
];
