"use client";

import { useState, useTransition, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AddClientPayload } from "@/lib/client-directory";

export type AddClientFormValues = AddClientPayload;

const INITIAL_FORM: AddClientFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  stage: "prospect",
};

type AddClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (payload: AddClientFormValues) => void | Promise<void>;
};

export function AddClientDialog({ open, onOpenChange, onCreate }: AddClientDialogProps) {
  const [form, setForm] = useState<AddClientFormValues>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Please provide first name, last name, and email.");
      return;
    }

    startTransition(async () => {
      try {
        await onCreate?.({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          stage: form.stage,
        });
        handleOpenChange(false);
      } catch (error) {
        console.error('Failed to create client', error);
        setError('Something went wrong while saving. Please try again.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
          <DialogDescription>
            Capture basic client information to kick off a new engagement.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-first-name">First name</Label>
              <Input
                id="client-first-name"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder="Jane"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-last-name">Last name</Label>
              <Input
                id="client-last-name"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="jane.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={form.stage}
              onValueChange={(value: AddClientFormValues["stage"]) =>
                setForm((prev) => ({ ...prev, stage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active Client</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={isPending}>
              {isPending ? "Saving..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
