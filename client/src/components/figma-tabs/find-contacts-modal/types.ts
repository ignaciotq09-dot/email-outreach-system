// Type definitions for FindContactsModal component

export interface FindContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

export interface SearchResult {
    id: string;
    name: string;
    title: string;
    company: string;
    selected: boolean;
}
