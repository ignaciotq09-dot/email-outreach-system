import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Loader2, Building2, MapPin, Briefcase, Users, X, ChevronDown, ChevronRight, Filter, Building, Mail } from "lucide-react";
import type { ActiveFilters, OpenSections, FilterInputs, FiltersResponse } from "../types";

interface FiltersSidebarProps {
  activeFilters: ActiveFilters;
  openSections: OpenSections;
  filterInputs: FilterInputs;
  filters?: FiltersResponse;
  totalActiveFilters: number;
  isSearching: boolean;
  onOpenSectionsChange: (sections: OpenSections) => void;
  onFilterInputsChange: (inputs: FilterInputs) => void;
  onAddFilter: (type: keyof ActiveFilters, value: string) => void;
  onRemoveFilter: (type: keyof ActiveFilters, value: string) => void;
  onClearAllFilters: () => void;
  onSearch: () => void;
}

export function FiltersSidebar({ activeFilters, openSections, filterInputs, filters, totalActiveFilters, isSearching, onOpenSectionsChange, onFilterInputsChange, onAddFilter, onRemoveFilter, onClearAllFilters, onSearch }: FiltersSidebarProps) {
  const handleAddFilterWithClear = (type: keyof ActiveFilters, inputKey: keyof FilterInputs, value: string) => {
    onAddFilter(type, value);
    onFilterInputsChange({ ...filterInputs, [inputKey]: '' });
  };

  return (
    <div className="w-64 border-r border-border bg-muted/30 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" />Filters</h3>
          {totalActiveFilters > 0 && (<Button variant="ghost" size="sm" onClick={onClearAllFilters} className="text-xs h-7 px-2">Clear all</Button>)}
        </div>
      </div>

      <div className="p-2">
        <Collapsible open={openSections.jobTitles} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, jobTitles: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><Briefcase className="w-4 h-4" />Job Titles{activeFilters.jobTitles.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.jobTitles.length}</Badge>}</span>
            {openSections.jobTitles ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2">
            <div className="flex gap-1 mt-2">
              <Input placeholder="Add job title..." value={filterInputs.jobTitle} onChange={(e) => onFilterInputsChange({ ...filterInputs, jobTitle: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFilterWithClear('jobTitles', 'jobTitle', filterInputs.jobTitle); }} className="h-8 text-sm" data-testid="input-filter-job-title" />
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleAddFilterWithClear('jobTitles', 'jobTitle', filterInputs.jobTitle)}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{activeFilters.jobTitles.map((title) => (<Badge key={title} variant="secondary" className="text-xs gap-1">{title}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('jobTitles', title)} /></Badge>))}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.locations} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, locations: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4" />Location{activeFilters.locations.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.locations.length}</Badge>}</span>
            {openSections.locations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2">
            <div className="flex gap-1 mt-2">
              <Input placeholder="Add location..." value={filterInputs.location} onChange={(e) => onFilterInputsChange({ ...filterInputs, location: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFilterWithClear('locations', 'location', filterInputs.location); }} className="h-8 text-sm" data-testid="input-filter-location" />
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleAddFilterWithClear('locations', 'location', filterInputs.location)}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{activeFilters.locations.map((loc) => (<Badge key={loc} variant="secondary" className="text-xs gap-1">{loc}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('locations', loc)} /></Badge>))}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.industries} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, industries: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><Building className="w-4 h-4" />Industry{activeFilters.industries.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.industries.length}</Badge>}</span>
            {openSections.industries ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2 max-h-48 overflow-y-auto">
            <div className="space-y-1 mt-2">{filters?.industries.slice(0, 20).map((ind) => (<label key={ind} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-sm"><Checkbox checked={activeFilters.industries.includes(ind)} onCheckedChange={(checked) => { if (checked) onAddFilter('industries', ind); else onRemoveFilter('industries', ind); }} /><span className="truncate">{ind}</span></label>))}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.companies} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, companies: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><Building className="w-4 h-4" />Companies{(activeFilters.companies?.length || 0) > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.companies?.length || 0}</Badge>}</span>
            {openSections.companies ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2">
            <div className="flex gap-1 mt-2">
              <Input placeholder="Company name or domain..." value={filterInputs.company} onChange={(e) => onFilterInputsChange({ ...filterInputs, company: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') handleAddFilterWithClear('companies', 'company', filterInputs.company); }} className="h-8 text-sm" data-testid="input-filter-company" />
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleAddFilterWithClear('companies', 'company', filterInputs.company)}>+</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">e.g., Google, salesforce.com</p>
            <div className="flex flex-wrap gap-1 mt-2">{(activeFilters.companies || []).map((company) => (<Badge key={company} variant="secondary" className="text-xs gap-1">{company}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('companies', company)} /></Badge>))}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.companySizes} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, companySizes: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><Users className="w-4 h-4" />Company Size{activeFilters.companySizes.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.companySizes.length}</Badge>}</span>
            {openSections.companySizes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2">
            <div className="space-y-1 mt-2">{filters?.companySizes.map((size) => (<label key={size.value} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-sm"><Checkbox checked={activeFilters.companySizes.includes(size.value)} onCheckedChange={(checked) => { if (checked) onAddFilter('companySizes', size.value); else onRemoveFilter('companySizes', size.value); }} /><span>{size.label}</span></label>))}</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.emailStatus} onOpenChange={(open) => onOpenSectionsChange({ ...openSections, emailStatus: open })}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
            <span className="flex items-center gap-2 text-sm font-medium"><Mail className="w-4 h-4" />Email Status{(activeFilters.emailStatuses?.length || 0) > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilters.emailStatuses?.length || 0}</Badge>}</span>
            {openSections.emailStatus ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pb-2">
            <div className="space-y-1 mt-2">
              <label className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-sm">
                <Checkbox
                  checked={activeFilters.emailStatuses?.includes("verified") || false}
                  onCheckedChange={(checked) => {
                    if (checked) onAddFilter('emailStatuses', 'verified');
                    else onRemoveFilter('emailStatuses', 'verified');
                  }}
                />
                <span className="flex items-center gap-1.5">✓ Verified Emails</span>
              </label>
              <label className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-sm">
                <Checkbox
                  checked={activeFilters.emailStatuses?.includes("unverified") || false}
                  onCheckedChange={(checked) => {
                    if (checked) onAddFilter('emailStatuses', 'unverified');
                    else onRemoveFilter('emailStatuses', 'unverified');
                  }}
                />
                <span className="flex items-center gap-1.5">✗ Unverified Emails</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Filter by Apollo's email verification status</p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <Button onClick={onSearch} disabled={isSearching || totalActiveFilters === 0} className="w-full" data-testid="button-search-contacts">
          {isSearching ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>) : (<><Search className="w-4 h-4 mr-2" />Search ({totalActiveFilters})</>)}
        </Button>
      </div>
    </div>
  );
}
