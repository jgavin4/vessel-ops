"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useApi } from "@/hooks/use-api";
import type {
  TripCreate,
  MaintenanceTask,
  InventoryRequirement,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PostTripSummary = {
  maintenanceDue: MaintenanceTask[];
  inventoryShort: InventoryRequirement[];
};

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
  const [postTripSummary, setPostTripSummary] = useState<PostTripSummary | null>(
    null
  );

  const createTripMutation = useMutation({
    mutationFn: (payload: TripCreate) => api.createTrip(vesselId, payload),
    onSuccess: async () => {
      toast.success("Trip logged successfully");
      setHours("");
      setNote("");
      setLoggedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      queryClient.invalidateQueries({ queryKey: ["vessel-total-hours", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["vessel-trips", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-tasks", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-requirements", vesselId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-checks", vesselId] });
      onOpenChange(false);
      onSuccess?.();

      // Fetch fresh data and show summary of what's now due or short
      try {
        const [tasks, requirements] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: ["maintenance-tasks", vesselId],
            queryFn: () => api.listMaintenanceTasks(vesselId),
          }),
          queryClient.fetchQuery({
            queryKey: ["inventory-requirements", vesselId],
            queryFn: () => api.listInventoryRequirements(vesselId),
          }),
        ]);
        const maintenanceDue = (tasks as MaintenanceTask[]).filter(
          (t) => t.is_due_by_hours === true || t.is_due_by_date === true
        );
        const inventoryShort = (requirements as InventoryRequirement[]).filter(
          (r) => r.current_quantity < r.required_quantity
        );
        if (maintenanceDue.length > 0 || inventoryShort.length > 0) {
          setPostTripSummary({ maintenanceDue, inventoryShort });
        }
      } catch {
        // Non-fatal: trip was logged; skip summary
      }
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
    <>
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

      <Dialog
        open={postTripSummary !== null}
        onOpenChange={(open) => !open && setPostTripSummary(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>After this trip</DialogTitle>
          </DialogHeader>
          {postTripSummary && (
            <div className="space-y-4 text-sm">
              {postTripSummary.maintenanceDue.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                    Maintenance due
                  </h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    {postTripSummary.maintenanceDue.map((t) => (
                      <li key={t.id}>{t.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {postTripSummary.inventoryShort.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                    Inventory below required
                  </h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    {postTripSummary.inventoryShort.map((r) => (
                      <li key={r.id}>
                        {r.item_name}: {r.current_quantity} / {r.required_quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPostTripSummary(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
