"use client";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SAMPLE_USERS = [
  { name: "Monica Reed", email: "monica@credkitcrm.com", role: "Administrator", status: "Active" },
  { name: "John Agent", email: "john.agent@credkitcrm.com", role: "Agent", status: "Active" },
  { name: "Jamie Ops", email: "jamie.ops@credkitcrm.com", role: "Operations", status: "Suspended" },
];

export default function SettingsUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Invite teammates, manage roles, and suspend access as needed"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Users & Roles" }]}
        actions={<Button>Invite user</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_USERS.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost">Change role</Button>
                    <Button size="sm" variant="ghost">Suspend</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}