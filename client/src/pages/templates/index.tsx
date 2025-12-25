// Templates page - Main entry point

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, FileText, TrendingUp } from "lucide-react";

import type { EmailTemplate, TemplateFormValues } from "./types";
import { templateFormSchema } from "./types";
import { CATEGORIES } from "./data";
import { filterTemplates, formatCategoryLabel } from "./helpers";
import { CreateTemplateDialog } from "./components/CreateTemplateDialog";
import { EditTemplateDialog } from "./components/EditTemplateDialog";

// Re-export types for backward compatibility
export type { EmailTemplate, TemplateFormValues } from "./types";

export default function TemplatesPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const createForm = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            name: "",
            category: "",
            subject: "",
            body: "",
            writingStyle: "",
            description: "",
        },
    });

    const editForm = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            name: "",
            category: "",
            subject: "",
            body: "",
            writingStyle: "",
            description: "",
        },
    });

    const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
        queryKey: ["/api/templates"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: TemplateFormValues) => {
            return apiRequest("POST", "/api/templates", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
            setIsCreateDialogOpen(false);
            createForm.reset();
            toast({
                title: "Template created",
                description: "Your email template has been saved successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create template",
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: TemplateFormValues }) => {
            return apiRequest("PUT", `/api/templates/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
            setIsEditDialogOpen(false);
            setEditingTemplate(null);
            editForm.reset();
            toast({
                title: "Template updated",
                description: "Your changes have been saved successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update template",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest("DELETE", `/api/templates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
            toast({
                title: "Template deleted",
                description: "The template has been removed.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete template",
                variant: "destructive",
            });
        },
    });

    const onCreateSubmit = (data: TemplateFormValues) => {
        createMutation.mutate(data);
    };

    const onEditSubmit = (data: TemplateFormValues) => {
        if (editingTemplate) {
            updateMutation.mutate({ id: editingTemplate.id, data });
        }
    };

    const handleDeleteTemplate = (id: number) => {
        if (confirm("Are you sure you want to delete this template?")) {
            deleteMutation.mutate(id);
        }
    };

    const openEditDialog = (template: EmailTemplate) => {
        setEditingTemplate(template);
        editForm.reset({
            name: template.name,
            category: template.category || "",
            subject: template.subject,
            body: template.body,
            writingStyle: template.writingStyle || "",
            description: template.description || "",
        });
        setIsEditDialogOpen(true);
    };

    const handleOpenCreateDialog = () => {
        createForm.reset();
        setIsCreateDialogOpen(true);
    };

    const filteredTemplates = templates ? filterTemplates(templates, debouncedSearchQuery, selectedCategory) : [];

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" data-testid="text-templates-title">
                            Template Library
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage reusable email templates for your campaigns
                        </p>
                    </div>
                    <CreateTemplateDialog
                        isOpen={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                        form={createForm}
                        onSubmit={onCreateSubmit}
                        isPending={createMutation.isPending}
                        onOpenClick={handleOpenCreateDialog}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            data-testid="input-search-templates"
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {formatCategoryLabel(cat)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2 mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredTemplates && filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map((template) => (
                            <Card key={template.id} className="flex flex-col" data-testid={`template-card-${template.id}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate" data-testid={`text-template-name-${template.id}`}>
                                                {template.name}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {template.category && (
                                                    <Badge variant="secondary" className="mr-2">
                                                        {template.category}
                                                    </Badge>
                                                )}
                                                {template.timesUsed > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Used {template.timesUsed} times
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium truncate">
                                                {template.subject}
                                            </p>
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                        {template.totalSent > 0 && (
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>{template.avgOpenRate}% open</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{template.avgReplyRate}% reply</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => openEditDialog(template)}
                                        data-testid={`button-edit-${template.id}`}
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        data-testid={`button-delete-${template.id}`}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No templates found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {debouncedSearchQuery || selectedCategory !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "Create your first template to get started"}
                            </p>
                            {!debouncedSearchQuery && selectedCategory === "all" && (
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Template
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                <EditTemplateDialog
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    form={editForm}
                    onSubmit={onEditSubmit}
                    isPending={updateMutation.isPending}
                    onClose={() => {
                        setIsEditDialogOpen(false);
                        setEditingTemplate(null);
                    }}
                />
            </div>
        </div>
    );
}
