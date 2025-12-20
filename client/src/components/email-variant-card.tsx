import { useState, useEffect, memo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle } from "lucide-react";

interface EmailVariant {
  subject: string;
  body: string;
  approach: string;
}

interface EmailVariantCardProps {
  variant: EmailVariant;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: EmailVariant) => void;
}

function EmailVariantCard({ 
  variant, 
  index, 
  isSelected, 
  onSelect,
  onChange 
}: EmailVariantCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(variant.subject);
  const [editedBody, setEditedBody] = useState(variant.body);

  // Sync local edit state with variant prop when it changes
  useEffect(() => {
    setEditedSubject(variant.subject);
    setEditedBody(variant.body);
  }, [variant.subject, variant.body]);

  const handleSave = () => {
    const updatedVariant = {
      ...variant,
      subject: editedSubject,
      body: editedBody,
    };
    onChange(updatedVariant);
    setIsEditing(false);
  };

  return (
    <Card 
      className={`${isSelected ? 'border-primary border-2' : ''} hover-elevate transition-all`}
      data-testid={`variant-card-${index}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{variant.approach}</h3>
          <p className="text-xs text-muted-foreground">Variant {index + 1}</p>
        </div>
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          data-testid={`button-select-variant-${index}`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Selected
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 mr-2" />
              Select
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <>
            <div>
              <Label className="text-xs">Subject</Label>
              <Input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="mt-1"
                data-testid={`input-edit-subject-${index}`}
              />
            </div>
            <div>
              <Label className="text-xs">Body</Label>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="mt-1 resize-none h-32"
                data-testid={`textarea-edit-body-${index}`}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} data-testid={`button-save-edit-${index}`}>
                Save Changes
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setEditedSubject(variant.subject);
                  setEditedBody(variant.body);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="text-sm font-medium">{variant.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Body:</p>
              <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                {variant.body}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-variant-${index}`}
            >
              Edit This Variant
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Use default shallow comparison - parent should use useCallback for onSelect/onChange
export default memo(EmailVariantCard);
