import type { EmailStatus } from "./types";

export function isDomain(value: string): boolean { const domainPattern = /\.(com|io|org|net|co|ai|app|dev|tech|cloud|xyz|biz|info|me|co\.[a-z]{2}|[a-z]{2})$/i; return domainPattern.test(value.trim().toLowerCase()); }

/**
 * Maps Apollo's email status to our simplified two-tier system.
 * Apollo returns: verified, guessed, accept_all, unavailable, invalid, no_email, email_bounced, unverified
 * We only consider "verified" as verified - everything else is unverified.
 */
export function mapEmailStatus(apolloEmailStatus: string | null | undefined): EmailStatus {
  if (!apolloEmailStatus) return "unverified";
  const normalized = apolloEmailStatus.toLowerCase().trim();
  // Only "verified" from Apollo is considered verified
  // All other statuses (guessed, accept_all, unavailable, invalid, no_email, email_bounced) are unverified
  return normalized === "verified" ? "verified" : "unverified";
}

export function normalizeDomain(value: string): string { let domain = value.trim().toLowerCase(); domain = domain.replace(/^https?:\/\//, ''); domain = domain.replace(/^www\./, ''); domain = domain.split('/')[0]; return domain; }

export function extractPhoneFromPerson(person: any): string | null {
  if (person.sanitized_phone) return person.sanitized_phone;
  if (person.mobile_phone) return person.mobile_phone;
  if (person.phone_numbers && person.phone_numbers.length > 0) {
    const mobilePhone = person.phone_numbers.find((p: any) => p.type === 'mobile');
    const directPhone = person.phone_numbers.find((p: any) => p.type === 'work_direct');
    const anyPhone = person.phone_numbers[0];
    const phoneObj = mobilePhone || directPhone || anyPhone;
    return phoneObj?.sanitized_number || phoneObj?.raw_number || null;
  }
  return null;
}

export function mapPersonToLead(person: any, fallbacks?: { firstName?: string; lastName?: string; linkedinUrl?: string }): { id: string; firstName: string; lastName: string; name: string; email: string | null; phone: string | null; title: string | null; company: string | null; location: string | null; industry: string | null; companySize: string | null; linkedinUrl: string | null; photoUrl: string | null; emailStatus: EmailStatus } {
  const phone = extractPhoneFromPerson(person);
  const emailStatus = mapEmailStatus(person.email_status);
  return { id: person.id, firstName: person.first_name || fallbacks?.firstName || '', lastName: person.last_name || fallbacks?.lastName || '', name: [person.first_name, person.last_name].filter(Boolean).join(' ') || [fallbacks?.firstName, fallbacks?.lastName].filter(Boolean).join(' ') || 'Unknown', email: person.email || null, phone, title: person.title || null, company: person.organization?.name || null, location: [person.city, person.state, person.country].filter(Boolean).join(', ') || null, industry: person.organization?.industry || null, companySize: person.organization?.estimated_num_employees ? `${person.organization.estimated_num_employees} employees` : null, linkedinUrl: person.linkedin_url || fallbacks?.linkedinUrl || null, photoUrl: person.photo_url || null, emailStatus };
}
