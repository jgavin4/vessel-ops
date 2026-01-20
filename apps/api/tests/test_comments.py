"""Tests for vessel comment endpoints."""
import pytest
from fastapi import status


class TestListComments:
    """Tests for GET /api/vessels/{vessel_id}/comments endpoint."""

    def test_list_comments_empty(self, client, db_session):
        """Test listing comments when none exist."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        response = client.get(f"/api/vessels/{vessel.id}/comments")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_comments_with_data(self, client, db_session):
        """Test listing comments when some exist."""
        from app.models import Vessel, VesselComment

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        comment1 = VesselComment(
            vessel_id=vessel.id, user_id=1, body="First comment"
        )
        comment2 = VesselComment(
            vessel_id=vessel.id, user_id=1, body="Second comment"
        )
        db_session.add_all([comment1, comment2])
        db_session.commit()

        response = client.get(f"/api/vessels/{vessel.id}/comments")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        # Should be ordered by created_at desc (newest first)
        assert data[0]["body"] == "Second comment"
        assert data[1]["body"] == "First comment"

    def test_list_comments_vessel_not_found(self, client):
        """Test listing comments for non-existent vessel."""
        response = client.get("/api/vessels/999/comments")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_comments_vessel_from_other_org(self, client, db_session):
        """Test that comments from other org vessels cannot be accessed."""
        from app.models import Organization, Vessel

        org2 = Organization(id=2, name="Other Org")
        db_session.add(org2)
        db_session.commit()

        vessel = Vessel(org_id=2, name="Other Org Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        response = client.get(f"/api/vessels/{vessel.id}/comments")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateComment:
    """Tests for POST /api/vessels/{vessel_id}/comments endpoint."""

    def test_create_comment_success(self, client, db_session):
        """Test creating a comment."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {"body": "This is a test comment"}
        response = client.post(f"/api/vessels/{vessel.id}/comments", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["body"] == "This is a test comment"
        assert data["vessel_id"] == vessel.id
        assert data["user_id"] == 1  # From auth context
        assert data["id"] is not None
        assert data["created_at"] is not None

    def test_create_comment_long_body(self, client, db_session):
        """Test creating a comment with a long body."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        long_body = "This is a very long comment. " * 100
        payload = {"body": long_body}
        response = client.post(f"/api/vessels/{vessel.id}/comments", json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["body"] == long_body

    def test_create_comment_validation_empty_body(self, client, db_session):
        """Test that body cannot be empty."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {"body": ""}
        response = client.post(f"/api/vessels/{vessel.id}/comments", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_comment_validation_body_required(self, client, db_session):
        """Test that body is required."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {}
        response = client.post(f"/api/vessels/{vessel.id}/comments", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_comment_vessel_not_found(self, client):
        """Test creating comment for non-existent vessel."""
        payload = {"body": "Test comment"}
        response = client.post("/api/vessels/999/comments", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_comment_vessel_from_other_org(self, client, db_session):
        """Test that comments cannot be created for other org vessels."""
        from app.models import Organization, Vessel

        org2 = Organization(id=2, name="Other Org")
        db_session.add(org2)
        db_session.commit()

        vessel = Vessel(org_id=2, name="Other Org Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        payload = {"body": "Test comment"}
        response = client.post(f"/api/vessels/{vessel.id}/comments", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_multiple_comments(self, client, db_session):
        """Test creating multiple comments for the same vessel."""
        from app.models import Vessel

        vessel = Vessel(org_id=1, name="Test Vessel")
        db_session.add(vessel)
        db_session.commit()
        db_session.refresh(vessel)

        # Create first comment
        payload1 = {"body": "First comment"}
        response1 = client.post(f"/api/vessels/{vessel.id}/comments", json=payload1)
        assert response1.status_code == status.HTTP_201_CREATED

        # Create second comment
        payload2 = {"body": "Second comment"}
        response2 = client.post(f"/api/vessels/{vessel.id}/comments", json=payload2)
        assert response2.status_code == status.HTTP_201_CREATED

        # List comments - should have both, newest first
        response = client.get(f"/api/vessels/{vessel.id}/comments")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["body"] == "Second comment"
        assert data[1]["body"] == "First comment"
