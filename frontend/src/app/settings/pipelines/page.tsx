"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SAMPLE_PIPELINES = [
  {
    name: "Client lifecycle",
    stages: ["New Lead", "Consultation", "Onboarding", "Active", "Completed"],
  },
  {
    name: "Dispute workflow",
    stages: ["Draft", "Submitted", "In review", "Response received", "Resolved"],
  },
];

export default function SettingsPipelinesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        subtitle="Design the stages for client and dispute progress to power automation"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Pipelines" }]}
        actions={<Button>Add pipeline</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SAMPLE_PIPELINES.map((pipeline) => (
          <Card key={pipeline.name}>
            <CardHeader>
              <CardTitle>{pipeline.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipeline.stages.map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  <Input defaultValue={stage} />
                  <Button size="icon" variant="ghost" aria-label="Reorder">
                    =
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline">Add stage</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

