// Type definitions for AddContacts component

export interface AddContactsProps {
    isDarkMode: boolean;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    title: string;
}
