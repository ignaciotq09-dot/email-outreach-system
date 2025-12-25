// Create Template Dialog Component

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { TemplateFormFields } from "./TemplateFormFields";
import type { UseFormReturn } from "react-hook-form";
import type { TemplateFormValues } from "../types";

interface CreateTemplateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<TemplateFormValues>;
    onSubmit: (data: TemplateFormValues) => void;
    isPending: boolean;
    onOpenClick: () => void;
}

export function CreateTemplateDialog({
    isOpen,
    onOpenChange,
    form,
    onSubmit,
    isPending,
    onOpenClick
}: CreateTemplateDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button data-testid="button-create-template" onClick={onOpenClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tem plate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                        Create a reusable email template for your outreach campaigns
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <TemplateFormFields form={form} />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                data-testid="button-cancel-create"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                data-testid="button-save-template"
                            >
                                {isPending ? "Saving..." : "Create Template"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
