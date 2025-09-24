"""投资组合接口的基本集成测试"""
from __future__ import annotations

from typing import Generator

import sys
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.modules.setdefault("numpy", MagicMock())
sys.modules.setdefault("pandas", MagicMock())
sys.modules.setdefault("akshare", MagicMock())

from app.api.v1.endpoints import portfolio as portfolio_endpoint
from app.core.database import Base, get_db
from app.models import Fund


SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db() -> Generator:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    test_app = FastAPI()
    test_app.include_router(portfolio_endpoint.router, prefix="/api/v1/portfolio")

    Base.metadata.create_all(bind=engine)
    test_app.dependency_overrides[get_db] = _override_get_db

    with TestClient(test_app) as c:
        yield c
    test_app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_get_portfolio_empty(client: TestClient) -> None:
    response = client.get("/api/v1/portfolio/")

    assert response.status_code == 200
    payload = response.json()

    assert payload["summary"]["total_assets"] == 0
    assert payload["summary"]["total_cost"] == 0
    assert payload["holdings"] == []


def test_create_holding_returns_portfolio(client: TestClient) -> None:
    with TestingSessionLocal() as session:
        fund = Fund(
            code="000001",
            name="测试基金",
            fund_type="混合型",
            manager="测试经理",
            company="测试公司",
            current_nav=1.5,
            daily_return=0.25,
        )
        session.add(fund)
        session.commit()
        fund_id = fund.id

    response = client.post(
        "/api/v1/portfolio/holdings",
        json={"fund_id": fund_id, "shares": 1000, "cost": 1.2},
    )

    assert response.status_code == 201
    payload = response.json()
    summary = payload["summary"]
    holding = payload["holdings"][0]

    assert pytest.approx(summary["total_cost"], rel=1e-4) == 1200.0
    assert pytest.approx(summary["total_assets"], rel=1e-4) == 1500.0
    assert pytest.approx(summary["total_return"], rel=1e-4) == 300.0
    assert pytest.approx(summary["total_return_percent"], rel=1e-4) == 25.0
    assert pytest.approx(summary["day_return"], rel=1e-4) == 3.75
    assert pytest.approx(summary["day_return_percent"], rel=1e-4) == 0.25
    assert pytest.approx(holding["weight"], rel=1e-4) == 100.0

    assert holding["fund_code"] == "000001"
    assert pytest.approx(holding["market_value"], rel=1e-4) == 1500.0


def test_update_holding_recalculates_portfolio(client: TestClient) -> None:
    response = client.get("/api/v1/portfolio/")
    holding_id = response.json()["holdings"][0]["id"]

    update_response = client.put(
        f"/api/v1/portfolio/holdings/{holding_id}",
        json={"shares": 2000},
    )

    assert update_response.status_code == 200
    summary = update_response.json()["summary"]

    assert pytest.approx(summary["total_cost"], rel=1e-4) == 2400.0
    assert pytest.approx(summary["total_assets"], rel=1e-4) == 3000.0


def test_delete_holding_clears_portfolio(client: TestClient) -> None:
    response = client.get("/api/v1/portfolio/")
    holding_id = response.json()["holdings"][0]["id"]

    delete_response = client.delete(f"/api/v1/portfolio/holdings/{holding_id}")

    assert delete_response.status_code == 200
    payload = delete_response.json()

    assert payload["holdings"] == []
    assert payload["summary"]["total_assets"] == 0
