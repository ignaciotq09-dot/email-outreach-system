import type { Contact } from "@shared/schema";

export function personalizeVariation(text: string, contact: Contact): string {
  const firstName = contact.name?.split(' ')[0] || 'there'; return text.replace(/\{firstName\}/gi, firstName).replace(/\{name\}/gi, contact.name || 'there').replace(/\{company\}/gi, contact.company || 'your company').replace(/\{position\}/gi, contact.position || 'your role').replace(/\{industry\}/gi, contact.industry || 'your industry');
}
