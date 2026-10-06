class WasteScoreEngine:
    """
    Calculates a resource waste score from multiple utilization signals.

    Score:
        0   = very low waste risk
        100 = very high waste risk
    """

    def __init__(
        self,
        cpu_weight=0.30,
        network_weight=0.20,
        activity_weight=0.20,
        runtime_weight=0.30
    ):
        self.cpu_weight = cpu_weight
        self.network_weight = network_weight
        self.activity_weight = activity_weight
        self.runtime_weight = runtime_weight

    def calculate_cpu_factor(self, cpu_utilization):
        """
        Low CPU utilization increases waste risk.
        """

        cpu = max(0, min(cpu_utilization, 100))

        return 100 - cpu

    def calculate_network_factor(self, network_activity):
        """
        Low network activity increases waste risk.

        200 MB is treated as a high-activity reference
        for the local prototype.
        """

        network = max(0, min(network_activity, 200))

        return 100 - (network / 200 * 100)

    def calculate_activity_factor(self, application_activity):
        """
        Converts application activity into a waste factor.
        """

        activity = application_activity.lower()

        if activity == "high":
            return 10

        if activity == "medium":
            return 50

        return 90

    def calculate_runtime_factor(self, running_hours):
        """
        Longer runtime increases the potential waste impact.

        12 hours is used as the reference point
        for this prototype.
        """

        hours = max(0, running_hours)

        return min((hours / 12) * 100, 100)

    def calculate(self, resource):

        cpu_factor = self.calculate_cpu_factor(
            resource.cpu_utilization
        )

        network_factor = self.calculate_network_factor(
            resource.network_activity
        )

        activity_factor = self.calculate_activity_factor(
            resource.application_activity
        )

        runtime_factor = self.calculate_runtime_factor(
            resource.running_hours
        )

        # Calculate individual weighted contributions
        cpu_contribution = cpu_factor * self.cpu_weight
        network_contribution = network_factor * self.network_weight
        activity_contribution = activity_factor * self.activity_weight
        runtime_contribution = runtime_factor * self.runtime_weight

        score = (
            cpu_contribution
            + network_contribution
            + activity_contribution
            + runtime_contribution
        )

        score = round(max(0, min(score, 100)), 1)

        # Determine risk level
        if score <= 30:
            risk_level = "LOW"
        elif score <= 60:
            risk_level = "MEDIUM"
        elif score <= 80:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        return {
            "waste_score": score,
            "risk_level": risk_level,

            "breakdown": {
                "cpu_factor": round(cpu_factor, 1),
                "network_factor": round(network_factor, 1),
                "activity_factor": round(activity_factor, 1),
                "runtime_factor": round(runtime_factor, 1),

                "cpu_contribution": round(cpu_contribution, 1),
                "network_contribution": round(network_contribution, 1),
                "activity_contribution": round(activity_contribution, 1),
                "runtime_contribution": round(runtime_contribution, 1)
            }
        }