"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useApi } from "@/hooks/use-api";
import type { TripCreate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function LogTripModal({
  open,
  onOpenChange,
  vesselId,
  vesselName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vesselId: number;
  vesselName?: string;
  onSuccess?: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("");
  const [loggedAt, setLoggedAt] = useState(() =>
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [note, setNote] = useState("");

  const createTripMutation = useMutation({
    mutationFn: (payload: TripCreate) => api.createTrip(vesselId, payload),
    onSuccess: () => {
      toast.success("Trip logged successfully");
      setHours("");
      setNote("");
      setLoggedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      queryClient.invalidateQueries({ queryKey: ["vessel-total-hours", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["vessel-trips", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-tasks", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-requirements", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-checks", vesselId] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to log trip");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (Number.isNaN(h) || h <= 0) {
      toast.error("Please enter hours greater than 0");
      return;
    }
    createTripMutation.mutate({
      hours: h,
      logged_at: loggedAt ? new Date(loggedAt).toISOString() : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Log Trip{vesselName ? ` — ${vesselName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Hours *</label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2.5"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date & time (optional)</label>
            <Input
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Note (optional)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTripMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTripMutation.isPending}>
              {createTripMutation.isPending ? "Logging..." : "Log Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
