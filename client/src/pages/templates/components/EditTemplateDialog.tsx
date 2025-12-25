// Edit Template Dialog Component

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TemplateFormFields } from "./TemplateFormFields";
import type { UseFormReturn } from "react-hook-form";
import type { TemplateFormValues } from "../types";

interface EditTemplateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<TemplateFormValues>;
    onSubmit: (data: TemplateFormValues) => void;
    isPending: boolean;
    onClose: () => void;
}

export function EditTemplateDialog({
    isOpen,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    onClose
}: EditTemplateDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                    <DialogDescription>
                        Update your email template
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <TemplateFormFields form={form} isEdit />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                data-testid="button-cancel-edit"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                data-testid="button-update-template"
                            >
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
