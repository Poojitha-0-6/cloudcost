import pytest

from backend.app import app
from backend.analysis.waste_score import WasteScoreEngine
from backend.analysis.classifier import ResourceClassifier
from backend.recommendations.engine import RecommendationEngine
from backend.collectors.local_collector import LocalMetricsCollector
from backend.database.history import HistoryDatabase


# ============================================================
# TEST CONFIGURATION
# ============================================================

@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as test_client:
        yield test_client


@pytest.fixture
def sample_resource():
    collector = LocalMetricsCollector()
    resources = collector.collect()

    return resources[0]


@pytest.fixture
def engines():
    return (
        WasteScoreEngine(),
        ResourceClassifier(),
        RecommendationEngine()
    )


# ============================================================
# 9A — WASTE SCORE ENGINE TESTS
# ============================================================

def test_waste_score_range(sample_resource):

    engine = WasteScoreEngine()

    result = engine.calculate(sample_resource)

    assert 0 <= result["waste_score"] <= 100


def test_waste_score_contains_required_fields(sample_resource):

    engine = WasteScoreEngine()

    result = engine.calculate(sample_resource)

    assert "waste_score" in result
    assert "risk_level" in result
    assert "breakdown" in result


def test_waste_score_breakdown(sample_resource):

    engine = WasteScoreEngine()

    result = engine.calculate(sample_resource)

    breakdown = result["breakdown"]

    assert "cpu_factor" in breakdown
    assert "network_factor" in breakdown
    assert "activity_factor" in breakdown
    assert "runtime_factor" in breakdown


def test_high_cpu_reduces_waste_score():

    engine = WasteScoreEngine()

    resource = LocalMetricsCollector().collect()[0]

    normal_result = engine.calculate(resource)

    resource.cpu_utilization = 90

    high_cpu_result = engine.calculate(resource)

    assert high_cpu_result["waste_score"] < normal_result["waste_score"]


def test_low_cpu_increases_waste_score():

    engine = WasteScoreEngine()

    resource = LocalMetricsCollector().collect()[0]

    normal_result = engine.calculate(resource)

    resource.cpu_utilization = 2

    low_cpu_result = engine.calculate(resource)

    assert low_cpu_result["waste_score"] > normal_result["waste_score"]


# ============================================================
# 9B — CLASSIFICATION TESTS
# ============================================================

def test_active_classification():

    classifier = ResourceClassifier()

    result = classifier.classify(20)

    assert result["classification"] == "ACTIVE"
    assert result["severity"] == "LOW"


def test_monitor_classification():

    classifier = ResourceClassifier()

    result = classifier.classify(45)

    assert result["classification"] == "MONITOR"
    assert result["severity"] == "MEDIUM"


def test_underutilized_classification():

    classifier = ResourceClassifier()

    result = classifier.classify(70)

    assert result["classification"] == "UNDERUTILIZED"
    assert result["severity"] == "HIGH"


def test_high_waste_classification():

    classifier = ResourceClassifier()

    result = classifier.classify(90)

    assert result["classification"] == "HIGH WASTE RISK"
    assert result["severity"] == "CRITICAL"


def test_classification_boundary_30():

    classifier = ResourceClassifier()

    result = classifier.classify(30)

    assert result["classification"] == "ACTIVE"


def test_classification_boundary_60():

    classifier = ResourceClassifier()

    result = classifier.classify(60)

    assert result["classification"] == "MONITOR"


def test_classification_boundary_80():

    classifier = ResourceClassifier()

    result = classifier.classify(80)

    assert result["classification"] == "UNDERUTILIZED"


# ============================================================
# 9C — RECOMMENDATION ENGINE TESTS
# ============================================================

def test_active_recommendation():

    engine = RecommendationEngine()

    result = engine.generate(
        None,
        {"classification": "ACTIVE"},
        20
    )

    assert result["recommendation"] == "Continue running"
    assert result["priority"] == "LOW"


def test_monitor_recommendation():

    engine = RecommendationEngine()

    result = engine.generate(
        None,
        {"classification": "MONITOR"},
        45
    )

    assert result["recommendation"] == "Continue monitoring"
    assert result["priority"] == "MEDIUM"


def test_underutilized_recommendation():

    engine = RecommendationEngine()

    result = engine.generate(
        None,
        {"classification": "UNDERUTILIZED"},
        70
    )

    assert result["recommendation"] == (
        "Consider rightsizing or scheduling"
    )

    assert result["priority"] == "HIGH"


def test_high_waste_recommendation():

    engine = RecommendationEngine()

    result = engine.generate(
        None,
        {"classification": "HIGH WASTE RISK"},
        90
    )

    assert result["recommendation"] == (
        "Investigate and consider stopping"
    )

    assert result["priority"] == "CRITICAL"


# ============================================================
# 9D — DATABASE TESTS
# ============================================================

def test_database_initialization(tmp_path):

    database_path = tmp_path / "test_cloudcost.db"

    database = HistoryDatabase(
        database_path=database_path
    )

    assert database_path.exists()

    history = database.get_history()

    assert history == []


def test_database_save_and_retrieve(
    tmp_path,
    sample_resource
):

    database_path = tmp_path / "test_cloudcost.db"

    database = HistoryDatabase(
        database_path=database_path
    )

    waste_engine = WasteScoreEngine()
    classifier = ResourceClassifier()
    recommendation_engine = RecommendationEngine()

    waste_result = waste_engine.calculate(
        sample_resource
    )

    classification_result = classifier.classify(
        waste_result["waste_score"]
    )

    recommendation_result = recommendation_engine.generate(
        sample_resource,
        classification_result,
        waste_result["waste_score"]
    )

    database.save_analysis(
        sample_resource,
        waste_result,
        classification_result,
        recommendation_result
    )

    history = database.get_history()

    assert len(history) == 1

    assert history[0]["resource_id"] == (
        sample_resource.resource_id
    )

    assert history[0]["waste_score"] == (
        waste_result["waste_score"]
    )


def test_resource_history(
    tmp_path,
    sample_resource
):

    database_path = tmp_path / "test_cloudcost.db"

    database = HistoryDatabase(
        database_path=database_path
    )

    waste_engine = WasteScoreEngine()
    classifier = ResourceClassifier()
    recommendation_engine = RecommendationEngine()

    waste_result = waste_engine.calculate(
        sample_resource
    )

    classification_result = classifier.classify(
        waste_result["waste_score"]
    )

    recommendation_result = recommendation_engine.generate(
        sample_resource,
        classification_result,
        waste_result["waste_score"]
    )

    database.save_analysis(
        sample_resource,
        waste_result,
        classification_result,
        recommendation_result
    )

    history = database.get_resource_history(
        sample_resource.resource_id
    )

    assert len(history) == 1

    assert history[0]["resource_id"] == (
        sample_resource.resource_id
    )


# ============================================================
# 9E — API TESTS
# ============================================================

def test_health_api(client):

    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.get_json()

    assert data["status"] == "healthy"
    assert data["service"] == "CloudCost Guardian"


def test_resources_api(client):

    response = client.get("/api/resources")

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, list)

    assert len(data) == 4


def test_resources_api_fields(client):

    response = client.get("/api/resources")

    data = response.get_json()

    resource = data[0]

    assert "resource_id" in resource
    assert "cpu_utilization" in resource
    assert "network_activity" in resource
    assert "waste_score" in resource
    assert "risk_level" in resource
    assert "classification" in resource
    assert "recommendation" in resource


def test_history_api(client):

    response = client.get(
        "/api/history?limit=10"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, list)


def test_resource_history_api(client):

    response = client.get(
        "/api/history/EC2-APP-01"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert isinstance(data, list)


# ============================================================
# 9F — FULL PIPELINE INTEGRATION TEST
# ============================================================

def test_complete_analysis_pipeline(sample_resource):

    waste_engine = WasteScoreEngine()
    classifier = ResourceClassifier()
    recommendation_engine = RecommendationEngine()

    # Step 1 — Waste Score
    waste_result = waste_engine.calculate(
        sample_resource
    )

    assert 0 <= waste_result["waste_score"] <= 100

    # Step 2 — Classification
    classification_result = classifier.classify(
        waste_result["waste_score"]
    )

    assert "classification" in classification_result

    # Step 3 — Recommendation
    recommendation_result = recommendation_engine.generate(
        sample_resource,
        classification_result,
        waste_result["waste_score"]
    )

    assert "recommendation" in recommendation_result
    assert "priority" in recommendation_result
    assert "reason" in recommendation_result

    # Final pipeline validation
    assert classification_result["classification"] is not None
    assert recommendation_result["recommendation"] is not None