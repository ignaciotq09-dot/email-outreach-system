import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Loader2 } from "lucide-react";
import ContactQueueChip from "./contact-queue-chip";
import EmailPreviewCard from "./email-preview-card";
import SendBulkModal from "./send-bulk-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export default function ComposeTab() {
  const { toast } = useToast();
  const [queuedContacts, setQueuedContacts] = useState<Contact[]>([]);
  const [writingStyle, setWritingStyle] = useState<"professional-adult" | "professional-humble">("professional-adult");
  const [baseMessage, setBaseMessage] = useState("");
  const [personalizedEmails, setPersonalizedEmails] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });

  const handleAddToQueue = async () => {
    if (!newContact.name || !newContact.email || !newContact.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, email, and company fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const contact = await apiRequest<Contact>("POST", "/api/contacts/add", newContact);
      setQueuedContacts(prev => [...prev, contact]);
      setNewContact({ name: "", email: "", company: "", phone: "", notes: "" });
      
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added to the queue.`,
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact to queue.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = (id: number) => {
    setQueuedContacts(prev => prev.filter((c) => c.id !== id));
  };

  const handleGeneratePersonalized = async () => {
    if (!baseMessage) {
      toast({
        title: "Missing Message",
        description: "Please enter a base message.",
        variant: "destructive",
      });
      return;
    }

    if (queuedContacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "Add contacts to queue first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const emails = await apiRequest<any[]>("POST", "/api/emails/generate", {
        contactIds: queuedContacts.map(c => c.id),
        baseMessage,
        writingStyle,
      });
      
      setPersonalizedEmails(emails.map(e => ({ ...e, writingStyle })));
      
      toast({
        title: "Emails Generated",
        description: `${emails.length} personalized emails generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating emails:", error);
      toast({
        title: "Error",
        description: "Failed to generate personalized emails.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left side - 45% width */}
      <div className="w-[45%] border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-base font-semibold mb-4">Add Contacts to Queue</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="John Smith"
                className="mt-1"
                data-testid="input-contact-name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@company.com"
                className="mt-1"
                data-testid="input-contact-email"
              />
            </div>
            <div>
              <Label htmlFor="company" className="text-sm">Company</Label>
              <Input
                id="company"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                placeholder="ABC Corp"
                className="mt-1"
                data-testid="input-contact-company"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="555-0123"
                className="mt-1"
                data-testid="input-contact-phone"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm">Notes about this person</Label>
              <Textarea
                id="notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Add any relevant information..."
                className="mt-1 resize-none h-20"
                data-testid="input-contact-notes"
              />
            </div>
            <Button 
              onClick={handleAddToQueue}
              className="w-full"
              data-testid="button-add-to-queue"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Queue
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Queued Contacts ({queuedContacts.length})
          </h3>
          <div className="space-y-2">
            {queuedContacts.map((contact) => (
              <ContactQueueChip
                key={contact.id}
                contact={contact}
                onRemove={() => handleRemoveFromQueue(contact.id)}
              />
            ))}
            {queuedContacts.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No contacts in queue. Add contacts above.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - 55% width */}
      <div className="w-[55%] flex flex-col">
        <div className="p-6 border-b border-border space-y-4">
          <h2 className="text-base font-semibold">Compose Message</h2>
          
          <div>
            <Label className="text-sm mb-3 block">Writing Style</Label>
            <RadioGroup value={writingStyle} onValueChange={(v: any) => setWritingStyle(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional-adult" id="style-adult" data-testid="radio-style-adult" />
                <Label htmlFor="style-adult" className="font-normal text-sm cursor-pointer">
                  Professional & Adult-like
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional-humble" id="style-humble" data-testid="radio-style-humble" />
                <Label htmlFor="style-humble" className="font-normal text-sm cursor-pointer">
                  Professional & Humble (Learning-oriented)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="base-message" className="text-sm">Base Message</Label>
            <Textarea
              id="base-message"
              value={baseMessage}
              onChange={(e) => setBaseMessage(e.target.value)}
              placeholder="Enter your base message here. It will be personalized for each contact..."
              className="mt-1 resize-none min-h-[200px]"
              data-testid="textarea-base-message"
            />
          </div>

          <Button 
            onClick={handleGeneratePersonalized}
            disabled={!baseMessage || queuedContacts.length === 0 || isGenerating}
            className="w-full"
            data-testid="button-generate-personalized"
          >
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate Personalized
          </Button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Preview Personalized Emails
            </h3>
            {personalizedEmails.length > 0 && (
              <Button 
                onClick={() => setShowSendModal(true)}
                size="lg"
                data-testid="button-send-all"
              >
                Send All Emails
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {personalizedEmails.map((email) => (
              <EmailPreviewCard
                key={email.contactId}
                email={email}
                onEdit={(updatedEmail) => {
                  setPersonalizedEmails(
                    personalizedEmails.map(e => 
                      e.contactId === email.contactId ? updatedEmail : e
                    )
                  );
                }}
              />
            ))}
            {personalizedEmails.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-12">
                Generate personalized emails to preview them here
              </p>
            )}
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendBulkModal
          emails={personalizedEmails}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            setPersonalizedEmails([]);
            setQueuedContacts([]);
            setBaseMessage("");
          }}
        />
      )}
    </div>
  );
}
