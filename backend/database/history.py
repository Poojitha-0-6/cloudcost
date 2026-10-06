import sqlite3
from pathlib import Path
from typing import List, Dict, Any


# =========================================
# DATABASE LOCATION
# =========================================

DATABASE_PATH = (
    Path(__file__).resolve().parent /
    "cloudcost.db"
)


class HistoryDatabase:
    """
    Handles historical storage for CloudCost Guardian.

    SQLite is used for local development so that
    no external database service is required.
    """

    def __init__(self, database_path=DATABASE_PATH):

        self.database_path = database_path

        self.initialize_database()


    # =========================================
    # DATABASE CONNECTION
    # =========================================

    def get_connection(self):

        connection = sqlite3.connect(
            self.database_path
        )

        connection.row_factory = sqlite3.Row

        return connection


    # =========================================
    # CREATE TABLE
    # =========================================

    def initialize_database(self):

        connection = self.get_connection()

        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resource_history (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                resource_id TEXT NOT NULL,

                resource_type TEXT NOT NULL,

                region TEXT NOT NULL,

                state TEXT NOT NULL,

                cpu_utilization REAL NOT NULL,

                network_activity REAL NOT NULL,

                application_activity TEXT NOT NULL,

                running_hours REAL NOT NULL,

                waste_score REAL NOT NULL,

                risk_level TEXT NOT NULL,

                classification TEXT NOT NULL,

                recommendation TEXT NOT NULL,

                recommendation_priority TEXT NOT NULL,

                timestamp TEXT NOT NULL

            )
        """)

        connection.commit()

        connection.close()


    # =========================================
    # SAVE ANALYSIS
    # =========================================

    def save_analysis(
        self,
        resource,
        waste_result,
        classification_result,
        recommendation_result
    ):

        connection = self.get_connection()

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO resource_history (

                resource_id,
                resource_type,
                region,
                state,
                cpu_utilization,
                network_activity,
                application_activity,
                running_hours,
                waste_score,
                risk_level,
                classification,
                recommendation,
                recommendation_priority,
                timestamp

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (

            resource.resource_id,

            resource.resource_type,

            resource.region,

            resource.state,

            resource.cpu_utilization,

            resource.network_activity,

            resource.application_activity,

            resource.running_hours,

            waste_result["waste_score"],

            waste_result["risk_level"],

            classification_result["classification"],

            recommendation_result["recommendation"],

            recommendation_result["priority"],

            resource.timestamp

        ))

        connection.commit()

        connection.close()


    # =========================================
    # GET HISTORY
    # =========================================

    def get_history(
        self,
        resource_id=None,
        limit=100
    ):

        connection = self.get_connection()

        cursor = connection.cursor()


        if resource_id:

            cursor.execute("""
                SELECT *
                FROM resource_history
                WHERE resource_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (
                resource_id,
                limit
            ))

        else:

            cursor.execute("""
                SELECT *
                FROM resource_history
                ORDER BY timestamp DESC
                LIMIT ?
            """, (
                limit,
            ))


        rows = cursor.fetchall()

        connection.close()


        return [
            dict(row)
            for row in rows
        ]


    # =========================================
    # GET RESOURCE HISTORY
    # =========================================

    def get_resource_history(
        self,
        resource_id,
        limit=50
    ):

        return self.get_history(
            resource_id=resource_id,
            limit=limit
        )