from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any


@dataclass
class ResourceMetrics:
    resource_id: str
    resource_type: str
    region: str
    state: str
    cpu_utilization: float
    network_activity: float
    application_activity: str
    running_hours: float
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @property
    def activity_level(self) -> str:
        activity = self.application_activity.lower()
        if activity == "high":
            return "High"
        if activity == "medium":
            return "Medium"
        return "Low"
