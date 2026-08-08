// Hydro-Shield AI Main JavaScript Handler

function updateVal(id, unit) {
    const input = document.getElementById(id);
    const label = document.getElementById('val_' + id);
    if (input && label) {
        label.innerText = input.value + unit;
    }
}

// Preset loader for Scenario 1
async function loadPreset(presetId) {
    try {
        const res = await fetch('/api/sample-presets');
        const presets = await res.json();
        const found = presets.find(p => p.id === presetId);
        if (found) {
            const d = found.data;
            document.getElementById('Jun_Sep').value = d.Jun_Sep;
            updateVal('Jun_Sep', ' mm');
            
            document.getElementById('Cloud_Visibility_Pct').value = d.Cloud_Visibility_Pct;
            updateVal('Cloud_Visibility_Pct', ' %');
            
            document.getElementById('Jan_Feb').value = d.Jan_Feb;
            updateVal('Jan_Feb', ' mm');
            
            document.getElementById('Mar_May').value = d.Mar_May;
            updateVal('Mar_May', ' mm');
            
            document.getElementById('Oct_Dec').value = d.Oct_Dec;
            updateVal('Oct_Dec', ' mm');
            
            document.getElementById('ANNUAL').value = d.ANNUAL;
            updateVal('ANNUAL', ' mm');
            
            document.getElementById('Elevation_m').value = d.Elevation_m;
            updateVal('Elevation_m', ' m');
            
            document.getElementById('Max_Temp_C').value = d.Max_Temp_C;
            updateVal('Max_Temp_C', ' °C');
            
            // Trigger inference automatically
            document.getElementById('predictionForm').requestSubmit();
        }
    } catch (err) {
        console.error("Error loading preset:", err);
    }
}

// Scenario 1 Prediction Execution
async function runPrediction(e) {
    if (e) e.preventDefault();
    
    const payload = {
        ANNUAL: parseFloat(document.getElementById('ANNUAL').value),
        Jan_Feb: parseFloat(document.getElementById('Jan_Feb').value),
        Mar_May: parseFloat(document.getElementById('Mar_May').value),
        Jun_Sep: parseFloat(document.getElementById('Jun_Sep').value),
        Oct_Dec: parseFloat(document.getElementById('Oct_Dec').value),
        Cloud_Visibility_Pct: parseFloat(document.getElementById('Cloud_Visibility_Pct').value),
        Elevation_m: parseFloat(document.getElementById('Elevation_m').value),
        Max_Temp_C: parseFloat(document.getElementById('Max_Temp_C').value),
        model: document.getElementById('modelSelect').value
    };
    
    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            updatePredictionUI(data);
        }
    } catch (err) {
        console.error("Prediction API error:", err);
    }
}

function updatePredictionUI(data) {
    const prob = data.flood_probability;
    const advisory = data.advisory;
    
    // Update Gauge Percent
    const riskPercent = document.getElementById('riskPercent');
    if (riskPercent) riskPercent.innerText = prob.toFixed(1) + '%';
    
    // Update Badge
    const badge = document.getElementById('riskBadge');
    if (badge) {
        badge.className = 'risk-badge ' + advisory.badge_class;
        badge.innerText = advisory.level;
    }
    
    // Update Advisory Box
    const actionEl = document.getElementById('advisoryAction');
    if (actionEl) actionEl.innerText = advisory.action;
    
    const timeEl = document.getElementById('timeWindow');
    if (timeEl) timeEl.innerText = advisory.time_window;
    
    const advisoryBox = document.getElementById('advisoryContainer');
    if (advisoryBox) advisoryBox.style.borderLeftColor = advisory.color;
    
    const listEl = document.getElementById('advisoryList');
    if (listEl) {
        listEl.innerHTML = advisory.recommendations.map(r => `<li>${r}</li>`).join('');
    }
    
    // Render Multi-Model comparison cards
    const cardsEl = document.getElementById('multiModelCards');
    if (cardsEl && data.all_model_predictions) {
        let html = '';
        for (const [mName, mRes] of Object.entries(data.all_model_predictions)) {
            const isSelected = mName === data.selected_model;
            const badgeClass = mRes.probability >= 50 ? 'badge-danger' : 'badge-success';
            html += `
                <div class="model-card ${isSelected ? 'featured' : ''}">
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${mName}</div>
                    <div style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: ${mRes.probability >= 50 ? '#ef4444' : '#22c55e'};">
                        ${mRes.probability}%
                    </div>
                    <span class="risk-badge ${badgeClass}" style="font-size: 0.7rem; padding: 2px 8px;">${mRes.label}</span>
                </div>
            `;
        }
        cardsEl.innerHTML = html;
    }
}

// Scenario 2: Disaster Response Multi-District Monitoring & Resource Allocation
async function runBatchAnalysis() {
    const mockRegions = [
        { Subdivision: "Kerala District 01 (Wayanad Basin)", Jun_Sep: 2100, Cloud_Visibility_Pct: 15, Elevation_m: 20, ANNUAL: 3100 },
        { Subdivision: "Assam District 04 (Barpeta)", Jun_Sep: 1850, Cloud_Visibility_Pct: 22, Elevation_m: 15, ANNUAL: 2800 },
        { Subdivision: "Konkan District 02 (Ratnagiri)", Jun_Sep: 1650, Cloud_Visibility_Pct: 35, Elevation_m: 45, ANNUAL: 2450 },
        { Subdivision: "West Bengal (Malda Lowlands)", Jun_Sep: 1420, Cloud_Visibility_Pct: 40, Elevation_m: 25, ANNUAL: 2100 },
        { Subdivision: "Bihar District 03 (Kosi Belt)", Jun_Sep: 1280, Cloud_Visibility_Pct: 52, Elevation_m: 55, ANNUAL: 1850 },
        { Subdivision: "Gujarat Coastal Region", Jun_Sep: 850, Cloud_Visibility_Pct: 75, Elevation_m: 120, ANNUAL: 1100 }
    ];
    
    try {
        const res = await fetch('/api/batch-predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regions: mockRegions, model: 'XGBoost' })
        });
        const data = await res.json();
        if (data.status === 'success') {
            renderResponseTable(data.data);
        }
    } catch (err) {
        console.error("Batch response API error:", err);
    }
}

function renderResponseTable(regions) {
    const tbody = document.getElementById('responseTableBody');
    if (!tbody) return;
    
    let html = '';
    regions.forEach((r, idx) => {
        const badgeClass = r.priority === 'CRITICAL' ? 'badge-danger' : (r.priority === 'HIGH' ? 'badge-warning' : (r.priority === 'MEDIUM' ? 'badge-moderate' : 'badge-success'));
        html += `
            <tr>
                <td style="font-weight: 700; font-family: var(--font-mono);">#${idx + 1}</td>
                <td style="font-weight: 600;">${r.region}</td>
                <td style="font-family: var(--font-mono); font-weight: 700; color: ${r.risk_score >= 50 ? '#ef4444' : '#22c55e'};">${r.risk_score}%</td>
                <td><span class="risk-badge ${badgeClass}">${r.priority}</span></td>
                <td style="font-weight: 700; color: var(--accent-cyan);">🚤 ${r.rescue_boats} Boats</td>
                <td>💊 ${r.medical_kits} Kits</td>
                <td>🧱 ${r.sandbags_units.toLocaleString()} Units</td>
                <td>👨‍🚒 ${r.relief_personnel} Officers</td>
                <td>🚌 ${r.evacuation_buses} Buses</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Scenario 3: Model Benchmarks & Validation
async function loadBenchmarkMetrics() {
    try {
        const res = await fetch('/api/metrics');
        const metrics = await res.json();
        
        renderBenchmarkCards(metrics);
        renderMetricsTable(metrics);
        renderCharts(metrics);
    } catch (err) {
        console.error("Error loading benchmark metrics:", err);
    }
}

function renderBenchmarkCards(metrics) {
    const container = document.getElementById('benchmarkCards');
    if (!container) return;
    
    let html = '';
    for (const [mName, mData] of Object.entries(metrics)) {
        const isXGB = mName === 'XGBoost';
        html += `
            <div class="model-card ${isXGB ? 'featured' : ''}">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">${mName}</div>
                <div style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-mono); margin: 8px 0; color: ${isXGB ? 'var(--accent-cyan)' : '#fff'};">
                    ${mData.accuracy}%
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">ACCURACY SCORE</div>
                
                <div class="metric-grid">
                    <div class="metric-item">
                        <span>Precision</span>
                        <strong>${mData.precision}%</strong>
                    </div>
                    <div class="metric-item">
                        <span>Recall</span>
                        <strong>${mData.recall}%</strong>
                    </div>
                    <div class="metric-item">
                        <span>F1-Score</span>
                        <strong>${mData.f1_score}%</strong>
                    </div>
                    <div class="metric-item">
                        <span>ROC AUC</span>
                        <strong>${mData.roc_auc}</strong>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderMetricsTable(metrics) {
    const tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;
    
    let html = '';
    for (const [mName, mData] of Object.entries(metrics)) {
        const isXGB = mName === 'XGBoost';
        html += `
            <tr style="${isXGB ? 'background: rgba(56, 189, 248, 0.05);' : ''}">
                <td style="font-weight: 700; color: ${isXGB ? 'var(--accent-cyan)' : '#fff'};">${mName}</td>
                <td style="font-family: var(--font-mono); font-weight: 800;">${mData.accuracy}%</td>
                <td style="font-family: var(--font-mono);">${mData.precision}%</td>
                <td style="font-family: var(--font-mono);">${mData.recall}%</td>
                <td style="font-family: var(--font-mono);">${mData.f1_score}%</td>
                <td style="font-family: var(--font-mono);">${mData.roc_auc}</td>
                <td>
                    <span class="risk-badge ${isXGB ? 'badge-success' : 'badge-moderate'}">
                        ${isXGB ? 'RECOMMENDED DEPLOYMENT' : 'VALIDATED'}
                    </span>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

function renderCharts(metrics) {
    const accCtx = document.getElementById('accuracyChart');
    if (accCtx) {
        const labels = Object.keys(metrics);
        const accuracies = labels.map(l => metrics[l].accuracy);
        const f1Scores = labels.map(l => metrics[l].f1_score);
        
        new Chart(accCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Accuracy (%)',
                        data: accuracies,
                        backgroundColor: '#38bdf8'
                    },
                    {
                        label: 'F1-Score (%)',
                        data: f1Scores,
                        backgroundColor: '#3b82f6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#9ca3af' } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { min: 80, max: 100, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
    
    const featCtx = document.getElementById('featureImportanceChart');
    if (featCtx && metrics['XGBoost'] && metrics['XGBoost'].feature_importance) {
        const feats = metrics['XGBoost'].feature_importance;
        const labels = feats.map(f => f.feature);
        const dataVals = feats.map(f => f.importance);
        
        new Chart(featCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Feature Weight',
                    data: dataVals,
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#9ca3af' } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
}

// Auto init on page load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    if (form) {
        runPrediction();
    }
    
    if (document.getElementById('responseTable')) {
        runBatchAnalysis();
    }
    
    if (document.getElementById('benchmarkCards')) {
        loadBenchmarkMetrics();
    }
});
