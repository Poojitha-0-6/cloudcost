class ResourceClassifier:
    """
    Converts a Waste Score into a meaningful
    resource utilization classification.
    """

    def classify(self, waste_score):

        if waste_score <= 30:
            return {
                "classification": "ACTIVE",
                "description": "Resource appears to be actively utilized.",
                "severity": "LOW"
            }

        elif waste_score <= 60:
            return {
                "classification": "MONITOR",
                "description": "Resource shows moderate waste indicators and should be monitored.",
                "severity": "MEDIUM"
            }

        elif waste_score <= 80:
            return {
                "classification": "UNDERUTILIZED",
                "description": "Resource is showing signs of underutilization.",
                "severity": "HIGH"
            }

        else:
            return {
                "classification": "HIGH WASTE RISK",
                "description": "Resource shows strong indicators of potential waste.",
                "severity": "CRITICAL"
            }
        