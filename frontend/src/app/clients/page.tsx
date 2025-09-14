import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button>Add Client</Button>
      </div>
    </div>
  );
}