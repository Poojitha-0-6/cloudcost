/* ============================================================
   CLOUDCOST GUARDIAN
   COMPLETE DASHBOARD JAVASCRIPT
   ============================================================ */


let resourcesData = [];

let resourceHistoryChart = null;
let wasteScoreChart = null;
let classificationChart = null;
let cpuWasteChart = null;
let runtimeChart = null;
let historyScoreChart = null;


/* ============================================================
   HELPERS
   ============================================================ */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function formatNumber(value, decimals = 1) {

    const number = Number(value);

    if (Number.isNaN(number)) {
        return "--";
    }

    return number.toFixed(decimals);

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function classificationClass(classification) {

    if (!classification) {
        return "";
    }

    return classification
        .toLowerCase()
        .replace(/\s+/g, "-");

}


function priorityClass(priority) {

    if (!priority) {
        return "";
    }

    return priority.toLowerCase();

}


function setProgress(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    const numeric =
        Math.max(
            0,
            Math.min(
                Number(value) || 0,
                100
            )
        );

    element.style.width =
        `${numeric}%`;

}


/* ============================================================
   API
   ============================================================ */

async function fetchResources() {

    const response =
        await fetch("/api/resources");

    if (!response.ok) {

        throw new Error(
            "Unable to load resources."
        );

    }

    return await response.json();

}


/* ============================================================
   OVERVIEW
   ============================================================ */

async function loadOverviewPage() {

    try {

        const resources =
            await fetchResources();

        resourcesData =
            resources;

        updateOverviewMetrics(
            resources
        );

        renderOverviewResourceTable(
            resources
        );

    } catch (error) {

        console.error(
            "Overview loading error:",
            error
        );

        showOverviewError();

    }

}


function updateOverviewMetrics(resources) {

    const total =
        resources.length;


    const highRisk =
        resources.filter(
            resource =>
                resource.classification ===
                "HIGH WASTE RISK"
        ).length;


    const underutilized =
        resources.filter(
            resource =>
                resource.classification ===
                "UNDERUTILIZED"
        ).length;


    let averageWaste = 0;


    if (resources.length > 0) {

        averageWaste =
            resources.reduce(
                (sum, resource) =>
                    sum +
                    Number(
                        resource.waste_score
                    ),
                0
            ) / resources.length;

    }


    setText(
        "overviewTotal",
        total
    );


    setText(
        "overviewHighRisk",
        highRisk
    );


    setText(
        "overviewAverageScore",
        formatNumber(
            averageWaste
        )
    );


    setText(
        "overviewUnderutilized",
        underutilized
    );

}


function renderOverviewResourceTable(resources) {

    const table =
        document.getElementById(
            "overviewResourceTable"
        );

    if (!table) {
        return;
    }


    if (!resources.length) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="resource-loading"
                >
                    No resources available.
                </td>
            </tr>
        `;

        return;

    }


    /*
     * Show highest Waste Score first.
     */

    const sortedResources =
        [...resources].sort(
            (a, b) =>
                Number(b.waste_score) -
                Number(a.waste_score)
        );


    table.innerHTML =
        sortedResources.map(
            resource => {

                const classification =
                    resource.classification ||
                    "UNKNOWN";


                return `
                    <tr
                        onclick="openResourceDetail(
                            '${encodeURIComponent(
                                resource.resource_id
                            )}'
                        )"
                    >

                        <td>
                            <strong>
                                ${escapeHtml(
                                    resource.resource_id
                                )}
                            </strong>
                        </td>

                        <td>
                            ${formatNumber(
                                resource.cpu_utilization
                            )}%
                        </td>

                        <td>
                            ${escapeHtml(
                                resource.application_activity
                            )}
                        </td>

                        <td>
                            <strong>
                                ${formatNumber(
                                    resource.waste_score
                                )}
                            </strong>
                        </td>

                        <td>

                            <span
                                class="status-badge ${classificationClass(
                                    classification
                                )}"
                            >
                                ${escapeHtml(
                                    classification
                                )}
                            </span>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


function showOverviewError() {

    setText(
        "overviewTotal",
        "!"
    );

    setText(
        "overviewHighRisk",
        "--"
    );

    setText(
        "overviewAverageScore",
        "--"
    );

    setText(
        "overviewUnderutilized",
        "--"
    );


    const table =
        document.getElementById(
            "overviewResourceTable"
        );

    if (table) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="resource-loading"
                >
                    Unable to load resource data.
                    Check the Flask server console.
                </td>
            </tr>
        `;

    }

}


/* ============================================================
   RESOURCES PAGE
   ============================================================ */

async function loadResourcesPage() {

    try {

        resourcesData =
            await fetchResources();

        updateResourceSummary(
            resourcesData
        );

        filterResources();

    } catch (error) {

        console.error(
            "Resources loading error:",
            error
        );

    }

}


function updateResourceSummary(resources) {

    const total =
        resources.length;


    const active =
        resources.filter(
            resource =>
                resource.classification ===
                "ACTIVE"
        ).length;


    const underutilized =
        resources.filter(
            resource =>
                resource.classification ===
                "UNDERUTILIZED"
        ).length;


    const highRisk =
        resources.filter(
            resource =>
                resource.classification ===
                "HIGH WASTE RISK"
        ).length;


    setText(
        "resourceTotal",
        total
    );

    setText(
        "resourceActive",
        active
    );

    setText(
        "resourceUnderutilized",
        underutilized
    );

    setText(
        "resourceHighRisk",
        highRisk
    );

}


function renderResourceTable(resources) {

    const table =
        document.getElementById(
            "resourceTableBody"
        );

    if (!table) {
        return;
    }


    if (!resources.length) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="resource-loading"
                >
                    No resources found.
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML =
        resources.map(
            resource => {

                const classification =
                    resource.classification ||
                    "UNKNOWN";


                return `
                    <tr
                        onclick="openResourceDetail(
                            '${encodeURIComponent(
                                resource.resource_id
                            )}'
                        )"
                    >

                        <td>
                            <strong>
                                ${escapeHtml(
                                    resource.resource_id
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                resource.region
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                resource.state
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                resource.cpu_utilization
                            )}%
                        </td>

                        <td>
                            ${formatNumber(
                                resource.network_activity
                            )} MB
                        </td>

                        <td>
                            ${escapeHtml(
                                resource.application_activity
                            )}
                        </td>

                        <td>
                            <strong>
                                ${formatNumber(
                                    resource.waste_score
                                )}
                            </strong>
                        </td>

                        <td>

                            <span
                                class="status-badge ${classificationClass(
                                    classification
                                )}"
                            >
                                ${escapeHtml(
                                    classification
                                )}
                            </span>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


function filterResources() {

    if (!resourcesData.length) {

        renderResourceTable([]);

        return;

    }


    const searchElement =
        document.getElementById(
            "resourceSearch"
        );

    const filterElement =
        document.getElementById(
            "resourceFilter"
        );

    const sortElement =
        document.getElementById(
            "resourceSort"
        );


    const search =
        searchElement
            ? searchElement.value
                .toLowerCase()
                .trim()
            : "";


    const filter =
        filterElement
            ? filterElement.value
            : "ALL";


    const sort =
        sortElement
            ? sortElement.value
            : "score";


    let filtered =
        resourcesData.filter(
            resource => {

                const resourceId =
                    String(
                        resource.resource_id
                    ).toLowerCase();

                const region =
                    String(
                        resource.region
                    ).toLowerCase();


                const matchesSearch =
                    resourceId.includes(
                        search
                    ) ||
                    region.includes(
                        search
                    );


                const matchesFilter =
                    filter === "ALL" ||
                    resource.classification ===
                    filter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    filtered.sort(
        (a, b) => {

            if (sort === "cpu") {

                return (
                    Number(
                        b.cpu_utilization
                    ) -
                    Number(
                        a.cpu_utilization
                    )
                );

            }


            if (sort === "runtime") {

                return (
                    Number(
                        b.running_hours
                    ) -
                    Number(
                        a.running_hours
                    )
                );

            }


            return (
                Number(
                    b.waste_score
                ) -
                Number(
                    a.waste_score
                )
            );

        }
    );


    renderResourceTable(
        filtered
    );

}


function openResourceDetail(resourceId) {

    window.location.href =
        `/resources/${resourceId}`;

}


/* ============================================================
   RESOURCE DETAIL
   ============================================================ */

function getResourceIdFromUrl() {

    const parts =
        window.location.pathname
            .split("/")
            .filter(Boolean);


    if (parts.length >= 2) {

        return decodeURIComponent(
            parts[parts.length - 1]
        );

    }

    return null;

}


async function loadResourceDetail() {

    const resourceId =
        getResourceIdFromUrl();

    if (!resourceId) {
        return;
    }


    try {

        const resources =
            await fetchResources();


        const resource =
            resources.find(
                item =>
                    item.resource_id ===
                    resourceId
            );


        if (!resource) {

            setText(
                "detailResourceTitle",
                "Resource Not Found"
            );

            setText(
                "detailResourceSubtitle",
                "The requested resource could not be found."
            );

            return;

        }


        renderResourceDetail(
            resource
        );


        await loadResourceHistory(
            resourceId
        );

    } catch (error) {

        console.error(
            "Resource detail error:",
            error
        );

    }

}


function renderResourceDetail(resource) {

    setText(
        "detailResourceTitle",
        resource.resource_id
    );

    setText(
        "detailResourceSubtitle",
        `${resource.resource_type} resource in ${resource.region}`
    );

    setText(
        "detailResourceId",
        resource.resource_id
    );

    setText(
        "detailRegion",
        resource.region
    );

    setText(
        "detailWasteScore",
        formatNumber(
            resource.waste_score
        )
    );

    setText(
        "detailRiskLevel",
        resource.risk_level
    );


    const classification =
        document.getElementById(
            "detailClassification"
        );


    if (classification) {

        classification.textContent =
            resource.classification;

        classification.className =
            `status-badge ${
                classificationClass(
                    resource.classification
                )
            }`;

    }


    setText(
        "detailCpu",
        `${formatNumber(
            resource.cpu_utilization
        )}%`
    );


    setText(
        "detailNetwork",
        `${formatNumber(
            resource.network_activity
        )} MB`
    );


    setText(
        "detailRuntime",
        `${formatNumber(
            resource.running_hours
        )} h`
    );


    setText(
        "detailActivity",
        resource.application_activity
    );


    setProgress(
        "detailCpuBar",
        resource.cpu_utilization
    );


    setProgress(
        "detailNetworkBar",
        (
            Number(
                resource.network_activity
            ) / 200
        ) * 100
    );


    setText(
        "infoResourceId",
        resource.resource_id
    );

    setText(
        "infoResourceType",
        resource.resource_type
    );

    setText(
        "infoRegion",
        resource.region
    );

    setText(
        "infoState",
        resource.state
    );

    setText(
        "infoTimestamp",
        resource.timestamp
    );


    setText(
        "detailClassificationTitle",
        resource.classification
    );

    setText(
        "detailClassificationDescription",
        resource.classification_description
    );


    setText(
        "detailRecommendation",
        resource.recommendation
    );

    setText(
        "detailRecommendationAction",
        resource.recommendation_action
    );

    setText(
        "detailRecommendationReason",
        resource.recommendation_reason
    );

    setText(
        "detailRecommendationPriority",
        resource.recommendation_priority
    );


    const priority =
        document.getElementById(
            "detailRecommendationPriority"
        );


    if (priority) {

        priority.className =
            `priority-badge ${
                priorityClass(
                    resource.recommendation_priority
                )
            }`;

    }


    const breakdown =
        resource.waste_breakdown || {};


    setText(
        "cpuFactor",
        formatNumber(
            breakdown.cpu_factor
        )
    );

    setText(
        "networkFactor",
        formatNumber(
            breakdown.network_factor
        )
    );

    setText(
        "activityFactor",
        formatNumber(
            breakdown.activity_factor
        )
    );

    setText(
        "runtimeFactor",
        formatNumber(
            breakdown.runtime_factor
        )
    );


    setProgress(
        "cpuFactorBar",
        breakdown.cpu_factor
    );

    setProgress(
        "networkFactorBar",
        breakdown.network_factor
    );

    setProgress(
        "activityFactorBar",
        breakdown.activity_factor
    );

    setProgress(
        "runtimeFactorBar",
        breakdown.runtime_factor
    );

}


async function loadResourceHistory(resourceId) {

    try {

        const response =
            await fetch(
                `/api/history/${encodeURIComponent(
                    resourceId
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load resource history."
            );

        }


        const history =
            await response.json();


        renderResourceHistoryTable(
            history
        );

        renderResourceHistoryChart(
            history
        );

    } catch (error) {

        console.error(
            "Resource history error:",
            error
        );

    }

}


function renderResourceHistoryTable(history) {

    const tbody =
        document.getElementById(
            "resourceHistoryTable"
        );


    if (!tbody) {
        return;
    }


    if (!history.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-state"
                >
                    No historical observations available.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        history
            .slice(0, 20)
            .map(
                item => `
                    <tr>

                        <td>
                            ${escapeHtml(
                                item.timestamp
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                item.cpu_utilization
                            )}%
                        </td>

                        <td>
                            <strong>
                                ${formatNumber(
                                    item.waste_score
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                item.classification
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.recommendation
                            )}
                        </td>

                    </tr>
                `
            )
            .join("");

}


function renderResourceHistoryChart(history) {

    const canvas =
        document.getElementById(
            "resourceHistoryChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (resourceHistoryChart) {

        resourceHistoryChart.destroy();

    }


    const ordered =
        [...history].reverse();


    resourceHistoryChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        ordered.map(
                            item =>
                                item.timestamp
                        ),

                    datasets: [{

                        label:
                            "Waste Score",

                        data:
                            ordered.map(
                                item =>
                                    item.waste_score
                            ),

                        borderWidth: 2,

                        tension: 0.35,

                        fill: false

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100

                        }

                    }

                }

            }
        );

}


/* ============================================================
   ANALYTICS
   ============================================================ */

async function loadAnalytics() {

    try {

        const resources =
            await fetchResources();


        if (!resources.length) {
            return;
        }


        const scores =
            resources.map(
                resource =>
                    Number(
                        resource.waste_score
                    )
            );


        const cpus =
            resources.map(
                resource =>
                    Number(
                        resource.cpu_utilization
                    )
            );


        const average =
            scores.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / scores.length;


        const highest =
            Math.max(...scores);


        const averageCpu =
            cpus.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / cpus.length;


        const underutilized =
            resources.filter(
                resource =>
                    resource.classification ===
                    "UNDERUTILIZED"
            ).length;


        setText(
            "analyticsAverage",
            formatNumber(
                average
            )
        );


        setText(
            "analyticsHighest",
            formatNumber(
                highest
            )
        );


        setText(
            "analyticsCpu",
            `${formatNumber(
                averageCpu
            )}%`
        );


        setText(
            "analyticsUnderutilized",
            underutilized
        );


        renderWasteScoreChart(
            resources
        );

        renderClassificationChart(
            resources
        );

        renderCpuWasteChart(
            resources
        );

        renderRuntimeChart(
            resources
        );


        generateAnalyticsInsight(
            resources,
            average,
            averageCpu
        );

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

    }

}


function renderWasteScoreChart(resources) {

    const canvas =
        document.getElementById(
            "wasteScoreChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (wasteScoreChart) {
        wasteScoreChart.destroy();
    }


    wasteScoreChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        resources.map(
                            resource =>
                                resource.resource_id
                        ),

                    datasets: [{

                        label:
                            "Waste Score",

                        data:
                            resources.map(
                                resource =>
                                    resource.waste_score
                            ),

                        borderWidth: 0

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100

                        }

                    }

                }

            }
        );

}


function renderClassificationChart(resources) {

    const canvas =
        document.getElementById(
            "classificationChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (classificationChart) {
        classificationChart.destroy();
    }


    const classes = [
        "ACTIVE",
        "MONITOR",
        "UNDERUTILIZED",
        "HIGH WASTE RISK"
    ];


    const counts =
        classes.map(
            classification =>
                resources.filter(
                    resource =>
                        resource.classification ===
                        classification
                ).length
        );


    classificationChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: classes,

                    datasets: [{

                        data: counts,

                        borderWidth: 0

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }
        );

}


function renderCpuWasteChart(resources) {

    const canvas =
        document.getElementById(
            "cpuWasteChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (cpuWasteChart) {
        cpuWasteChart.destroy();
    }


    cpuWasteChart =
        new Chart(
            canvas,
            {

                type: "scatter",

                data: {

                    datasets: [{

                        label:
                            "Resources",

                        data:
                            resources.map(
                                resource => ({
                                    x:
                                        Number(
                                            resource.cpu_utilization
                                        ),

                                    y:
                                        Number(
                                            resource.waste_score
                                        )
                                })
                            ),

                        borderWidth: 2

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        x: {

                            title: {

                                display: true,

                                text:
                                    "CPU Utilization (%)"

                            },

                            min: 0,

                            max: 100

                        },

                        y: {

                            title: {

                                display: true,

                                text:
                                    "Waste Score"

                            },

                            min: 0,

                            max: 100

                        }

                    }

                }

            }
        );

}


function renderRuntimeChart(resources) {

    const canvas =
        document.getElementById(
            "runtimeChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (runtimeChart) {
        runtimeChart.destroy();
    }


    runtimeChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        resources.map(
                            resource =>
                                resource.resource_id
                        ),

                    datasets: [{

                        label:
                            "Running Hours",

                        data:
                            resources.map(
                                resource =>
                                    resource.running_hours
                            ),

                        borderWidth: 0

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }
        );

}


function generateAnalyticsInsight(
    resources,
    average,
    averageCpu
) {

    const highest =
        resources.reduce(
            (a, b) =>
                Number(a.waste_score) >
                Number(b.waste_score)
                    ? a
                    : b
        );


    const message =
        `The current average Waste Score is ${
            formatNumber(average)
        } with average CPU utilization of ${
            formatNumber(averageCpu)
        }%. The highest-risk resource is ${
            highest.resource_id
        } with a Waste Score of ${
            formatNumber(highest.waste_score)
        }. These signals can be used to prioritize manual optimization review.`;


    setText(
        "analyticsInsight",
        message
    );

}


/* ============================================================
   RECOMMENDATIONS
   ============================================================ */

async function loadRecommendations() {

    try {

        resourcesData =
            await fetchResources();


        renderRecommendationSummary(
            resourcesData
        );


        renderRecommendations(
            resourcesData
        );

    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );

    }

}


function renderRecommendationSummary(
    resources
) {

    setText(
        "recommendationTotal",
        resources.length
    );


    setText(
        "recommendationCritical",
        resources.filter(
            resource =>
                resource.recommendation_priority ===
                "CRITICAL"
        ).length
    );


    setText(
        "recommendationHigh",
        resources.filter(
            resource =>
                resource.recommendation_priority ===
                "HIGH"
        ).length
    );


    setText(
        "recommendationMedium",
        resources.filter(
            resource =>
                resource.recommendation_priority ===
                "MEDIUM"
        ).length
    );

}


function renderRecommendations(
    resources
) {

    const grid =
        document.getElementById(
            "recommendationGrid"
        );


    const empty =
        document.getElementById(
            "recommendationEmpty"
        );


    if (!grid) {
        return;
    }


    const filterElement =
        document.getElementById(
            "recommendationFilter"
        );


    const filter =
        filterElement
            ? filterElement.value
            : "ALL";


    const filtered =
        resources.filter(
            resource =>
                filter === "ALL" ||
                resource.recommendation_priority ===
                filter
        );


    if (!filtered.length) {

        grid.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;

    }


    if (empty) {
        empty.style.display =
            "none";
    }


    grid.innerHTML =
        filtered.map(
            resource => `

                <div class="recommendation-item">

                    <div
                        class="recommendation-item-header"
                    >

                        <span
                            class="recommendation-resource"
                        >
                            ${escapeHtml(
                                resource.resource_id
                            )}
                        </span>

                        <span
                            class="priority-badge ${priorityClass(
                                resource.recommendation_priority
                            )}"
                        >
                            ${escapeHtml(
                                resource.recommendation_priority
                            )}
                        </span>

                    </div>


                    <h3>
                        ${escapeHtml(
                            resource.recommendation
                        )}
                    </h3>


                    <p>
                        ${escapeHtml(
                            resource.recommendation_reason
                        )}
                    </p>


                    <div
                        class="recommendation-item-action"
                    >

                        <strong>
                            Suggested action
                        </strong>

                        <br>

                        ${escapeHtml(
                            resource.recommendation_action
                        )}

                    </div>


                    <div
                        class="recommendation-item-footer"
                    >

                        <span>
                            Waste Score:
                            <strong>
                                ${formatNumber(
                                    resource.waste_score
                                )}
                            </strong>
                        </span>

                        <span>
                            ${escapeHtml(
                                resource.classification
                            )}
                        </span>

                    </div>

                </div>

            `
        ).join("");

}


function filterRecommendations() {

    renderRecommendations(
        resourcesData
    );

}


/* ============================================================
   HISTORY
   ============================================================ */

async function loadHistoryPage() {

    try {

        const resources =
            await fetchResources();


        populateHistoryResourceFilter(
            resources
        );


        const filter =
            document.getElementById(
                "historyResourceFilter"
            );


        const resourceId =
            filter
                ? filter.value
                : "ALL";


        const url =
            resourceId === "ALL"
                ? "/api/history?limit=100"
                : `/api/history/${encodeURIComponent(
                    resourceId
                )}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Unable to load history."
            );

        }


        const history =
            await response.json();


        renderHistorySummary(
            history
        );


        renderHistoryTable(
            history
        );


        renderHistoryChart(
            history
        );

    } catch (error) {

        console.error(
            "History error:",
            error
        );

    }

}


function populateHistoryResourceFilter(
    resources
) {

    const select =
        document.getElementById(
            "historyResourceFilter"
        );


    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML = `
        <option value="ALL">
            All Resources
        </option>
    `;


    resources.forEach(
        resource => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                resource.resource_id;


            option.textContent =
                resource.resource_id;


            select.appendChild(
                option
            );

        }
    );


    if (
        current &&
        current !== "ALL" &&
        resources.some(
            resource =>
                resource.resource_id ===
                current
        )
    ) {

        select.value =
            current;

    }

}


function renderHistorySummary(
    history
) {

    const scores =
        history.map(
            item =>
                Number(
                    item.waste_score
                )
        );


    const average =
        scores.length
            ? scores.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / scores.length
            : 0;


    const highest =
        scores.length
            ? Math.max(...scores)
            : 0;


    const resourceCount =
        new Set(
            history.map(
                item =>
                    item.resource_id
            )
        ).size;


    setText(
        "historyObservationCount",
        history.length
    );


    setText(
        "historyAverageScore",
        formatNumber(
            average
        )
    );


    setText(
        "historyHighestScore",
        formatNumber(
            highest
        )
    );


    setText(
        "historyResourceCount",
        resourceCount
    );

}


function renderHistoryTable(
    history
) {

    const tbody =
        document.getElementById(
            "historyTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!history.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    No historical observations available.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        history.map(
            item => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                item.resource_id
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            item.timestamp
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            item.cpu_utilization
                        )}%
                    </td>

                    <td>
                        ${formatNumber(
                            item.network_activity
                        )} MB
                    </td>

                    <td>
                        <strong>
                            ${formatNumber(
                                item.waste_score
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            item.classification
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.recommendation
                        )}
                    </td>

                </tr>

            `
        ).join("");

}


function renderHistoryChart(
    history
) {

    const canvas =
        document.getElementById(
            "historyScoreChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (historyScoreChart) {
        historyScoreChart.destroy();
    }


    const ordered =
        [...history].reverse();


    historyScoreChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        ordered.map(
                            item =>
                                item.timestamp
                        ),

                    datasets: [{

                        label:
                            "Waste Score",

                        data:
                            ordered.map(
                                item =>
                                    item.waste_score
                            ),

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100

                        }

                    }

                }

            }
        );

}


/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const path =
            window.location.pathname;


        console.log(
            "CloudCost Guardian page:",
            path
        );


        /* OVERVIEW */

        if (
            path === "/" ||
            path === ""
        ) {

            loadOverviewPage();

        }


        /* RESOURCES */

        else if (
            path === "/resources"
        ) {

            loadResourcesPage();

        }


        /* RESOURCE DETAIL */

        else if (
            path.startsWith(
                "/resources/"
            )
        ) {

            loadResourceDetail();

        }


        /* ANALYTICS */

        else if (
            path === "/analytics"
        ) {

            loadAnalytics();

        }


        /* RECOMMENDATIONS */

        else if (
            path === "/recommendations"
        ) {

            loadRecommendations();

        }


        /* HISTORY */

        else if (
            path === "/history"
        ) {

            loadHistoryPage();

        }

    }
);