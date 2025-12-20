import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import type { NewContactForm } from "./types";

interface ContactFormProps {
  contact: NewContactForm;
  onChange: (contact: NewContactForm) => void;
  onSubmit: () => void;
}

export default function ContactForm({ contact, onChange, onSubmit }: ContactFormProps) {
  return (
    <div className="p-6 border border-border rounded-lg bg-muted/20">
      <h3 className="text-base font-semibold mb-4">Add New Contact</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm">Name *</Label>
          <Input
            id="name"
            value={contact.name}
            onChange={(e) => onChange({ ...contact, name: e.target.value })}
            placeholder="John Smith"
            className="mt-1"
            data-testid="input-contact-name"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm">Email *</Label>
          <Input
            id="email"
            type="email"
            value={contact.email}
            onChange={(e) => onChange({ ...contact, email: e.target.value })}
            placeholder="john@company.com"
            className="mt-1"
            data-testid="input-contact-email"
          />
        </div>
        <div>
          <Label htmlFor="company" className="text-sm">Company *</Label>
          <Input
            id="company"
            value={contact.company}
            onChange={(e) => onChange({ ...contact, company: e.target.value })}
            placeholder="ABC Corp"
            className="mt-1"
            data-testid="input-contact-company"
          />
        </div>
        <div>
          <Label htmlFor="position" className="text-sm">Position</Label>
          <Input
            id="position"
            value={contact.position}
            onChange={(e) => onChange({ ...contact, position: e.target.value })}
            placeholder="CEO, Marketing Director, etc."
            className="mt-1"
            data-testid="input-contact-position"
          />
        </div>
        <div>
          <Label className="text-sm">Title</Label>
          <RadioGroup 
            value={contact.pronoun} 
            onValueChange={(value) => onChange({ ...contact, pronoun: value })}
            className="flex gap-4 mt-2"
            data-testid="radio-pronoun"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Mr." id="pronoun-mr" data-testid="radio-pronoun-mr" />
              <Label htmlFor="pronoun-mr" className="font-normal cursor-pointer">Mr.</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Ms." id="pronoun-ms" data-testid="radio-pronoun-ms" />
              <Label htmlFor="pronoun-ms" className="font-normal cursor-pointer">Ms.</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm">Phone</Label>
          <Input
            id="phone"
            value={contact.phone}
            onChange={(e) => onChange({ ...contact, phone: e.target.value })}
            placeholder="555-0123"
            className="mt-1"
            data-testid="input-contact-phone"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes" className="text-sm">Notes</Label>
          <Textarea
            id="notes"
            value={contact.notes}
            onChange={(e) => onChange({ ...contact, notes: e.target.value })}
            placeholder="Add any relevant information..."
            className="mt-1 resize-none h-20"
            data-testid="textarea-contact-notes"
          />
        </div>
      </div>
      
      <Button 
        onClick={onSubmit}
        className="w-full mt-4"
        data-testid="button-add-to-queue"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add to Recipients
      </Button>
    </div>
  );
}
