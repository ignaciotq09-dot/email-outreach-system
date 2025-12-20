import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Search, Download, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import type { CampaignLeaderboardData, SortField, SortOrder } from "./types";

interface CampaignLeaderboardProps {
  data?: CampaignLeaderboardData;
  isLoading: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'active' | 'draft' | 'completed';
  onStatusFilterChange: (status: 'all' | 'active' | 'draft' | 'completed') => void;
}

export function CampaignLeaderboard({ data, isLoading, sortBy, sortOrder, onSort, searchQuery, onSearchChange, statusFilter, onStatusFilterChange }: CampaignLeaderboardProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  
  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return [];
    return data.campaigns.filter(campaign => {
      const matchesSearch = !searchQuery || (campaign.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.campaigns, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (!filteredCampaigns.length) return;
    const headers = ['Subject', 'Status', 'Date', 'Sent', 'Open Rate', 'Reply Rate'];
    const rows = filteredCampaigns.map(c => [c.subject || 'Untitled', c.status, format(new Date(c.createdAt), 'yyyy-MM-dd'), c.totalSent, `${c.openRate.toFixed(1)}%`, `${c.replyRate.toFixed(1)}%`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `campaign-leaderboard-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const SortableHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => {
    const isActive = sortBy === field;
    return (
      <button onClick={() => onSort(field)} className={`flex items-center gap-1 font-medium text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`} data-testid={`sort-${field}`}>
        {children}
        {isActive && (sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    );
  };

  const PerformanceBadge = ({ isAbove, hasValidComparison }: { isAbove: boolean; hasValidComparison: boolean }) => {
    if (!hasValidComparison) return null;
    return (
      <Badge variant="secondary" className={`ml-1 text-xs px-1.5 py-0 ${isAbove ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
        {isAbove ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card data-testid="card-campaign-leaderboard">
        <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div></CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-campaign-leaderboard">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Campaign Leaderboard</CardTitle>
            <CardDescription>
              All campaigns ranked by performance
              {data?.averages && <span className="ml-2 text-xs">(Avg: {data.averages.openRate.toFixed(1)}% open, {data.averages.replyRate.toFixed(1)}% reply)</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredCampaigns.length} data-testid="button-export-csv"><Download className="h-4 w-4 mr-1" />Export</Button>
            {data?.total !== undefined && <Badge variant="secondary" data-testid="badge-campaign-count">{filteredCampaigns.length}/{data.total} campaigns</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-8" data-testid="input-search-campaigns" />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as 'all' | 'active' | 'draft' | 'completed')}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs" data-testid="tab-status-all">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs" data-testid="tab-status-active">Active</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs" data-testid="tab-status-draft">Draft</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs" data-testid="tab-status-completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {!data || filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchQuery || statusFilter !== 'all' ? 'No matching campaigns' : 'No campaigns yet'}</p>
            <p className="text-sm mt-1">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first campaign to see performance metrics'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs">
              <div className="col-span-5"><SortableHeader field="date">Campaign</SortableHeader></div>
              <div className="col-span-2 text-center"><SortableHeader field="sent" className="justify-center">Sent</SortableHeader></div>
              <div className="col-span-2 text-center"><SortableHeader field="openRate" className="justify-center">Open Rate</SortableHeader></div>
              <div className="col-span-3 text-center"><SortableHeader field="replyRate" className="justify-center">Reply Rate</SortableHeader></div>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filteredCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/50 transition-colors items-center" data-testid={`leaderboard-campaign-${campaign.id}`}>
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-medium text-xs flex-shrink-0">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm" data-testid={`text-leaderboard-subject-${campaign.id}`}>{campaign.subject || 'Untitled Campaign'}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center"><span className="font-medium text-sm">{campaign.totalSent}</span></div>
                  <div className="col-span-2 text-center flex items-center justify-center">
                    <span className="font-medium text-sm">{formatPercent(campaign.openRate)}</span>
                    <PerformanceBadge isAbove={campaign.isAboveAverageOpen} hasValidComparison={campaign.hasValidOpenComparison} />
                  </div>
                  <div className="col-span-3 text-center flex items-center justify-center">
                    <span className="font-medium text-sm">{formatPercent(campaign.replyRate)}</span>
                    <PerformanceBadge isAbove={campaign.isAboveAverageReply} hasValidComparison={campaign.hasValidReplyComparison} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
