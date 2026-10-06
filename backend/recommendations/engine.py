class RecommendationEngine:
    """
    Generates safe and explainable recommendations
    based on resource classification and waste score.

    The engine only recommends actions.
    It does not automatically modify or terminate resources.
    """

    def generate(
        self,
        resource,
        classification_result,
        waste_score
    ):

        classification = classification_result["classification"]

        if classification == "ACTIVE":

            return {
                "recommendation": "Continue running",
                "priority": "LOW",
                "action": "No immediate action required.",
                "reason": (
                    "The resource shows healthy utilization "
                    "and does not currently indicate significant waste."
                )
            }

        elif classification == "MONITOR":

            return {
                "recommendation": "Continue monitoring",
                "priority": "MEDIUM",
                "action": (
                    "Monitor utilization before taking action."
                ),
                "reason": (
                    "The resource shows moderate waste indicators. "
                    "More observations are recommended before optimization."
                )
            }

        elif classification == "UNDERUTILIZED":

            return {
                "recommendation": (
                    "Consider rightsizing or scheduling"
                ),
                "priority": "HIGH",
                "action": (
                    "Review the resource configuration and "
                    "consider reducing capacity or scheduling usage."
                ),
                "reason": (
                    f"The resource has a Waste Score of {waste_score}, "
                    "indicating sustained underutilization."
                )
            }

        elif classification == "HIGH WASTE RISK":

            return {
                "recommendation": (
                    "Investigate and consider stopping"
                ),
                "priority": "CRITICAL",
                "action": (
                    "Verify workload requirements before stopping "
                    "or changing the resource."
                ),
                "reason": (
                    f"The resource has a high Waste Score of {waste_score}. "
                    "Its utilization pattern indicates a strong potential "
                    "for unnecessary resource consumption."
                )
            }

        return {
            "recommendation": "Review resource",
            "priority": "MEDIUM",
            "action": "Review the resource manually.",
            "reason": (
                "No specific classification rule was matched."
            )
        }