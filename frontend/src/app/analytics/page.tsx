"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernChart } from "@/components/charts/ModernChart";
import { cn } from "@/lib/utils";

const SECTION_OPTIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
];

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
];

const GROUP_OPTIONS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
];

const VIEW_OPTIONS = [
  { value: "summary", label: "Summary" },
  { value: "list", label: "List" },
];

const datasets = {
  revenue: [
    { name: "Jan", value: 22000, secondary: 18 },
    { name: "Feb", value: 24500, secondary: 22 },
    { name: "Mar", value: 27500, secondary: 25 },
    { name: "Apr", value: 26800, secondary: 21 },
    { name: "May", value: 28600, secondary: 27 },
    { name: "Jun", value: 30100, secondary: 29 },
  ],
  operations: [
    { name: "Jan", value: 82, secondary: 18 },
    { name: "Feb", value: 88, secondary: 16 },
    { name: "Mar", value: 84, secondary: 20 },
    { name: "Apr", value: 90, secondary: 21 },
    { name: "May", value: 93, secondary: 23 },
    { name: "Jun", value: 95, secondary: 19 },
  ],
  marketing: [
    { name: "Jan", value: 540, secondary: 42 },
    { name: "Feb", value: 620, secondary: 46 },
    { name: "Mar", value: 705, secondary: 55 },
    { name: "Apr", value: 688, secondary: 49 },
    { name: "May", value: 745, secondary: 58 },
    { name: "Jun", value: 812, secondary: 63 },
  ],
} as const;

const listBreakdowns: Record<string, Array<{ title: string; metric: string; delta: string; description: string }>> = {
  revenue: [
    { title: "Recurring revenue", metric: "$23.6K", delta: "+8.4%", description: "Auto-draft subscriptions" },
    { title: "One-time fees", metric: "$8.9K", delta: "+3.2%", description: "Dispute setup + consultations" },
    { title: "Refunds", metric: "-$620", delta: "-1.7%", description: "Issued in current period" },
  ],
  operations: [
    { title: "Cases resolved", metric: "214", delta: "+12%", description: "Completed disputes" },
    { title: "Turnaround time", metric: "9.3 days", delta: "-1.1d", description: "Avg. time to resolution" },
    { title: "Utilization", metric: "78%", delta: "+4%", description: "Team workload coverage" },
  ],
  marketing: [
    { title: "Inbound leads", metric: "1,235", delta: "+15%", description: "Captured across all funnels" },
    { title: "Conversion rate", metric: "26%", delta: "+2.4%", description: "Leads to paying clients" },
    { title: "CPL", metric: "$42", delta: "-6%", description: "Cost per qualified lead" },
  ],
};

const formatSectionTitle = (section: string) => {
  const match = SECTION_OPTIONS.find((option) => option.value === section);
  return match?.label ?? "Revenue";
};

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const section = params.get("section") ?? "revenue";
  const range = params.get("range") ?? "30d";
  const group = params.get("group") ?? "week";
  const view = params.get("view") ?? "summary";

  const data = useMemo(() => {
    const raw = datasets[section as keyof typeof datasets] ?? datasets.revenue;
    return raw.map((item) => ({ ...item }));
  }, [section]);
  const listItems = useMemo(() => {
    const raw = listBreakdowns[section] ?? listBreakdowns.revenue;
    return raw.map((item) => ({ ...item }));
  }, [section]);

  const updateParams = (next: Record<string, string>) => {
    const query = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        query.delete(key);
      } else {
        query.set(key, value);
      }
    });
    router.replace(`/analytics?${query.toString()}` as any, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Overview"
        subtitle={`Explore ${formatSectionTitle(section).toLowerCase()} performance across your workflows.`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics" }]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Range</span>
          <Select value={range} onValueChange={(value) => updateParams({ range: value })}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm font-medium text-muted-foreground">Group</span>
          <Select value={group} onValueChange={(value) => updateParams({ group: value })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select grouping" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="inline-flex items-center rounded-md border p-1">
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={view === option.value ? "default" : "ghost"}
              size="sm"
              className={cn("rounded-sm", view === option.value ? "shadow-sm" : "")}
              onClick={() => updateParams({ view: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs
        value={section}
        onValueChange={(value) => updateParams({ section: value })}
        className="space-y-6"
      >
        <TabsList className="grid gap-2 bg-muted/40 p-1 md:grid-cols-3">
          {SECTION_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="rounded-md"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTION_OPTIONS.map((option) => (
          <TabsContent key={option.value} value={option.value} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{option.label} trend</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ModernChart
                  type="area"
                  data={data}
                  dataKey="value"
                  colors={[
                    option.value === "revenue"
                      ? "hsl(210, 90%, 50%)"
                      : option.value === "operations"
                      ? "hsl(152, 65%, 48%)"
                      : "hsl(280, 70%, 55%)",
                  ]}
                  xAxisKey="name"
                  showGrid
                />
                <p className="mt-4 text-xs text-muted-foreground">
                  Range: {range.toUpperCase()} - Grouped by {group} - Deep link enabled via URL params.
                </p>
              </CardContent>
            </Card>

            {view === "list" ? (
              <Card>
                <CardHeader>
                  <CardTitle>{option.label} breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listItems.map((item) => (
                    <div key={item.title} className="flex items-start justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">{item.metric}</p>
                        <p className="text-xs text-success">{item.delta}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {listItems.map((item) => (
                  <Card key={item.title}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-foreground">{item.metric}</p>
                      <p className="text-xs text-success mt-1">{item.delta}</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-normal">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}





