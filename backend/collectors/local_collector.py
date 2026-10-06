from datetime import datetime
from typing import List

from backend.models.resource import ResourceMetrics


class LocalMetricsCollector:
    """Provides realistic local/simulated resource metrics.

    The output follows the same ResourceMetrics model that the future
    AWS/CloudWatch collector will use.
    """

    def collect(self) -> List[ResourceMetrics]:
        now = datetime.now().isoformat(timespec="seconds")

        return [
            ResourceMetrics(
                resource_id="EC2-APP-01",
                resource_type="EC2",
                region="ap-south-1",
                state="Running",
                cpu_utilization=67.2,
                network_activity=184.0,
                application_activity="High",
                running_hours=6.7,
                timestamp=now,
            ),
            ResourceMetrics(
                resource_id="EC2-APP-02",
                resource_type="EC2",
                region="ap-south-1",
                state="Running",
                cpu_utilization=14.8,
                network_activity=22.5,
                application_activity="Low",
                running_hours=5.4,
                timestamp=now,
            ),
            ResourceMetrics(
                resource_id="EC2-DEV-01",
                resource_type="EC2",
                region="ap-south-1",
                state="Running",
                cpu_utilization=3.4,
                network_activity=2.1,
                application_activity="Low",
                running_hours=11.2,
                timestamp=now,
            ),
            ResourceMetrics(
                resource_id="EC2-API-01",
                resource_type="EC2",
                region="ap-south-1",
                state="Running",
                cpu_utilization=8.1,
                network_activity=176.0,
                application_activity="High",
                running_hours=4.8,
                timestamp=now,
            ),
        ]
