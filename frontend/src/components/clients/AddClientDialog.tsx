"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";

import type { AddClientPayload } from "@/lib/client-directory";
import { getClientRoster } from "@/lib/client-directory";

export type AddClientFormValues = AddClientPayload;

const INITIAL_FORM: AddClientFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dob: "",
  last4Ssn: "",
  tags: [],
  source: "",
  stage: "prospect",
};

type AddClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (payload: AddClientFormValues) => void | Promise<void>;
};

const sanitizeLast4 = (value: string) => value.replace(/[^0-9]/g, "").slice(0, 4);
const isAdult = (dob: string) => {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return birthDate <= eighteenYearsAgo;
};

const normaliseEmail = (value: string) => value.trim().toLowerCase();
const normalisePhone = (value: string) => value.replace(/\D+/g, "");

export function AddClientDialog({ open, onOpenChange, onCreate }: AddClientDialogProps) {
  const [form, setForm] = useState<AddClientFormValues>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const first = form.firstName.trim();
    const last = form.lastName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const dob = form.dob?.trim() ?? "";
    const last4 = sanitizeLast4(form.last4Ssn ?? "");
    const source = form.source?.trim() ?? "";
    const address = form.address?.trim() ?? "";
    const tags = Array.from(new Set((form.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));

    if (!first || !last) {
      setError("First name and last name are required.");
      return;
    }

    if (!email && !phone) {
      setError("Provide at least an email or phone number.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (dob && !isAdult(dob)) {
      setError("Client must be at least 18 years old.");
      return;
    }

    if (last4 && last4.length !== 4) {
      setError("Last 4 SSN digits must contain exactly four numbers.");
      return;
    }

    const roster = getClientRoster();
    const emailLookup = email ? normaliseEmail(email) : null;
    const phoneLookup = phone ? normalisePhone(phone) : null;

    if (emailLookup && roster.some((client) => client.email && normaliseEmail(client.email) === emailLookup)) {
      setError("A client with this email already exists.");
      return;
    }

    if (phoneLookup && roster.some((client) => client.phone && normalisePhone(client.phone) === phoneLookup)) {
      setError("A client with this phone number already exists.");
      return;
    }

    const payload: AddClientFormValues = {
      firstName: first,
      lastName: last,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      dob: dob || undefined,
      last4Ssn: last4 || undefined,
      tags: tags.length ? tags : undefined,
      source: source || undefined,
      stage: form.stage,
    };

    setError(null);

    startTransition(async () => {
      try {
        await onCreate?.(payload);
        onOpenChange(false);
      } catch (cause) {
        console.error("Failed to create client", cause);
        const message = cause instanceof Error ? cause.message : "Something went wrong while saving. Please try again.";
        setError(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh-3rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
          <DialogDescription>
            Capture rich client information to kick off a new engagement.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-dob">Date of birth</Label>
              <Input
                id="client-dob"
                type="date"
                value={form.dob ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-last4">Last 4 SSN</Label>
              <Input
                id="client-last4"
                value={form.last4Ssn ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, last4Ssn: sanitizeLast4(event.target.value) }))}
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Textarea
              id="client-address"
              value={form.address ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Street, City, State"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-source">Source</Label>
              <Input
                id="client-source"
                value={form.source ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                placeholder="Website, Event, Referral..."
              />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-tags">Tags</Label>
            <Input
              id="client-tags"
              value={(form.tags ?? []).join(", ")}
              onChange={(event) => {
                const entries = event.target.value.split(",");
                setForm((prev) => ({ ...prev, tags: entries }));
              }}
              placeholder="VIP, High Value"
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
