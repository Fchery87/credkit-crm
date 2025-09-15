"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and payment details"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Billing" }]}
      />
      <div className="card-modern p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="h3">Professional</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="h3">$79.99/mo</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Next billing date</p>
          <p className="text-sm">Feb 15, 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="flex-1">Manage Subscription</Button>
          <Button variant="outline" className="flex-1">Update Payment Method</Button>
        </div>
      </div>

      <div className="card-modern p-6">
        <h3 className="h4 mb-4">Invoices</h3>
        <div className="space-y-3">
          {[
            { date: "Jan 15, 2024", amount: "$79.99", status: "Paid" },
            { date: "Dec 15, 2023", amount: "$79.99", status: "Paid" },
            { date: "Nov 15, 2023", amount: "$79.99", status: "Paid" },
          ].map((inv, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div>
                <p className="font-medium">{inv.amount}</p>
                <p className="text-sm text-muted-foreground">{inv.date}</p>
              </div>
              <Button variant="outline" size="sm">Download</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}