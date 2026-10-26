import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, SubNav } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";

export function StudioTabs() {
  return (
    <SubNav
      items={[
        { to: "/studio", label: "Sessions", exact: true },
        { to: "/studio/calendar", label: "Calendar" },
      ]}
    />
  );
}

export function AddSessionDialog({ defaultDate = "2025-04-24" }: { defaultDate?: string }) {
  const { state: demo, addSession } = useDemo();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    clientId: "",
    date: defaultDate,
    start: "10:00",
    end: "11:00",
    location: "Studio",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toast.error("Choose a client for this session.");
      return;
    }
    if (form.end <= form.start) {
      toast.error("End time must be after the start time.");
      return;
    }
    addSession(form);
    toast.success(`${form.title} added as pending`);
    setOpen(false);
    set({ title: "", clientId: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">New session</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ns-title">Session name</Label>
            <Input
              id="ns-title"
              required
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Engagement Shoot"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={form.clientId} onValueChange={(clientId) => set({ clientId })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {demo.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="ns-date">Date</Label>
              <Input
                id="ns-date"
                type="date"
                required
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ns-start">Start</Label>
              <Input
                id="ns-start"
                type="time"
                required
                value={form.start}
                onChange={(e) => set({ start: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ns-end">End</Label>
              <Input
                id="ns-end"
                type="time"
                required
                value={form.end}
                onChange={(e) => set({ end: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ns-loc">Location</Label>
            <Input
              id="ns-loc"
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
