// Service to build optimization context from various data sources
import { storage } from '../storage';
import { OptimizationContext, EmailIntent } from '../ai/optimization-orchestrator';
import type { Contact } from '@shared/schema';

export class OptimizationContextBuilder {
  // Build context for general variant generation (no specific contacts)
  public async buildBaseContext(
    baseMessage: string,
    campaignId?: number,
    userId?: number
  ): Promise<OptimizationContext> {
    const context: OptimizationContext = {
      // Intent will be auto-detected from message if not provided
      previousEngagement: false,
      personalizationSignals: [],
    };

    // If we have a campaign, extract industry/company targets
    if (campaignId) {
      try {
        // TODO: Add getCampaignById to storage when campaigns are available
        // const campaign = await storage.getCampaignById(campaignId);
        // if (campaign) {
        //   context.industry = this.extractIndustryFromCampaign(campaign);
        //   context.companySize = this.extractCompanySizeFromCampaign(campaign);
        // }
      } catch (error) {
        console.error('[OptimizationContextBuilder] Error loading campaign:', error);
      }
    }

    // Add user preferences if available
    if (userId) {
      try {
        const preferences = await storage.getEmailPreferences('default');
        if (preferences) {
          // Can extract tone preferences, style notes for optimization
          context.personalizationSignals?.push('user_preferences');
        }
      } catch (error) {
        console.error('[OptimizationContextBuilder] Error loading preferences:', error);
      }
    }

    return context;
  }

  // Build context for specific contact(s)
  public async buildContactContext(
    baseMessage: string,
    contact: Contact,
    campaignId?: number
  ): Promise<OptimizationContext> {
    // Start with base context
    const context = await this.buildBaseContext(baseMessage, campaignId);

    // Add contact-specific enrichment
    if (contact.company) {
      context.companySize = this.detectCompanySize(contact.company);
      context.industry = this.detectIndustry(contact.company, contact.notes);
    }

    // Detect seniority from position
    if (contact.position) {
      context.seniorityLevel = this.detectSeniorityLevel(contact.position);
    }

    // Check for previous engagement
    try {
      const sentEmails = await storage.getSentEmails(100, 0);
      const previousEmails = sentEmails.filter(e => e.contactId === contact.id);
      if (previousEmails && previousEmails.length > 0) {
        context.previousEngagement = true;
        
        // Check if any were replied to
        const repliedEmails = previousEmails.filter((email: any) => email.repliedAt);
        if (repliedEmails.length > 0) {
          context.personalizationSignals?.push('previous_reply');
        }
      }
    } catch (error) {
      console.error('[OptimizationContextBuilder] Error checking engagement:', error);
    }

    // Add personalization signals from contact data
    if (contact.notes) {
      context.personalizationSignals?.push('contact_notes');
      
      // Extract specific signals from notes
      if (contact.notes.toLowerCase().includes('linkedin')) {
        context.personalizationSignals?.push('linkedin_activity');
      }
      if (contact.notes.toLowerCase().includes('met at') || contact.notes.toLowerCase().includes('conference')) {
        context.personalizationSignals?.push('in_person_meeting');
      }
    }

    // Detect geography from location or email domain
    if (contact.location) {
      context.geography = this.detectGeography(contact.location);
    }

    return context;
  }

  // Build context for bulk send with multiple contacts
  public async buildBulkContext(
    baseMessage: string,
    contacts: Contact[],
    campaignId?: number
  ): Promise<OptimizationContext> {
    const context = await this.buildBaseContext(baseMessage, campaignId);

    // Aggregate common characteristics from contacts
    const industries = new Map<string, number>();
    const companySizes = new Map<string, number>();
    const seniorityLevels = new Map<string, number>();

    for (const contact of contacts) {
      if (contact.company) {
        const industry = this.detectIndustry(contact.company, contact.notes);
        if (industry) {
          industries.set(industry, (industries.get(industry) || 0) + 1);
        }

        const size = this.detectCompanySize(contact.company);
        if (size) {
          companySizes.set(size, (companySizes.get(size) || 0) + 1);
        }
      }

      if (contact.position) {
        const seniority = this.detectSeniorityLevel(contact.position);
        if (seniority) {
          seniorityLevels.set(seniority, (seniorityLevels.get(seniority) || 0) + 1);
        }
      }
    }

    // Use most common characteristics
    if (industries.size > 0) {
      context.industry = this.getMostCommon(industries);
    }
    if (companySizes.size > 0) {
      context.companySize = this.getMostCommon(companySizes);
    }
    if (seniorityLevels.size > 0) {
      context.seniorityLevel = this.getMostCommon(seniorityLevels);
    }

    return context;
  }

  // Helper methods for detection
  private detectSeniorityLevel(title: string): string | undefined {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('ceo') || lowerTitle.includes('cto') || lowerTitle.includes('cfo') || 
        lowerTitle.includes('chief') || lowerTitle.includes('president')) {
      return 'cSuite';
    } else if (lowerTitle.includes('vp') || lowerTitle.includes('vice president') || 
               lowerTitle.includes('director') || lowerTitle.includes('head of')) {
      return 'vpDirector';
    } else if (lowerTitle.includes('manager') || lowerTitle.includes('lead') || 
               lowerTitle.includes('supervisor')) {
      return 'manager';
    } else if (lowerTitle.includes('senior') || lowerTitle.includes('principal')) {
      return 'senior';
    }
    
    return 'individualContributor';
  }

  private detectCompanySize(company: string): string | undefined {
    const lowerCompany = company.toLowerCase();
    
    // Look for size indicators in company name
    if (lowerCompany.includes('startup') || lowerCompany.includes('labs') || 
        lowerCompany.includes('ventures')) {
      return 'startup';
    } else if (lowerCompany.includes('inc') || lowerCompany.includes('corp') || 
               lowerCompany.includes('enterprise')) {
      return 'enterprise';
    }
    
    // Default based on common patterns
    if (lowerCompany.length < 10) {
      return 'startup'; // Short names often startups
    }
    
    return 'midMarket';
  }

  private detectIndustry(company: string, notes?: string | null): string | undefined {
    const text = `${company} ${notes || ''}`.toLowerCase();
    
    if (text.includes('software') || text.includes('saas') || text.includes('tech')) {
      return 'saas';
    } else if (text.includes('bank') || text.includes('finance') || text.includes('capital')) {
      return 'finance';
    } else if (text.includes('health') || text.includes('medical') || text.includes('clinic')) {
      return 'healthcare';
    } else if (text.includes('retail') || text.includes('store') || text.includes('shop')) {
      return 'retail';
    } else if (text.includes('commerce') || text.includes('marketplace')) {
      return 'ecommerce';
    } else if (text.includes('education') || text.includes('university') || text.includes('school')) {
      return 'education';
    } else if (text.includes('manufacturing') || text.includes('factory') || text.includes('industrial')) {
      return 'manufacturing';
    }
    
    return undefined;
  }

  private detectGeography(location: string): string | undefined {
    const lowerLocation = location.toLowerCase();
    
    if (lowerLocation.includes('usa') || lowerLocation.includes('united states') || 
        lowerLocation.includes('america') || lowerLocation.includes('ny') || 
        lowerLocation.includes('ca') || lowerLocation.includes('tx')) {
      return 'northAmerica';
    } else if (lowerLocation.includes('uk') || lowerLocation.includes('united kingdom') || 
               lowerLocation.includes('london')) {
      return 'uk';
    } else if (lowerLocation.includes('germany') || lowerLocation.includes('deutschland') || 
               lowerLocation.includes('berlin')) {
      return 'germany';
    } else if (lowerLocation.includes('france') || lowerLocation.includes('paris')) {
      return 'france';
    } else if (lowerLocation.includes('japan') || lowerLocation.includes('tokyo')) {
      return 'japan';
    }
    
    return undefined;
  }

  private extractIndustryFromCampaign(campaign: any): string | undefined {
    // Extract from campaign metadata if available
    if (campaign.metadata?.industry) {
      return campaign.metadata.industry;
    }
    return undefined;
  }

  private extractCompanySizeFromCampaign(campaign: any): string | undefined {
    // Extract from campaign metadata if available
    if (campaign.metadata?.companySize) {
      return campaign.metadata.companySize;
    }
    return undefined;
  }

  private getMostCommon<T>(map: Map<T, number>): T | undefined {
    let maxCount = 0;
    let mostCommon: T | undefined;
    
    const entries = Array.from(map.entries());
    for (const [key, count] of entries) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = key;
      }
    }
    
    return mostCommon;
  }
}

// Export singleton instance
export const optimizationContextBuilder = new OptimizationContextBuilder();