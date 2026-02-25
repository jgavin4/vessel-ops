"use client";

import { useAuth } from "@clerk/nextjs";
import { useOrg } from "@/contexts/org-context";
import * as api from "@/lib/api";

/**
 * Hook that provides API functions using authedFetch: Clerk JWT via getToken(),
 * Authorization Bearer, cache: no-store, and optional 401 retry.
 */
export function useApi() {
  const { getToken } = useAuth();
  const { orgId } = useOrg();

  return {
    // Vessels
    listVessels: () =>
      api.authedFetch<api.Vessel[]>(getToken, "/api/vessels", {}, orgId),
    getVessel: (id: number) =>
      api.authedFetch<api.Vessel>(getToken, `/api/vessels/${id}`, {}, orgId),
    createVessel: (data: api.VesselCreate) =>
      api.authedFetch<api.Vessel>(getToken, "/api/vessels", {
        method: "POST",
        body: JSON.stringify(data),
      }, orgId),
    updateVessel: (id: number, data: api.VesselUpdate) =>
      api.authedFetch<api.Vessel>(getToken, `/api/vessels/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }, orgId),
    // Inventory
    listInventoryRequirements: (vesselId: number) =>
      api.authedFetch<api.InventoryRequirement[]>(
        getToken,
        `/api/vessels/${vesselId}/inventory/requirements`,
        {},
        orgId
      ),
    createInventoryRequirement: (vesselId: number, data: api.InventoryRequirementCreate) =>
      api.authedFetch<api.InventoryRequirement>(
        getToken,
        `/api/vessels/${vesselId}/inventory/requirements`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    updateInventoryRequirement: (id: number, data: api.InventoryRequirementUpdate) =>
      api.authedFetch<api.InventoryRequirement>(
        getToken,
        `/api/inventory/requirements/${id}`,
        { method: "PATCH", body: JSON.stringify(data) },
        orgId
      ),
    deleteInventoryRequirement: (id: number) =>
      api.authedFetch<void>(getToken, `/api/inventory/requirements/${id}`, { method: "DELETE" }, orgId),
    getRequirementHistory: (requirementId: number) =>
      api.authedFetch<api.InventoryCheckLine[]>(
        getToken,
        `/api/inventory/requirements/${requirementId}/history`,
        {},
        orgId
      ),
    // Inventory Groups
    listInventoryGroups: (vesselId: number) =>
      api.authedFetch<api.InventoryGroup[]>(
        getToken,
        `/api/vessels/${vesselId}/inventory/groups`,
        {},
        orgId
      ),
    createInventoryGroup: (vesselId: number, data: api.InventoryGroupCreate) =>
      api.authedFetch<api.InventoryGroup>(
        getToken,
        `/api/vessels/${vesselId}/inventory/groups`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    updateInventoryGroup: (id: number, data: api.InventoryGroupUpdate) =>
      api.authedFetch<api.InventoryGroup>(
        getToken,
        `/api/inventory/groups/${id}`,
        { method: "PATCH", body: JSON.stringify(data) },
        orgId
      ),
    deleteInventoryGroup: (id: number) =>
      api.authedFetch<void>(getToken, `/api/inventory/groups/${id}`, { method: "DELETE" }, orgId),
    reorderInventoryGroups: (vesselId: number, groupIds: number[]) =>
      api.authedFetch<void>(
        getToken,
        `/api/vessels/${vesselId}/inventory/groups/reorder`,
        { method: "PUT", body: JSON.stringify({ group_ids: groupIds }) },
        orgId
      ),
    reorderInventoryItems: (
      vesselId: number,
      groupId: number | null,
      itemIds: number[]
    ) =>
      api.authedFetch<void>(
        getToken,
        `/api/vessels/${vesselId}/inventory/items/reorder`,
        { method: "PUT", body: JSON.stringify({ group_id: groupId, item_ids: itemIds }) },
        orgId
      ),
    listInventoryChecks: (vesselId: number) =>
      api.authedFetch<api.InventoryCheck[]>(
        getToken,
        `/api/vessels/${vesselId}/inventory/checks`,
        {},
        orgId
      ),
    getInventoryCheck: (id: number) =>
      api.authedFetch<api.InventoryCheck>(getToken, `/api/inventory/checks/${id}`, {}, orgId),
    createInventoryCheck: (vesselId: number, data: api.InventoryCheckCreate) =>
      api.authedFetch<api.InventoryCheck>(
        getToken,
        `/api/vessels/${vesselId}/inventory/checks`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    updateInventoryCheckLines: (checkId: number, data: api.InventoryCheckLinesBulkUpdate) =>
      api.authedFetch<api.InventoryCheck>(
        getToken,
        `/api/inventory/checks/${checkId}/lines`,
        { method: "PUT", body: JSON.stringify(data) },
        orgId
      ),
    submitInventoryCheck: (checkId: number) =>
      api.authedFetch<api.InventoryCheck>(
        getToken,
        `/api/inventory/checks/${checkId}/submit`,
        { method: "POST" },
        orgId
      ),
    // Maintenance
    listMaintenanceTasks: (vesselId: number) =>
      api.authedFetch<api.MaintenanceTask[]>(
        getToken,
        `/api/vessels/${vesselId}/maintenance/tasks`,
        {},
        orgId
      ),
    createMaintenanceTask: (vesselId: number, data: api.MaintenanceTaskCreate) =>
      api.authedFetch<api.MaintenanceTask>(
        getToken,
        `/api/vessels/${vesselId}/maintenance/tasks`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    updateMaintenanceTask: (taskId: number, data: api.MaintenanceTaskUpdate) =>
      api.authedFetch<api.MaintenanceTask>(
        getToken,
        `/api/maintenance/tasks/${taskId}`,
        { method: "PATCH", body: JSON.stringify(data) },
        orgId
      ),
    reorderMaintenanceTasks: (vesselId: number, taskIds: number[]) =>
      api.authedFetch<void>(
        getToken,
        `/api/vessels/${vesselId}/maintenance/tasks/reorder`,
        { method: "PUT", body: JSON.stringify({ task_ids: taskIds }) },
        orgId
      ),
    createMaintenanceLog: (taskId: number, data: api.MaintenanceLogCreate) =>
      api.authedFetch<api.MaintenanceLog>(
        getToken,
        `/api/maintenance/tasks/${taskId}/logs`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    listMaintenanceLogs: (taskId: number) =>
      api.authedFetch<api.MaintenanceLog[]>(
        getToken,
        `/api/maintenance/tasks/${taskId}/logs`,
        {},
        orgId
      ),
    // Trips
    getVesselTotalHours: (vesselId: number) =>
      api.authedFetch<api.VesselTotalHours>(
        getToken,
        `/api/vessels/${vesselId}/total-hours`,
        {},
        orgId
      ),
    listTrips: (vesselId: number, limit?: number) =>
      api.authedFetch<api.Trip[]>(
        getToken,
        `/api/vessels/${vesselId}/trips${limit != null ? `?limit=${limit}` : ""}`,
        {},
        orgId
      ),
    createTrip: (vesselId: number, data: api.TripCreate) =>
      api.authedFetch<api.Trip>(
        getToken,
        `/api/vessels/${vesselId}/trips`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    updateTrip: (vesselId: number, tripId: string, data: api.TripUpdate) =>
      api.authedFetch<api.Trip>(
        getToken,
        `/api/vessels/${vesselId}/trips/${tripId}`,
        { method: "PATCH", body: JSON.stringify(data) },
        orgId
      ),
    deleteTrip: (vesselId: number, tripId: string) =>
      api.authedFetch<void>(
        getToken,
        `/api/vessels/${vesselId}/trips/${tripId}`,
        { method: "DELETE" },
        orgId
      ),
    // Comments
    listVesselComments: (vesselId: number) =>
      api.authedFetch<api.VesselComment[]>(
        getToken,
        `/api/vessels/${vesselId}/comments`,
        {},
        orgId
      ),
    createVesselComment: (vesselId: number, data: api.VesselCommentCreate) =>
      api.authedFetch<api.VesselComment>(
        getToken,
        `/api/vessels/${vesselId}/comments`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    // Orgs (no orgId needed for these)
    createOrg: (data: { name: string; force?: boolean }) =>
      api.authedFetch<api.Organization>(getToken, "/api/orgs", {
        method: "POST",
        body: JSON.stringify(data),
      }, null),
    listOrgs: () =>
      api.authedFetch<api.Organization[]>(getToken, "/api/orgs", {}, null),
    getMe: () =>
      api.authedFetch<api.Me>(getToken, "/api/me", {}, null),
    listOrgMembers: (orgId: number) =>
      api.authedFetch<api.OrgMembership[]>(getToken, `/api/orgs/${orgId}/members`, {}, orgId),
    createOrgInvite: (orgId: number, data: api.OrgInviteCreate) =>
      api.authedFetch<api.OrgInvite>(getToken, `/api/orgs/${orgId}/invites`, {
        method: "POST",
        body: JSON.stringify(data),
      }, orgId),
    acceptInvite: (data: api.OrgInviteAccept) =>
      api.authedFetch<api.OrgMembership>(getToken, "/api/orgs/invites/accept", {
        method: "POST",
        body: JSON.stringify(data),
      }, null),
    updateMemberRole: (orgId: number, userId: number, data: api.MemberRoleUpdate) =>
      api.authedFetch<api.OrgMembership>(
        getToken,
        `/api/orgs/${orgId}/members/${userId}/role`,
        { method: "POST", body: JSON.stringify(data) },
        orgId
      ),
    disableMember: (orgId: number, userId: number) =>
      api.authedFetch<api.OrgMembership>(
        getToken,
        `/api/orgs/${orgId}/members/${userId}/disable`,
        { method: "POST" },
        orgId
      ),
    // Organization Requests
    createOrgRequest: (data: { org_name: string }) =>
      api.authedFetch<api.OrganizationRequest>(getToken, "/api/orgs/requests", {
        method: "POST",
        body: JSON.stringify(data),
      }, null),
    listOrgRequests: () =>
      api.authedFetch<api.OrganizationRequest[]>(getToken, "/api/orgs/requests", {}, null),
    reviewOrgRequest: (requestId: number, data: { status: string; review_notes?: string }) =>
      api.authedFetch<api.OrganizationRequest>(
        getToken,
        `/api/orgs/requests/${requestId}/review`,
        { method: "POST", body: JSON.stringify(data) },
        null
      ),
    // Import
    importVessels: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.authedFetch<api.ImportResult>(
        getToken,
        "/api/import/vessels",
        { method: "POST", body: formData },
        orgId
      );
    },
    importInventoryRequirements: (vesselId: number, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.authedFetch<api.ImportResult>(
        getToken,
        `/api/import/vessels/${vesselId}/inventory-requirements`,
        { method: "POST", body: formData },
        orgId
      );
    },
    importMaintenanceTasks: (vesselId: number, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.authedFetch<api.ImportResult>(
        getToken,
        `/api/import/vessels/${vesselId}/maintenance-tasks`,
        { method: "POST", body: formData },
        orgId
      );
    },
    // Super Admin endpoints
    listAllOrgs: () =>
      api.authedFetch<api.Organization[]>(getToken, "/api/admin/orgs", {}, null),
    toggleOrgStatus: (orgId: number) =>
      api.authedFetch<api.Organization>(
        getToken,
        `/api/admin/orgs/${orgId}/toggle-status`,
        { method: "POST" },
        null
      ),
    listAllUsers: () =>
      api.authedFetch<api.User[]>(getToken, "/api/admin/users", {}, null),
    listAllOrgRequests: () =>
      api.authedFetch<api.OrganizationRequest[]>(getToken, "/api/admin/orgs/requests", {}, null),
    reviewOrgRequestSuperAdmin: (requestId: number, data: { status: string; review_notes?: string }) =>
      api.authedFetch<api.OrganizationRequest>(
        getToken,
        `/api/admin/orgs/requests/${requestId}/review`,
        { method: "POST", body: JSON.stringify(data) },
        null
      ),
    // Internal super admin endpoints
    searchOrgs: (query?: string) =>
      api.authedFetch<api.Organization[]>(
        getToken,
        `/api/internal/orgs${query ? `?query=${encodeURIComponent(query)}` : ""}`,
        {},
        null
      ),
    updateBillingOverride: (orgId: number, data: {
      billing_override_enabled?: boolean;
      billing_override_vessel_limit?: number | null;
      billing_override_expires_at?: string | null;
      billing_override_reason?: string | null;
    }) =>
      api.authedFetch<api.Organization>(
        getToken,
        `/api/internal/orgs/${orgId}/billing-override`,
        { method: "PATCH", body: JSON.stringify(data) },
        null
      ),
    // Org admin billing endpoint
    getOrgBilling: (orgId: number) =>
      api.authedFetch<{
        org_id: number;
        org_name: string;
        subscription_plan: string | null;
        subscription_status: string | null;
        vessel_usage: { current: number; limit: number | null };
        billing_override: { active: boolean; expires_at: string | null };
        effective_entitlement: { is_active: boolean; vessel_limit: number | null };
      }>(getToken, `/api/orgs/${orgId}/billing`, {}, orgId),
    // Billing endpoints
    getBillingStatus: () =>
      api.authedFetch<{
        org_id: number;
        org_name: string;
        plan: string | null;
        status: string | null;
        current_period_end: string | null;
        addon_pack_quantity: number;
        base_vessels_included: number;
        vessels_per_pack: number;
        vessel_limit: number | null;
        effective_vessel_limit: number | null;
        vessel_usage: { current: number; limit: number | null };
        billing_override: { active: boolean; expires_at: string | null };
      }>(getToken, "/api/billing/status", {}, orgId),
    createCheckoutSession: (pack_quantity: number) =>
      api.authedFetch<{ url: string }>(getToken, "/api/billing/checkout-session", {
        method: "POST",
        body: JSON.stringify({ pack_quantity }),
      }, orgId),
    updateVesselPacks: (pack_quantity: number) =>
      api.authedFetch<{ status: string; pack_quantity: number }>(
        getToken,
        "/api/billing/update-vessel-packs",
        { method: "POST", body: JSON.stringify({ pack_quantity }) },
        orgId
      ),
    createPortalSession: () =>
      api.authedFetch<{ url: string }>(getToken, "/api/billing/portal", { method: "POST" }, orgId),
  };
}
