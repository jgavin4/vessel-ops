"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listVessels, createVessel, type VesselCreate } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

function AddVesselDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VesselCreate>({
    name: "",
    make: null,
    model: null,
    year: null,
    description: null,
    location: null,
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const createMutation = useMutation({
    mutationFn: createVessel,
    onSuccess: () => {
      toast.success("Vessel created successfully");
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
      onOpenChange(false);
      setFormData({
        name: "",
        make: null,
        model: null,
        year: null,
        description: null,
        location: null,
      });
      setErrors({});
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create vessel");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Vessel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Vessel name"
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Make</label>
              <Input
                value={formData.make || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    make: e.target.value || null,
                  })
                }
                placeholder="Manufacturer"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Input
                value={formData.model || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    model: e.target.value || null,
                  })
                }
                placeholder="Model"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Input
                type="number"
                value={formData.year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Year"
                min="1900"
                max="2100"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value || null,
                  })
                }
                placeholder="Location"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value || null,
                  })
                }
                placeholder="Description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Vessel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VesselCard({ vessel }: { vessel: any }) {
  const makeModelYear = [
    vessel.make,
    vessel.model,
    vessel.year?.toString(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{vessel.name}</CardTitle>
        {makeModelYear && (
          <p className="text-sm text-muted-foreground">{makeModelYear}</p>
        )}
        {vessel.location && (
          <p className="text-sm text-muted-foreground">📍 {vessel.location}</p>
        )}
      </CardHeader>
      <CardContent>
        <Link href={`/vessels/${vessel.id}`}>
          <Button variant="outline" className="w-full">
            View
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [addVesselOpen, setAddVesselOpen] = useState(false);

  const { data: vessels, isLoading, error } = useQuery({
    queryKey: ["vessels"],
    queryFn: listVessels,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading vessels: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vessels</h1>
        <Button onClick={() => setAddVesselOpen(true)}>Add Vessel</Button>
      </div>

      {vessels && vessels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vessels.map((vessel) => (
            <VesselCard key={vessel.id} vessel={vessel} />
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              No vessels yet
            </p>
            <Button onClick={() => setAddVesselOpen(true)}>
              Add your first vessel
            </Button>
          </CardContent>
        </Card>
      )}

      <AddVesselDialog open={addVesselOpen} onOpenChange={setAddVesselOpen} />
    </div>
  );
}
