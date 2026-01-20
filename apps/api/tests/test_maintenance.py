"""Tests for maintenance endpoints."""
import pytest
from fastapi import status
from datetime import datetime, timezone, timedelta


class TestListMaintenanceTasks:
    """Tests for GET /api/vessels/{vessel_id}/maintenance/tasks endpoint."""

    def test_list_tasks_empty(self, client, db_session):
        """Test listing tasks when none exist."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        response = client.get(f"/api/vessels/{vessel.id}/maintenance/tasks")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_tasks_with_data(self, client, db_session):
        """Test listing tasks when some exist."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task1 = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        task2 = MaintenanceTask(
            vessel_id=vessel.id,
            name="Annual Inspection",
            cadence_type=MaintenanceCadenceType.SPECIFIC_DATE,
            due_date=datetime.now(timezone.utc) + timedelta(days=60),
            next_due_at=datetime.now(timezone.utc) + timedelta(days=60),
        )
        db_session.add_all([task1, task2])
        db_session.commit()

        response = client.get(f"/api/vessels/{vessel.id}/maintenance/tasks")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert {task["name"] for task in data} == {"Oil Change", "Annual Inspection"}

    def test_list_tasks_vessel_not_found(self, client):
        """Test listing tasks for non-existent vessel."""
        response = client.get("/api/vessels/999/maintenance/tasks")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_tasks_vessel_from_other_org(self, client, db_session):
        """Test that tasks from other org vessels cannot be accessed."""
        from app.models import Organization, Vessel

        org2 = Organization(id=2, name="Other Org")
        db_session.add(org2)
        db_session.commit()

        vessel = Vessel(org_id=2, name="Other Org Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        response = client.get(f"/api/vessels/{vessel.id}/maintenance/tasks")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateMaintenanceTask:
    """Tests for POST /api/vessels/{vessel_id}/maintenance/tasks endpoint."""

    def test_create_task_interval(self, client, db_session):
        """Test creating an interval-based task."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {
            "name": "Oil Change",
            "description": "Change engine oil",
            "cadence_type": "interval",
            "interval_days": 90,
            "critical": True,
        }
        response = client.post(
            f"/api/vessels/{vessel.id}/maintenance/tasks", json=payload
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Oil Change"
        assert data["cadence_type"] == "interval"
        assert data["interval_days"] == 90
        assert data["critical"] is True
        assert data["is_active"] is True
        assert data["next_due_at"] is not None

    def test_create_task_specific_date(self, client, db_session):
        """Test creating a specific date-based task."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        due_date = datetime.now(timezone.utc) + timedelta(days=60)
        payload = {
            "name": "Annual Inspection",
            "cadence_type": "specific_date",
            "due_date": due_date.isoformat(),
        }
        response = client.post(
            f"/api/vessels/{vessel.id}/maintenance/tasks", json=payload
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Annual Inspection"
        assert data["cadence_type"] == "specific_date"
        assert data["due_date"] is not None

    def test_create_task_interval_missing_days(self, client, db_session):
        """Test that interval_days is required for interval cadence."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {
            "name": "Oil Change",
            "cadence_type": "interval",
        }
        response = client.post(
            f"/api/vessels/{vessel.id}/maintenance/tasks", json=payload
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "interval_days" in response.json()["detail"].lower()

    def test_create_task_specific_date_missing_date(self, client, db_session):
        """Test that due_date is required for specific_date cadence."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {
            "name": "Annual Inspection",
            "cadence_type": "specific_date",
        }
        response = client.post(
            f"/api/vessels/{vessel.id}/maintenance/tasks", json=payload
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "due_date" in response.json()["detail"].lower()

    def test_create_task_validation_name_required(self, client, db_session):
        """Test that name is required."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {"cadence_type": "interval", "interval_days": 90}
        response = client.post(
            f"/api/vessels/{vessel.id}/maintenance/tasks", json=payload
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_task_vessel_not_found(self, client):
        """Test creating task for non-existent vessel."""
        payload = {
            "name": "Oil Change",
            "cadence_type": "interval",
            "interval_days": 90,
        }
        response = client.post("/api/vessels/999/maintenance/tasks", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateMaintenanceTask:
    """Tests for PATCH /api/maintenance/tasks/{task_id} endpoint."""

    def test_update_task_single_field(self, client, db_session):
        """Test updating a single field."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"name": "Engine Oil Change"}
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Engine Oil Change"
        assert data["interval_days"] == 90  # Unchanged

    def test_update_task_multiple_fields(self, client, db_session):
        """Test updating multiple fields."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            critical=False,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {
            "name": "Engine Oil Change",
            "description": "Change engine oil and filter",
            "interval_days": 120,
            "critical": True,
        }
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Engine Oil Change"
        assert data["description"] == "Change engine oil and filter"
        assert data["interval_days"] == 120
        assert data["critical"] is True

    def test_update_task_change_cadence_to_interval(self, client, db_session):
        """Test changing cadence type to interval."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Inspection",
            cadence_type=MaintenanceCadenceType.SPECIFIC_DATE,
            due_date=datetime.now(timezone.utc) + timedelta(days=60),
            next_due_at=datetime.now(timezone.utc) + timedelta(days=60),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {
            "cadence_type": "interval",
            "interval_days": 180,
        }
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["cadence_type"] == "interval"
        assert data["interval_days"] == 180
        assert data["next_due_at"] is not None

    def test_update_task_change_cadence_missing_interval_days(self, client, db_session):
        """Test that changing to interval requires interval_days."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Inspection",
            cadence_type=MaintenanceCadenceType.SPECIFIC_DATE,
            due_date=datetime.now(timezone.utc) + timedelta(days=60),
            next_due_at=datetime.now(timezone.utc) + timedelta(days=60),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"cadence_type": "interval"}
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_task_set_inactive(self, client, db_session):
        """Test setting task to inactive."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            is_active=True,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"is_active": False}
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_active"] is False

    def test_update_task_not_found(self, client):
        """Test updating a non-existent task."""
        payload = {"name": "Updated"}
        response = client.patch("/api/maintenance/tasks/999", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_task_from_other_org(self, client, db_session):
        """Test that tasks from other org vessels cannot be updated."""
        from app.models import Organization, Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        org2 = Organization(id=2, name="Other Org")
        db_session.add(org2)
        db_session.commit()

        vessel = Vessel(org_id=2, name="Other Org Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Other Org Task",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"name": "Hacked Name"}
        response = client.patch(f"/api/maintenance/tasks/{task.id}", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateMaintenanceLog:
    """Tests for POST /api/maintenance/tasks/{task_id}/logs endpoint."""

    def test_create_log_success(self, client, db_session):
        """Test creating a maintenance log."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"notes": "Oil changed successfully"}
        response = client.post(f"/api/maintenance/tasks/{task.id}/logs", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["maintenance_task_id"] == task.id
        assert data["performed_by_user_id"] == 1
        assert data["notes"] == "Oil changed successfully"
        assert data["performed_at"] is not None

    def test_create_log_updates_next_due_at_interval(self, client, db_session):
        """Test that creating a log updates next_due_at for interval tasks."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        original_next_due = datetime.now(timezone.utc) + timedelta(days=30)
        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=original_next_due,
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"notes": "Oil changed"}
        response = client.post(f"/api/maintenance/tasks/{task.id}/logs", json=payload)
        assert response.status_code == status.HTTP_201_CREATED

        # Verify next_due_at was updated
        from sqlalchemy import select
        updated_task = (
            db_session.execute(select(MaintenanceTask).where(MaintenanceTask.id == task.id))
            .scalars()
            .one()
        )
        # next_due_at should be approximately 90 days from now
        assert updated_task.next_due_at is not None
        assert updated_task.next_due_at > original_next_due

    def test_create_log_with_custom_performed_at(self, client, db_session):
        """Test creating a log with custom performed_at date."""
        from app.models import Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Oil Change",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        custom_date = datetime.now(timezone.utc) - timedelta(days=1)
        payload = {
            "notes": "Backdated log",
            "performed_at": custom_date.isoformat(),
        }
        response = client.post(f"/api/maintenance/tasks/{task.id}/logs", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        # Verify the custom date was used
        performed_at = datetime.fromisoformat(data["performed_at"].replace("Z", "+00:00"))
        assert abs((performed_at - custom_date).total_seconds()) < 1

    def test_create_log_task_not_found(self, client):
        """Test creating log for non-existent task."""
        payload = {"notes": "Test"}
        response = client.post("/api/maintenance/tasks/999/logs", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_log_task_from_other_org(self, client, db_session):
        """Test that logs cannot be created for other org tasks."""
        from app.models import Organization, Vessel, MaintenanceTask
        from app.models import MaintenanceCadenceType

        org2 = Organization(id=2, name="Other Org")
        db_session.add(org2)
        db_session.commit()

        vessel = Vessel(org_id=2, name="Other Org Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        task = MaintenanceTask(
            vessel_id=vessel.id,
            name="Other Org Task",
            cadence_type=MaintenanceCadenceType.INTERVAL,
            interval_days=90,
            next_due_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)

        payload = {"notes": "Test"}
        response = client.post(f"/api/maintenance/tasks/{task.id}/logs", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
