// Type definitions for ComposeAndSend component

export interface Channel {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    enabled: boolean;
}

// Email variant interface matching API response
export interface EmailVariant {
    subject: string;
    body: string;
    approach: string;
}
