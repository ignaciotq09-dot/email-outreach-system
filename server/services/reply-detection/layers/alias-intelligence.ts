/**
 * Layer 6: Alias Intelligence Detection
 * Proactively searches for email pattern variations
 */

import type { DetectionResult } from "../types.js";
import { withRetry } from "../retry.js";
import { getContactAliases } from "../alias.js";
import { extractEmailFromString } from "../utils.js";

/**
 * Generate potential email aliases based on patterns
 */
function generatePotentialAliases(email: string): string[] {
  const aliases = new Set<string>();
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) return [];
  
  // Add original email
  aliases.add(email);
  
  // Remove plus addressing if present (user+tag becomes user)
  const baseName = localPart.split('+')[0];
  if (baseName !== localPart) {
    aliases.add(`${baseName}@${domain}`);
  }
  
  // Generate common plus addressing patterns
  const plusPatterns = ['work', 'personal', 'reply', 'auto', 'newsletter', 'list'];
  plusPatterns.forEach(pattern => {
    aliases.add(`${baseName}+${pattern}@${domain}`);
  });
  
  // Handle dots in Gmail addresses (Gmail ignores dots)
  if (domain.includes('gmail.com')) {
    const noDots = baseName.replace(/\./g, '');
    aliases.add(`${noDots}@${domain}`);
    
    // Add version with dots in different positions
    if (noDots.length > 4) {
      aliases.add(`${noDots.slice(0, 2)}.${noDots.slice(2)}@${domain}`);
      aliases.add(`${noDots.slice(0, -2)}.${noDots.slice(-2)}@${domain}`);
    }
  }
  
  // Common domain aliases
  const domainAliases: Record<string, string[]> = {
    'gmail.com': ['googlemail.com'],
    'googlemail.com': ['gmail.com'],
    'outlook.com': ['hotmail.com', 'live.com'],
    'hotmail.com': ['outlook.com', 'live.com'],
    'live.com': ['outlook.com', 'hotmail.com'],
    'yahoo.com': ['yahoo.co.uk', 'ymail.com', 'rocketmail.com'],
    'ymail.com': ['yahoo.com', 'yahoo.co.uk'],
  };
  
  const alternativeDomains = domainAliases[domain] || [];
  alternativeDomains.forEach(altDomain => {
    aliases.add(`${localPart}@${altDomain}`);
    aliases.add(`${baseName}@${altDomain}`);
  });
  
  // Corporate domain patterns (user@company.com -> user@mail.company.com)
  if (!domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('outlook')) {
    aliases.add(`${localPart}@mail.${domain}`);
    aliases.add(`${localPart}@email.${domain}`);
    aliases.add(`${localPart}@smtp.${domain}`);
    
    // Remove subdomains (user@mail.company.com -> user@company.com)
    const domainParts = domain.split('.');
    if (domainParts.length > 2) {
      const mainDomain = domainParts.slice(-2).join('.');
      aliases.add(`${localPart}@${mainDomain}`);
    }
  }
  
  return Array.from(aliases);
}

/**
 * Build Gmail search query for aliases
 */
function buildAliasSearchQuery(aliases: string[]): string {
  // Gmail search: from:(email1 OR email2 OR email3) in:inbox
  const fromClauses = aliases.map(email => `"${email}"`).join(' OR ');
  return `from:(${fromClauses}) in:inbox`;
}

/**
 * Alias Intelligence detection
 * Proactively searches for email pattern variations and known aliases
 */
export async function detectViaAliasIntelligence(
  gmail: any,
  sentEmailId: number,
  contactId: number,
  contactEmail: string,
  messageId: string,
  userEmail: string
): Promise<DetectionResult> {
  try {
    const replies = [];
    const queriesRun = [];
    let pagesChecked = 0;
    let messagesScanned = 0;
    
    // Get known aliases from database
    const knownAliases = await getContactAliases(contactId);
    
    // Generate potential aliases
    const potentialAliases = generatePotentialAliases(contactEmail);
    
    // Combine and deduplicate
    const allAliases = Array.from(new Set([
      ...knownAliases,
      ...potentialAliases
    ])).filter(alias => alias !== contactEmail); // Exclude the main email
    
    if (allAliases.length === 0) {
      return {
        found: false,
        replies: [],
        searchMetadata: {
          layer: "alias-intelligence",
          queriesRun: [],
          pagesChecked: 0,
          messagesScanned: 0,
          notes: "No aliases to search"
        }
      };
    }
    
    // Search in batches (Gmail has query length limits)
    const batchSize = 10;
    for (let i = 0; i < allAliases.length; i += batchSize) {
      const batch = allAliases.slice(i, i + batchSize);
      const searchQuery = buildAliasSearchQuery(batch);
      
      queriesRun.push(`Alias batch ${Math.floor(i / batchSize) + 1}: ${searchQuery}`);
      
      let pageToken: string | undefined;
      let batchPages = 0;
      
      do {
        batchPages++;
        pagesChecked++;
        
        const response = await withRetry(async () => {
          const result = await gmail.users.messages.list({
            userId: 'me',
            q: searchQuery,
            pageToken,
            maxResults: 50
          });
          return result;
        }, 3, 1000);
        
        if (response.data.messages) {
          messagesScanned += response.data.messages.length;
          
          // Check each message
          for (const msg of response.data.messages) {
            const fullMessage = await withRetry(async () => {
              const result = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['From', 'To', 'Subject', 'Date', 'In-Reply-To', 'References']
              });
              return result;
            }, 3, 1000);
            
            const headers = fullMessage.data.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name === 'From');
            const toHeader = headers.find((h: any) => h.name === 'To');
            const subjectHeader = headers.find((h: any) => h.name === 'Subject');
            const dateHeader = headers.find((h: any) => h.name === 'Date');
            
            if (fromHeader && toHeader) {
              const fromEmail = extractEmailFromString(fromHeader.value);
              const toEmail = extractEmailFromString(toHeader.value);
              
              // Check if this is a reply from an alias to us
              if (allAliases.includes(fromEmail) && toEmail === userEmail) {
                // Get full message content
                const fullContent = await withRetry(async () => {
                  const result = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id
                  });
                  return result;
                }, 3, 1000);
                
                let content = fullContent.data.snippet || '';
                
                // Extract text from parts if available
                if (fullContent.data.payload?.parts) {
                  for (const part of fullContent.data.payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                      content = Buffer.from(part.body.data, 'base64').toString('utf-8');
                      break;
                    }
                  }
                }
                
                replies.push({
                  gmailMessageId: msg.id,
                  gmailThreadId: msg.threadId,
                  subject: subjectHeader?.value || '',
                  content,
                  receivedAt: dateHeader?.value ? new Date(dateHeader.value) : new Date(),
                  detectedAlias: fromEmail
                });
              }
            }
          }
        }
        
        pageToken = response.data.nextPageToken;
      } while (pageToken && batchPages < 3); // Limit pages per batch
    }
    
    return {
      found: replies.length > 0,
      replies,
      searchMetadata: {
        layer: "alias-intelligence",
        queriesRun,
        pagesChecked,
        messagesScanned,
        notes: `Searched ${allAliases.length} aliases (${knownAliases.length} known, ${potentialAliases.length} generated)`
      }
    };
  } catch (error: any) {
    console.error('[AliasIntelligence] Error:', error);
    return {
      found: false,
      replies: [],
      searchMetadata: {
        layer: "alias-intelligence",
        queriesRun: [],
        pagesChecked: 0,
        messagesScanned: 0,
        notes: `Error: ${error.message}`
      }
    };
  }
}