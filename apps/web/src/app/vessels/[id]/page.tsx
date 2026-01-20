"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getVessel, updateVessel, type VesselUpdate } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { format } from "date-fns";

function OverviewTab({ vessel }: { vessel: any }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VesselUpdate>({
    location: vessel.location || null,
    description: vessel.description || null,
  });

  const updateMutation = useMutation({
    mutationFn: (data: VesselUpdate) => updateVessel(vessel.id, data),
    onSuccess: () => {
      toast.success("Vessel updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vessels", vessel.id] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update vessel");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      location: vessel.location || null,
      description: vessel.description || null,
    });
    setIsEditing(false);
  };

  const makeModelYear = [vessel.make, vessel.model, vessel.year?.toString()]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Details</CardTitle>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-base font-medium mt-1">{vessel.name}</p>
          </div>
          {makeModelYear && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Make / Model / Year
              </label>
              <p className="text-base mt-1">{makeModelYear}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Location
            </label>
            {isEditing ? (
              <Input
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value || null,
                  })
                }
                placeholder="Location"
                className="mt-1"
              />
            ) : (
              <p className="text-base mt-1">
                {vessel.location || "Not set"}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value || null,
                  })
                }
                placeholder="Description"
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-base mt-1 whitespace-pre-wrap">
                {vessel.description || "No description"}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="text-base mt-1">
              {format(new Date(vessel.created_at), "PPp")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Last Updated
            </label>
            <p className="text-base mt-1">
              {format(new Date(vessel.updated_at), "PPp")}
            </p>
          </div>
          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryTab() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Coming next: requirements + checks
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceTab() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Coming next: tasks + logs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsTab() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Coming next: notes</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VesselDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vesselId = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: vessel, isLoading, error } = useQuery({
    queryKey: ["vessels", vesselId],
    queryFn: () => getVessel(vesselId),
    enabled: !!vesselId && !isNaN(vesselId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading vessel: {error.message}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!vessel) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Vessel not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const makeModelYear = [vessel.make, vessel.model, vessel.year?.toString()]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div className="mt-2">
          <h1 className="text-3xl font-bold">{vessel.name}</h1>
          {makeModelYear && (
            <p className="text-lg text-muted-foreground mt-1">{makeModelYear}</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab vessel={vessel} />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
