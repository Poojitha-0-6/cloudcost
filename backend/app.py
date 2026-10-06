from flask import Flask, jsonify, render_template, request

from backend.collectors.local_collector import LocalMetricsCollector
from backend.analysis.waste_score import WasteScoreEngine
from backend.analysis.classifier import ResourceClassifier
from backend.recommendations.engine import RecommendationEngine
from backend.database.history import HistoryDatabase


app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)

collector = LocalMetricsCollector()
waste_engine = WasteScoreEngine()
classifier = ResourceClassifier()
recommendation_engine = RecommendationEngine()
history_database = HistoryDatabase()


# ============================================================
# PAGE ROUTES
# ============================================================

@app.route("/")
def overview_page():
    return render_template(
        "overview.html",
        active_page="overview"
    )


@app.route("/resources")
def resources_page():
    return render_template(
        "resources.html",
        active_page="resources"
    )


@app.route("/resources/<resource_id>")
def resource_detail_page(resource_id):
    return render_template(
        "resource_detail.html",
        active_page="resources",
        resource_id=resource_id
    )


@app.route("/analytics")
def analytics_page():
    return render_template(
        "analytics.html",
        active_page="analytics"
    )


@app.route("/recommendations")
def recommendations_page():
    return render_template(
        "recommendations.html",
        active_page="recommendations"
    )


@app.route("/history")
def history_page():
    return render_template(
        "history.html",
        active_page="history"
    )


# ============================================================
# RESOURCE ANALYSIS
# ============================================================

def analyze_resource(resource):
    waste_result = waste_engine.calculate(resource)

    classification_result = classifier.classify(
        waste_result["waste_score"]
    )

    recommendation_result = recommendation_engine.generate(
        resource,
        classification_result,
        waste_result["waste_score"]
    )

    return (
        waste_result,
        classification_result,
        recommendation_result
    )


# ============================================================
# RESOURCE API
# ============================================================

@app.route("/api/resources")
def resources_api():

    metrics = collector.collect()
    results = []

    for resource in metrics:

        (
            waste_result,
            classification_result,
            recommendation_result
        ) = analyze_resource(resource)

        # Save observation to history
        history_database.save_analysis(
            resource,
            waste_result,
            classification_result,
            recommendation_result
        )

        resource_data = resource.to_dict()

        resource_data["waste_score"] = (
            waste_result["waste_score"]
        )

        resource_data["risk_level"] = (
            waste_result["risk_level"]
        )

        resource_data["waste_breakdown"] = (
            waste_result["breakdown"]
        )

        resource_data["classification"] = (
            classification_result["classification"]
        )

        resource_data["classification_description"] = (
            classification_result["description"]
        )

        resource_data["severity"] = (
            classification_result["severity"]
        )

        resource_data["recommendation"] = (
            recommendation_result["recommendation"]
        )

        resource_data["recommendation_priority"] = (
            recommendation_result["priority"]
        )

        resource_data["recommendation_action"] = (
            recommendation_result["action"]
        )

        resource_data["recommendation_reason"] = (
            recommendation_result["reason"]
        )

        results.append(resource_data)

    return jsonify(results)


# ============================================================
# HISTORY API
# ============================================================

@app.route("/api/history")
def history_api():

    resource_id = request.args.get("resource_id")

    try:
        limit = int(
            request.args.get("limit", 100)
        )
    except ValueError:
        limit = 100

    history_data = history_database.get_history(
        resource_id=resource_id,
        limit=limit
    )

    return jsonify(history_data)


@app.route("/api/history/<resource_id>")
def resource_history_api(resource_id):

    history_data = (
        history_database.get_resource_history(
            resource_id=resource_id,
            limit=100
        )
    )

    return jsonify(history_data)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "healthy",
        "service": "CloudCost Guardian",
        "phase": "7 - Sophisticated Dashboard"
    })


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )