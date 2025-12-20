import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import WritingStyleManager from "../writing-style-manager";
import type { WritingStyleId } from "@shared/writing-styles";

interface MessageComposerProps {
  baseMessage: string;
  onBaseMessageChange: (message: string) => void;
  writingStyle: WritingStyleId;
  onStyleChange: (style: WritingStyleId) => void;
  activeStyles: WritingStyleId[];
  onActiveStylesChange: (styles: WritingStyleId[]) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function MessageComposer({
  baseMessage,
  onBaseMessageChange,
  writingStyle,
  onStyleChange,
  activeStyles,
  onActiveStylesChange,
  isGenerating,
  onGenerate,
}: MessageComposerProps) {
  return (
    <div className="border-b border-border p-6">
      <h2 className="text-lg font-semibold mb-4">Step 1: Compose Your Message</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="base-message" className="text-sm">Base Message</Label>
          <Textarea
            id="base-message"
            value={baseMessage}
            onChange={(e) => onBaseMessageChange(e.target.value)}
            placeholder="Write your message here. AI will generate 3 different variants..."
            className="mt-1 resize-none h-40"
            data-testid="textarea-base-message"
          />
        </div>

        <WritingStyleManager
          selectedStyle={writingStyle}
          onStyleChange={onStyleChange}
          activeStyles={activeStyles}
          onActiveStylesChange={onActiveStylesChange}
        />

        <Button
          onClick={onGenerate}
          disabled={isGenerating || !baseMessage}
          className="w-full"
          data-testid="button-generate-variants"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Variants...
            </>
          ) : (
            "Generate 3 Email Variants"
          )}
        </Button>
      </div>
    </div>
  );
}
