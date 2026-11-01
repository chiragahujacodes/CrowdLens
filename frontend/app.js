
document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. DOM ELEMENTS
    // ==========================================

    const $ = (id) => document.getElementById(id);

    const elements = {
        sidebar: $("sidebar"),
        mobileMenu: $("mobileMenu"),
        navLinks: document.querySelectorAll(".nav-link"),
        breadcrumb: $("breadcrumbCurrent"),

        analysisForm: $("analysisForm"),
        urlInput: $("urlInput"),
        analyseBtn: $("analyseBtn"),
        demoBtn: $("demoBtn"),

        progressArea: $("progressArea"),
        progressText: $("progressText"),
        errorBox: $("errorBox"),

        welcomeGrid: $("welcomeGrid"),
        report: $("report"),

        reportTitle: $("reportTitle"),
        reportUrl: $("reportUrl"),
        sourceChip: $("sourceChip"),

        summaryText: $("summaryText"),
        sentimentLabel: $("sentimentLabel"),
        sentimentCaption: $("sentimentCaption"),
        sentimentCenter: $("sentimentCenter"),
        sentimentLegend: $("sentimentLegend"),
        keyTakeaway: $("keyTakeaway"),

        themeList: $("themeList"),
        demandsList: $("demandsList"),
        painList: $("painList"),
        evidenceList: $("evidenceList"),

        opportunitiesList: $("opportunitiesList"),
        recommendationsList: $("recommendationsList"),

        commentsList: $("commentsList"),
        commentSearch: $("commentSearch"),
        sentimentFilter: $("sentimentFilter"),
        commentsEmpty: $("commentsEmpty"),

        pdfBtn: $("pdfBtn")
    };

    let sentimentChart = null;
    let themesChart = null;
    let extraCharts = [];
    let allComments = [];

    // ==========================================
    // 2. GENERAL HELPERS
    // ==========================================

    function getValue(value, fallback = "") {
        if (value === null || value === undefined) {
            return fallback;
        }

        return String(value);
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }

    function clearElement(element) {
        if (element) {
            element.replaceChildren();
        }
    }

    function showError(message) {
        elements.errorBox.textContent = message;
        elements.errorBox.classList.remove("hidden");
    }

    function hideError() {
        elements.errorBox.textContent = "";
        elements.errorBox.classList.add("hidden");
    }

    function showProgress(message) {
        elements.progressText.textContent = message;
        elements.progressArea.classList.remove("hidden");
    }

    function hideProgress() {
        elements.progressArea.classList.add("hidden");
    }

    function setLoading(isLoading) {
        elements.analyseBtn.disabled = isLoading;
        elements.demoBtn.disabled = isLoading;

        elements.analyseBtn.querySelector("span:first-child").textContent =
            isLoading ? "Analysing..." : "Generate insights";
    }

    function getArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getText(item, fields = []) {
        if (typeof item === "string" || typeof item === "number") {
            return String(item);
        }

        if (!item || typeof item !== "object") {
            return "";
        }

        for (const field of fields) {
            if (
                item[field] !== undefined &&
                item[field] !== null &&
                typeof item[field] !== "object"
            ) {
                return String(item[field]);
            }
        }

        return "";
    }

    function normalizeSentiment(value) {
        const sentiment = getValue(value).toLowerCase().trim();

        if (sentiment.includes("positive")) return "positive";
        if (sentiment.includes("negative")) return "negative";
        if (sentiment.includes("neutral")) return "neutral";

        return "mixed";
    }

    function parseNumber(value) {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }

        if (typeof value === "string") {
            const cleaned = value.replace("%", "").trim();
            const number = Number(cleaned);

            return Number.isFinite(number) ? number : null;
        }

        return null;
    }

    function emptyMessage(container, message) {
        if (!container) return;

        clearElement(container);

        container.appendChild(
            createElement("p", "empty-state", message)
        );
    }

    // ==========================================
    // 3. MOBILE SIDEBAR
    // ==========================================

    elements.mobileMenu.addEventListener("click", () => {
        elements.sidebar.classList.toggle("open");
    });

    elements.navLinks.forEach(link => {
        link.addEventListener("click", () => {
            elements.navLinks.forEach(nav => {
                nav.classList.remove("active");
            });

            link.classList.add("active");

            elements.breadcrumb.textContent =
                link.textContent.trim();

            elements.sidebar.classList.remove("open");
        });
    });

    // Navigation based on visible sections.

    if ("IntersectionObserver" in window) {
        const sections = document.querySelectorAll(
            "#overview, #audience, #voice, #opportunities, #comments"
        );

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const id = entry.target.id;

                const activeLink = document.querySelector(
                    `.nav-link[data-section="${id}"]`
                );

                if (activeLink) {
                    elements.navLinks.forEach(link => {
                        link.classList.remove("active");
                    });

                    activeLink.classList.add("active");

                    elements.breadcrumb.textContent =
                        activeLink.textContent.trim();
                }
            });
        }, {
            rootMargin: "-20% 0px -65% 0px"
        });

        sections.forEach(section => observer.observe(section));
    }

    // ==========================================
    // 4. API CONNECTION
    // ==========================================

    async function requestAnalysis(endpoint, payload = {}) {
        const API_BASE_URL = window.location.origin;

        const apiUrl = new URL(endpoint, API_BASE_URL);

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                `Invalid server response (HTTP ${response.status}).`
            );
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error ||
                result.message ||
                `Analysis failed (HTTP ${response.status}).`
            );
        }

        if (!result.data) {
            throw new Error(
                "The server response does not contain analysis data."
            );
        }

        return result;
    }

    // ==========================================
    // 5. LIVE ANALYSIS
    // ==========================================

    elements.analysisForm.addEventListener("submit", async event => {
        event.preventDefault();

        const url = elements.urlInput.value.trim();

        if (!url) {
            showError("Please enter a public URL.");
            return;
        }

        if (!elements.urlInput.checkValidity()) {
            showError("Please enter a valid URL.");
            return;
        }

        await runAnalysis("/api/analyze", { url });
    });

    // ==========================================
    // 6. DEMO REPORT
    // ==========================================

    elements.demoBtn.addEventListener("click", async () => {
        await runAnalysis("/api/analyze/demo");
    });

    // ==========================================
    // 7. COMMON ANALYSIS HANDLER
    // ==========================================

    async function runAnalysis(endpoint, payload = {}) {
        hideError();
        setLoading(true);

        showProgress("Connecting to the analysis engine...");

        elements.report.classList.add("hidden");

        try {
            showProgress("Collecting and analysing audience feedback...");

            const result = await requestAnalysis(endpoint, payload);

            showProgress("Preparing your intelligence report...");

            renderReport(result);

            elements.welcomeGrid.classList.add("hidden");
            elements.report.classList.remove("hidden");

            hideProgress();

            elements.report.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            console.error("CrowdLens analysis error:", error);

            showError(
                error.message ||
                "Something went wrong. Please try again."
            );

            hideProgress();

        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // 8. REPORT DATA NORMALIZATION
    // ==========================================

    function renderReport(result) {
        const data = result.data || {};
        const aiData = data.ai_analysis || {};

        const analysis = aiData.analysis || aiData;

        if (!analysis || typeof analysis !== "object") {
            throw new Error("The AI analysis data is missing.");
        }

        const comments = getArray(data.comments);

        allComments = comments.map(comment => {
            if (typeof comment === "string") {
                return {
                    author: "Anonymous",
                    text: comment,
                    sentiment: ""
                };
            }

            return {
                ...comment,

                author: getText(
                    comment,
                    ["author", "username", "user"]
                ) || "Anonymous",

                text: getText(
                    comment,
                    ["text", "comment", "content", "body"]
                ),

                sentiment: normalizeSentiment(
                    comment.sentiment || comment.classification || ""
                )
            };
        }).filter(comment => comment.text);

        const reportInfo = {
            title: data.title || "Audience Intelligence Report",
            url: data.url || elements.urlInput.value || "",

            source: result.source_mode === "saved_demo"
                ? "Sample report"
                : "Live analysis"
        };

        elements.reportTitle.textContent = reportInfo.title;
        elements.reportUrl.textContent = reportInfo.url;
        elements.sourceChip.textContent = reportInfo.source;

        // Never display comments_count or sample_size.

        renderSummary(analysis);
        renderSentiment(analysis);
        renderThemes(analysis);
        renderAudienceVoice(analysis);
        renderEvidence(analysis);
        renderOpportunities(analysis);
        renderComments();

        // Render additional analytics after the main report.

        const commentsForAnalytics = allComments;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                renderExtraAnalytics(analysis, commentsForAnalytics);
            });
        });
    }

    // ==========================================
    // 9. SUMMARY
    // ==========================================

    function renderSummary(analysis) {
        const summary = getText(analysis.summary);

        elements.summaryText.textContent =
            summary || "No summary was provided for this analysis.";

        const takeaway = getText(
            analysis.key_takeaway ||
            analysis.key_takeaways ||
            analysis.main_insight
        );

        elements.keyTakeaway.textContent =
            takeaway || summary || "No key takeaway is available.";
    }

    // ==========================================
    // 10. SENTIMENT ANALYSIS
    // ==========================================

    function renderSentiment(analysis) {
        const sentiment = normalizeSentiment(
            analysis.overall_sentiment
        );

        const displaySentiment =
            sentiment === "mixed"
                ? getText(analysis.overall_sentiment, "Mixed")
                : sentiment;

        elements.sentimentLabel.textContent = displaySentiment;

        elements.sentimentCaption.textContent =
            "Based on available audience feedback";

        const breakdown = analysis.sentiment_breakdown || {};

        const values = {
            positive: parseNumber(breakdown.positive),
            negative: parseNumber(breakdown.negative),
            neutral: parseNumber(breakdown.neutral)
        };

        const hasValidData = Object.values(values).every(
            value => value !== null && value >= 0
        );

        elements.sentimentCenter.textContent = displaySentiment;

        clearElement(elements.sentimentLegend);

        if (!hasValidData) {
            destroyChart(sentimentChart);
            sentimentChart = null;

            $("sentimentChart").style.display = "none";

            elements.sentimentLegend.appendChild(
                createElement(
                    "span",
                    "small-muted",
                    "Sentiment distribution is unavailable."
                )
            );

            return;
        }

        $("sentimentChart").style.display = "block";

        const labels = ["Positive", "Negative", "Neutral"];

        const colors = ["#9227e8", "#f20b86", "#ffad24"];

        const numbers = [
            values.positive,
            values.negative,
            values.neutral
        ];

        renderDonutChart(labels, numbers, colors);

        labels.forEach((label, index) => {
            const item = createElement("div", "legend-item");

            const dot = createElement("span", "legend-dot");
            dot.style.backgroundColor = colors[index];

            item.append(dot, document.createTextNode(label));

            elements.sentimentLegend.appendChild(item);
        });
    }

    // ==========================================
    // 11. CHART MANAGEMENT
    // ==========================================

    function destroyChart(chart) {
        if (chart) {
            chart.destroy();
        }
    }

    function renderDonutChart(labels, values, colors) {
        if (typeof Chart === "undefined") {
            return;
        }

        const canvas = $("sentimentChart");

        destroyChart(sentimentChart);

        sentimentChart = new Chart(canvas, {
            type: "doughnut",

            data: {
                labels,

                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 5
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "77%",

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: context =>
                                `${context.label}: ${context.raw}%`
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // 12. RECURRING THEMES
    // ==========================================

    function renderThemes(analysis) {
        const themes = getArray(analysis.key_themes);

        clearElement(elements.themeList);

        const chartableThemes = themes.map(theme => ({
            name: getText(theme, ["theme", "name", "title"]),

            description: getText(
                theme,
                ["description", "insight"]
            ),

            frequency: parseNumber(theme.frequency)

        })).filter(theme => theme.name);

        if (!chartableThemes.length) {
            emptyMessage(
                elements.themeList,
                "No recurring themes were identified."
            );

            destroyChart(themesChart);
            themesChart = null;

            $("themesChart").style.display = "none";

            return;
        }

        chartableThemes.forEach((theme, index) => {
            const row = createElement("div", "theme-row");

            const top = createElement("div", "theme-row-top");

            top.append(
                createElement("span", "", theme.name),

                createElement(
                    "span",
                    "theme-rank",
                    `0${index + 1}`
                )
            );

            row.append(
                top,

                createElement(
                    "p",
                    "",
                    theme.description ||
                    "No additional description available."
                )
            );

            elements.themeList.appendChild(row);
        });

        const validThemes = chartableThemes.filter(
            theme =>
                theme.frequency !== null &&
                theme.frequency >= 0
        );

        if (
            typeof Chart === "undefined" ||
            !validThemes.length
        ) {
            destroyChart(themesChart);
            themesChart = null;
            return;
        }

        const canvas = $("themesChart");

        canvas.style.display = "block";

        destroyChart(themesChart);

        themesChart = new Chart(canvas, {
            type: "bar",

            data: {
                labels: validThemes.map(theme => theme.name),

                datasets: [{
                    label: "Relative prominence",

                    data: validThemes.map(theme => theme.frequency),

                    backgroundColor: [
                        "#8b27e8",
                        "#f20b86",
                        "#ffad24",
                        "#7021cf",
                        "#b94ce8",
                        "#f65aab"
                    ],

                    borderRadius: 6,
                    barThickness: 15
                }]
            },

            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        enabled: false
                    }
                },

                scales: {
                    x: {
                        display: false,
                        beginAtZero: true
                    },

                    y: {
                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        },

                        ticks: {
                            color: "#827c8d",

                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    }

    // ==========================================
    // 13. AUDIENCE DEMANDS AND PAIN POINTS
    // ==========================================

    function renderInsightList(container, items, fields) {
        clearElement(container);

        const validItems = getArray(items)
            .map(item => getText(item, fields))
            .filter(Boolean);

        if (!validItems.length) {
            emptyMessage(container, "No insights available.");
            return;
        }

        validItems.forEach(item => {
            container.appendChild(
                createElement("div", "insight-item", item)
            );
        });
    }

    function renderAudienceVoice(analysis) {
        renderInsightList(
            elements.demandsList,
            analysis.audience_demands,

            ["demand", "request", "description", "text", "title"]
        );

        renderInsightList(
            elements.painList,
            analysis.pain_points,

            ["pain_point", "problem", "description", "text", "title"]
        );
    }

    // ==========================================
    // 14. EVIDENCE SPOTLIGHT
    // ==========================================

    function renderEvidence(analysis) {
        clearElement(elements.evidenceList);

        const themes = getArray(analysis.key_themes);

        const evidence = [];

        themes.forEach(theme => {
            const themeName = getText(
                theme,
                ["theme", "name", "title"]
            );

            getArray(theme.evidence).forEach(item => {
                evidence.push({
                    ...item,
                    theme: themeName
                });
            });
        });

        getArray(analysis.evidence).forEach(item => {
            evidence.push(item);
        });

        const uniqueEvidence = [];
        const seenQuotes = new Set();

        evidence.forEach(item => {
            const quote = getText(
                item,
                ["quote", "text", "comment"]
            );

            if (!quote || seenQuotes.has(quote)) {
                return;
            }

            seenQuotes.add(quote);

            uniqueEvidence.push({
                quote,

                author: getText(
                    item,
                    ["author", "username"]
                ) || "Audience member",

                theme: getText(
                    item,
                    ["theme", "topic"]
                ) || "Audience feedback"
            });
        });

        if (!uniqueEvidence.length) {
            emptyMessage(
                elements.evidenceList,
                "No supporting quotes were returned by the analysis."
            );

            return;
        }

        uniqueEvidence.slice(0, 8).forEach(item => {
            const card = createElement("article", "evidence-card");

            card.appendChild(
                createElement(
                    "blockquote",
                    "",
                    `“${item.quote}”`
                )
            );

            const meta = createElement("div", "evidence-meta");

            meta.append(
                createElement("span", "", item.author),

                createElement(
                    "span",
                    "evidence-theme",
                    item.theme
                )
            );

            card.appendChild(meta);

            elements.evidenceList.appendChild(card);
        });
    }

    // ==========================================
    // 15. GROWTH OPPORTUNITIES
    // ==========================================

    function renderOpportunities(analysis) {
        clearElement(elements.opportunitiesList);
        clearElement(elements.recommendationsList);

        const opportunities = getArray(
            analysis.content_opportunities ||
            analysis.growth_opportunities
        );

        if (!opportunities.length) {
            emptyMessage(
                elements.opportunitiesList,
                "No growth opportunities were identified."
            );
        } else {
            opportunities.forEach((item, index) => {
                const idea = getText(
                    item,
                    ["idea", "title", "opportunity"]
                );

                const reason = getText(
                    item,
                    ["reason", "description", "why"]
                );

                const wrapper = createElement(
                    "div",
                    "opportunity-item"
                );

                wrapper.appendChild(
                    createElement(
                        "span",
                        "opportunity-number",
                        String(index + 1).padStart(2, "0")
                    )
                );

                const content = createElement("div");

                content.append(
                    createElement(
                        "h5",
                        "",
                        idea || "Untitled opportunity"
                    ),

                    createElement(
                        "p",
                        "",
                        reason || "No additional context provided."
                    )
                );

                wrapper.appendChild(content);

                elements.opportunitiesList.appendChild(wrapper);
            });
        }

        const recommendations = getArray(
            analysis.recommendations
        );

        if (!recommendations.length) {
            emptyMessage(
                elements.recommendationsList,
                "No recommendations available."
            );

            return;
        }

        recommendations.forEach(item => {
            const text = getText(
                item,
                [
                    "recommendation",
                    "action",
                    "description",
                    "text",
                    "idea"
                ]
            );

            if (text) {
                elements.recommendationsList.appendChild(
                    createElement(
                        "div",
                        "recommendation-item",
                        text
                    )
                );
            }
        });
    }

    // ==========================================
    // 16. COMMENT EXPLORER
    // ==========================================

    function renderComments() {
        const searchTerm = elements.commentSearch.value
            .toLowerCase()
            .trim();

        const selectedSentiment = elements.sentimentFilter.value;

        clearElement(elements.commentsList);

        const filteredComments = allComments.filter(comment => {
            const matchesSearch =
                comment.text.toLowerCase().includes(searchTerm) ||
                comment.author.toLowerCase().includes(searchTerm);

            const matchesSentiment =
                selectedSentiment === "all" ||
                comment.sentiment === selectedSentiment;

            return matchesSearch && matchesSentiment;
        });

        elements.commentsEmpty.classList.toggle(
            "hidden",
            filteredComments.length !== 0
        );

        filteredComments.forEach(comment => {
            const card = createElement("article", "comment-card");

            const top = createElement("div", "comment-top");

            const author = createElement(
                "span",
                "comment-author",
                comment.author
            );

            const meta = createElement("div", "comment-meta");

            const sentimentLabel =
                comment.sentiment === "mixed"
                    ? "Unclassified"
                    : comment.sentiment;

            const tag = createElement(
                "span",

                `sentiment-tag ${
                    ["positive", "negative", "neutral"].includes(
                        comment.sentiment
                    ) ? comment.sentiment : "neutral"
                }`,

                sentimentLabel || "Unclassified"
            );

            meta.appendChild(tag);

            top.append(author, meta);

            card.append(
                top,

                createElement(
                    "p",
                    "comment-text",
                    comment.text
                )
            );

            elements.commentsList.appendChild(card);
        });
    }

    elements.commentSearch.addEventListener(
        "input",
        renderComments
    );

    elements.sentimentFilter.addEventListener(
        "change",
        renderComments
    );

    // ==========================================
    // 17. PDF EXPORT
    // ==========================================

    elements.pdfBtn.addEventListener("click", () => {
        if (elements.report.classList.contains("hidden")) {
            return;
        }

        window.print();
    });

    // ==========================================
    // 18. EXTRA ANALYTICS HELPERS
    // ==========================================

    function createAnalyticsPanel(title, subtitle) {
        const panel = document.createElement("div");

        panel.className = "crowdlens-extra-panel";

        panel.style.cssText = `
            background: #ffffff;
            border: 1px solid #eeedf4;
            border-radius: 16px;
            padding: 20px;
            margin-top: 18px;
            width: 100%;
            box-sizing: border-box;
        `;

        const heading = document.createElement("div");

        const titleElement = createElement("h3", "", title);

        titleElement.style.cssText = `
            margin: 0 0 5px;
            color: #25213a;
            font-size: 16px;
            font-weight: 700;
        `;

        const subtitleElement = createElement(
            "p",
            "",
            subtitle
        );

        subtitleElement.style.cssText = `
            margin: 0 0 18px;
            color: #858197;
            font-size: 12px;
            line-height: 1.5;
        `;

        heading.append(titleElement, subtitleElement);

        panel.appendChild(heading);

        return panel;
    }

    function createAnalyticsTable(headers, rows) {
        const wrapper = document.createElement("div");

        wrapper.style.cssText = `
            width: 100%;
            overflow-x: auto;
        `;

        const table = document.createElement("table");

        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        `;

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        headers.forEach(header => {
            const th = createElement("th", "", header);

            th.style.cssText = `
                padding: 11px 12px;
                background: #faf9ff;
                color: #858197;
                font-weight: 700;
                border-bottom: 1px solid #eeedf4;
                white-space: nowrap;
            `;

            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        rows.forEach(row => {
            const tr = document.createElement("tr");

            row.forEach(value => {
                const td = createElement(
                    "td",
                    "",
                    value || "—"
                );

                td.style.cssText = `
                    padding: 13px 12px;
                    color: #25213a;
                    border-bottom: 1px solid #eeedf4;
                    vertical-align: top;
                    line-height: 1.6;
                    min-width: 100px;
                `;

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);

        return wrapper;
    }

    // ==========================================
    // 19. EXTRA ANALYTICS
    // ==========================================

    function renderExtraAnalytics(analysis, comments = []) {
        comments = Array.isArray(comments) ? comments : [];

        // Destroy previous extra charts before replacing panels.

        extraCharts.forEach(chart => {
            if (chart) chart.destroy();
        });

        extraCharts = [];

        document.querySelectorAll(".crowdlens-extra-panel")
            .forEach(panel => panel.remove());

        // --------------------------------------
        // 19A. KEY THEMES INTELLIGENCE TABLE
        // --------------------------------------

        const themes = getArray(analysis.key_themes);

        const themeTarget = $("themeList");

        if (themes.length && themeTarget) {
            const rows = themes.slice(0, 6).map(theme => {
                const evidence = getArray(theme.evidence);

                const quotes = evidence
                    .map(item => getText(item, ["quote"]))
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(quote => `"${quote}"`)
                    .join(" | ");

                return [
                    getText(theme, ["theme", "name"]) ||
                        "Untitled theme",

                    getText(theme, ["description", "insight"]) ||
                        "No description available",

                    quotes || "No direct evidence supplied"
                ];
            });

            const panel = createAnalyticsPanel(
                "Theme Intelligence Table",
                "A structured view of recurring discussion themes and their supporting evidence."
            );

            panel.appendChild(
                createAnalyticsTable(
                    [
                        "Theme",
                        "What it indicates",
                        "Supporting evidence"
                    ],
                    rows
                )
            );

            themeTarget.insertAdjacentElement(
                "afterend",
                panel
            );
        }

        // --------------------------------------
        // 19B. AUDIENCE NEEDS VS PAIN POINTS
        // --------------------------------------

        const demands = getArray(analysis.audience_demands);
        const painPoints = getArray(analysis.pain_points);

        const demandsTarget = $("demandsList");
        const painTarget = $("painList");

        const voiceTarget = painTarget || demandsTarget;

        if (
            (demands.length || painPoints.length) &&
            voiceTarget
        ) {
            const maxLength = Math.min(
                Math.max(demands.length, painPoints.length),
                5
            );

            const rows = [];

            for (let i = 0; i < maxLength; i++) {
                rows.push([
                    getText(demands[i], [
                        "demand",
                        "description",
                        "text",
                        "title"
                    ]) || (typeof demands[i] === "string" ? demands[i] : "—"),

                    getText(painPoints[i], [
                        "pain_point",
                        "problem",
                        "description",
                        "text",
                        "title"
                    ]) || (typeof painPoints[i] === "string" ? painPoints[i] : "—")
                ]);
            }

            const panel = createAnalyticsPanel(
                "Audience Needs vs Pain Points",
                "Compare what the audience wants with the problems or frustrations they express."
            );

            panel.appendChild(
                createAnalyticsTable(
                    [
                        "Audience demands",
                        "Pain points"
                    ],
                    rows
                )
            );

            voiceTarget.insertAdjacentElement(
                "afterend",
                panel
            );
        }

        // --------------------------------------
        // 19C. EVIDENCE-TO-SOURCE MAPPING
        // --------------------------------------

        const evidenceRows = [];

        themes.forEach(theme => {
            const evidence = getArray(theme.evidence);

            evidence.forEach(item => {
                const commentId = Number(item.comment_id);

                const sourceComment =
                    Number.isInteger(commentId) &&
                    commentId > 0
                        ? (comments[commentId - 1] || null)
                        : null;

                evidenceRows.push([
                    getText(theme, ["theme", "name"]) ||
                        "General insight",

                    getText(item, ["author"]) ||
                        sourceComment?.author ||
                        "Anonymous",

                    getText(item, ["quote"]) ||
                        sourceComment?.text ||
                        "No quote available",

                    sourceComment
                        ? `Comment #${commentId}`
                        : "Source reference unavailable"
                ]);
            });
        });

        getArray(analysis.evidence).forEach(item => {
            const commentId = Number(item.comment_id);

            const sourceComment =
                Number.isInteger(commentId) &&
                commentId > 0
                    ? (comments[commentId - 1] || null)
                    : null;

            evidenceRows.push([
                getText(item, ["theme", "topic"]) ||
                    "General insight",

                getText(item, ["author"]) ||
                    sourceComment?.author ||
                    "Anonymous",

                getText(item, ["quote", "text"]) ||
                    sourceComment?.text ||
                    "No quote available",

                sourceComment
                    ? `Comment #${commentId}`
                    : "Source reference unavailable"
            ]);
        });

        // Remove duplicate evidence rows.

        const uniqueEvidenceRows = evidenceRows.filter(
            (row, index, array) => {
                return array.findIndex(item =>
                    item[0] === row[0] &&
                    item[1] === row[1] &&
                    item[2] === row[2]
                ) === index;
            }
        );

        // Display a maximum of 8 unique evidence rows.

        const limitedEvidenceRows = uniqueEvidenceRows.slice(0, 8);

        const evidenceTarget = $("evidenceList");

        if (
            limitedEvidenceRows.length &&
            evidenceTarget
        ) {
            const panel = createAnalyticsPanel(
                "Evidence-to-Source Mapping",
                "Trace selected insights back to the supporting audience comments."
            );

            panel.appendChild(
                createAnalyticsTable(
                    [
                        "Related theme",
                        "Author",
                        "Comment evidence",
                        "Source"
                    ],
                    limitedEvidenceRows
                )
            );

            evidenceTarget.insertAdjacentElement(
                "afterend",
                panel
            );
        }
    }

});
