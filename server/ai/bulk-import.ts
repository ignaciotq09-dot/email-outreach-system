import { callOpenAIWithTimeout } from "./openai-client";

// Parse bulk contact text and extract individual contacts
export interface ParsedContact {
  name: string;
  email: string;
  company?: string;
  position?: string;
  phone?: string;
}

export async function parseBulkContacts(bulkText: string): Promise<ParsedContact[]> {
  const prompt = `You are parsing bulk contact information. The user has pasted text that may contain one or more contacts. Extract each contact's information.

Bulk Text:
"""
${bulkText}
"""

Extract all contacts from this text. Look for patterns like:
- Names (first and last)
- Email addresses
- Company names
- Job titles/positions
- Phone numbers

For each contact you find, extract:
- name: Full name (required)
- email: Email address (required - if not found, skip this contact)
- company: Company name (optional)
- position: Job title/role (optional)
- phone: Phone number (optional)

🚨 RULES:
1. **EMAIL IS REQUIRED**: Only include contacts that have an email address. Skip any contact without an email.
2. **BE FLEXIBLE**: The text format may vary - it could be a list, a paragraph, LinkedIn profiles, business cards, etc.
3. **EXTRACT ACCURATELY**: Don't make up information. Only extract what's clearly stated.
4. **HANDLE MULTIPLE FORMATS**: Could be CSV, table format, plain text, or mixed formats
5. **CLEAN DATA**: Remove any extra spaces, formatting characters, or duplicates

Examples of text you might see:
- "John Doe, john@company.com, CEO at TechCorp, 555-1234"
- "Jane Smith | jane.smith@example.org | Marketing Director | Acme Inc"
- LinkedIn-style: "Bob Johnson - Software Engineer @ StartupXYZ | bob.j@startupxyz.com"
- Multiple contacts in a list or paragraph

Return JSON array of contacts:
{
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@company.com",
      "company": "TechCorp",
      "position": "CEO",
      "phone": "555-1234"
    }
  ]
}

If you can't find ANY valid contacts with emails, return an empty array: { "contacts": [] }`;

  try {
    console.log('[parseBulkContacts] Parsing bulk text, length:', bulkText.length);
    
    const content = await callOpenAIWithTimeout(
      [
        {
          role: "system",
          content: "You are an expert at parsing and extracting contact information from various text formats. You're accurate, flexible, and only extract information that's clearly present."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        responseFormat: { type: "json_object" },
        maxTokens: 4096,
      }
    );

    const result = JSON.parse(content);
    const contacts = result.contacts || [];
    
    // Validate each contact has at minimum name and email
    const validContacts = contacts.filter((c: any) => c.name && c.email);
    
    console.log(`[parseBulkContacts] Successfully parsed ${validContacts.length} contacts from bulk text`);
    
    return validContacts;
  } catch (error: any) {
    console.error('[parseBulkContacts] Error:', error.message);
    throw new Error(`Failed to parse bulk contacts: ${error.message}`);
  }
}
