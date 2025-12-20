import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import EmailVariantCard from "../email-variant-card";
import type { EmailVariant } from "./types";

interface EmailVariantsProps {
  variants: EmailVariant[];
  selectedVariantIndex: number | null;
  feedback: string;
  isRegenerating: boolean;
  onSelectVariant: (index: number) => void;
  onVariantChange: (index: number, updated: EmailVariant) => void;
  onFeedbackChange: (feedback: string) => void;
  onRegenerate: () => void;
}

export default function EmailVariants({
  variants,
  selectedVariantIndex,
  feedback,
  isRegenerating,
  onSelectVariant,
  onVariantChange,
  onFeedbackChange,
  onRegenerate,
}: EmailVariantsProps) {
  if (variants.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Step 2: Choose Your Favorite Email Variant
      </h2>
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <EmailVariantCard
            key={index}
            variant={variant}
            index={index}
            isSelected={selectedVariantIndex === index}
            onSelect={() => onSelectVariant(index)}
            onChange={(updated) => onVariantChange(index, updated)}
          />
        ))}
      </div>

      <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
        <Label className="text-sm font-medium">Not happy with these? Give feedback and regenerate</Label>
        <Textarea
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="E.g., 'Make it more casual', 'Add more details about benefits', 'Shorter subject lines'..."
          className="mt-2 resize-none h-24"
          data-testid="textarea-feedback"
        />
        <Button
          onClick={onRegenerate}
          disabled={isRegenerating || !feedback.trim()}
          className="mt-3"
          size="sm"
          variant="outline"
          data-testid="button-regenerate"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate with Feedback"
          )}
        </Button>
      </div>
    </div>
  );
}
