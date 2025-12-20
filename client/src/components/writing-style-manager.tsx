import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Plus, X } from "lucide-react";
import {
  WRITING_STYLES,
  DEFAULT_ACTIVE_STYLES,
  MAX_ACTIVE_STYLES,
  type WritingStyleId,
} from "@shared/writing-styles";

interface WritingStyleManagerProps {
  selectedStyle: WritingStyleId;
  onStyleChange: (style: WritingStyleId) => void;
  activeStyles: WritingStyleId[];
  onActiveStylesChange: (styles: WritingStyleId[]) => void;
}

export default function WritingStyleManager({
  selectedStyle,
  onStyleChange,
  activeStyles,
  onActiveStylesChange,
}: WritingStyleManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replacementMode, setReplacementMode] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<WritingStyleId | null>(null);

  const availableStyles = (Object.keys(WRITING_STYLES) as WritingStyleId[]).filter(
    (styleId) => !activeStyles.includes(styleId)
  );

  const handleAddStyle = (styleId: WritingStyleId) => {
    if (activeStyles.length >= MAX_ACTIVE_STYLES) {
      // Enter replacement mode
      setPendingStyle(styleId);
      setReplacementMode(true);
    } else {
      // Add style directly
      onActiveStylesChange([...activeStyles, styleId]);
      setIsDialogOpen(false);
    }
  };

  const handleReplaceStyle = (styleToReplace: WritingStyleId) => {
    if (!pendingStyle) return;

    const newActiveStyles = activeStyles.map((s) =>
      s === styleToReplace ? pendingStyle : s
    );
    onActiveStylesChange(newActiveStyles);

    // If the replaced style was selected, switch to the new one
    if (selectedStyle === styleToReplace) {
      onStyleChange(pendingStyle);
    }

    setReplacementMode(false);
    setPendingStyle(null);
    setIsDialogOpen(false);
  };

  const handleRemoveStyle = (styleId: WritingStyleId) => {
    // Can't remove if only 1 style left
    if (activeStyles.length <= 1) return;

    const newActiveStyles = activeStyles.filter((s) => s !== styleId);
    onActiveStylesChange(newActiveStyles);

    // If removed style was selected, switch to first remaining style
    if (selectedStyle === styleId) {
      onStyleChange(newActiveStyles[0]);
    }
  };

  const handleCancelReplacement = () => {
    setReplacementMode(false);
    setPendingStyle(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Writing Style</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setReplacementMode(false);
                setPendingStyle(null);
              }}
              data-testid="button-add-writing-styles"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Writing Styles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {replacementMode ? "Replace a Writing Style" : "Add Writing Styles"}
              </DialogTitle>
              <DialogDescription>
                {replacementMode
                  ? `You've reached the maximum of ${MAX_ACTIVE_STYLES} active styles. Select a style to replace with "${WRITING_STYLES[pendingStyle!].name}".`
                  : `Select writing styles to add (maximum ${MAX_ACTIVE_STYLES} active styles).`}
              </DialogDescription>
            </DialogHeader>

            {replacementMode && pendingStyle ? (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    Click on a style below to replace it with <strong>{WRITING_STYLES[pendingStyle].name}</strong>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  {activeStyles.map((styleId) => (
                    <button
                      key={styleId}
                      onClick={() => handleReplaceStyle(styleId)}
                      className="w-full text-left p-4 border border-border rounded-md hover-elevate active-elevate-2 transition-colors"
                      data-testid={`button-replace-${styleId}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{WRITING_STYLES[styleId].name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {WRITING_STYLES[styleId].description}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-4">
                          Click to replace
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleCancelReplacement}
                  className="w-full"
                  data-testid="button-cancel-replacement"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableStyles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    All available writing styles are already active.
                  </div>
                ) : (
                  availableStyles.map((styleId) => (
                    <div
                      key={styleId}
                      className="flex items-start justify-between p-4 border border-border rounded-md"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{WRITING_STYLES[styleId].name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {WRITING_STYLES[styleId].description}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddStyle(styleId)}
                        className="ml-4"
                        data-testid={`button-add-${styleId}`}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <RadioGroup
        value={selectedStyle}
        onValueChange={(value) => onStyleChange(value as WritingStyleId)}
        className="space-y-3"
        data-testid="radio-writing-style"
      >
        {activeStyles.map((styleId) => (
          <div
            key={styleId}
            className="flex items-start space-x-2 group"
          >
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem
                value={styleId}
                id={styleId}
                data-testid={`radio-${styleId}`}
              />
              <Label
                htmlFor={styleId}
                className="font-normal cursor-pointer flex-1"
              >
                <span className="font-medium">{WRITING_STYLES[styleId].name}</span>
                <span className="text-xs text-muted-foreground block">
                  {WRITING_STYLES[styleId].description}
                </span>
              </Label>
            </div>
            
            {activeStyles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveStyle(styleId);
                }}
                data-testid={`button-remove-${styleId}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
