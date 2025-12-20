import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Check } from "lucide-react";

interface EmailPreviewCardProps {
  email: {
    contactId: number;
    contact: any;
    subject: string;
    body: string;
  };
  onEdit: (updatedEmail: any) => void;
}

export default function EmailPreviewCard({ email, onEdit }: EmailPreviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(email.subject);
  const [editedBody, setEditedBody] = useState(email.body);

  const handleSave = () => {
    onEdit({
      ...email,
      subject: editedSubject,
      body: editedBody,
    });
    setIsEditing(false);
  };

  return (
    <Card className="bg-muted/50" data-testid={`card-email-preview-${email.contactId}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              To: {email.contact.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {email.contact.email}
            </p>
          </div>
          {!isEditing ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-email-${email.contactId}`}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              data-testid={`button-save-email-${email.contactId}`}
            >
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`subject-${email.contactId}`} className="text-xs">
                Subject
              </Label>
              <Input
                id={`subject-${email.contactId}`}
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="mt-1"
                data-testid={`input-edit-subject-${email.contactId}`}
              />
            </div>
            <div>
              <Label htmlFor={`body-${email.contactId}`} className="text-xs">
                Body
              </Label>
              <Textarea
                id={`body-${email.contactId}`}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="mt-1 resize-none min-h-[120px]"
                data-testid={`textarea-edit-body-${email.contactId}`}
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="text-sm font-medium" data-testid={`text-subject-${email.contactId}`}>
                {email.subject}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Body:</p>
              <p className="text-sm whitespace-pre-wrap" data-testid={`text-body-${email.contactId}`}>
                {email.body}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
