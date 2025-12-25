// Template Form Fields Component - Shared form fields for create/edit

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, WRITING_STYLES } from "./data";
import { formatCategoryLabel } from "./helpers";
import type { UseFormReturn } from "react-hook-form";
import type { TemplateFormValues } from "./types";

interface TemplateFormFieldsProps {
    form: UseFormReturn<TemplateFormValues>;
    isEdit?: boolean;
}

export function TemplateFormFields({ form, isEdit = false }: TemplateFormFieldsProps) {
    const prefix = isEdit ? "edit" : "";

    return (
        <>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                            <Input
                                placeholder={!isEdit ? "e.g., Sales Introduction" : undefined}
                                {...field}
                                data-testid={`input-${prefix}template-name`}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger data-testid={`select-${prefix}category`}>
                                        <SelectValue placeholder={!isEdit ? "Select category" : undefined} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {formatCategoryLabel(cat)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="writingStyle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Writing Style</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger data-testid={`select-${prefix}writing-style`}>
                                        <SelectValue placeholder={!isEdit ? "Select style" : undefined} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {WRITING_STYLES.map((style) => (
                                        <SelectItem key={style.value} value={style.value}>
                                            {style.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Input
                                placeholder={!isEdit ? "Brief description of this template" : undefined}
                                {...field}
                                data-testid={`input-${prefix}template-description`}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                            <Input
                                placeholder={!isEdit ? "Subject line" : undefined}
                                {...field}
                                data-testid={`input-${prefix}template-subject`}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder={!isEdit ? "Email content..." : undefined}
                                rows={10}
                                {...field}
                                data-testid={`${isEdit ? "textarea-edit" : "textarea"}-template-body`}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
}
