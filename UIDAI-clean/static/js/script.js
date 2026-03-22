// ==========================================
// GLOBAL CHART VARIABLES
// ==========================================
let myChart = null;
let anomChart = null;
let analyticsChart = null;
let granularInitialized = false;

// ==========================================
// INITIAL LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);

    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    loadDashboardStates();
});

// ==========================================
// TIME
// ==========================================
function updateTime() {
    const el = document.getElementById('last-updated');
    if (!el) return;
    el.innerHTML = `<i class="fas fa-clock"></i> Updated: ${new Date().toLocaleTimeString()}`;
}

// ==========================================
// TAB SWITCHING (CRITICAL FIX)
// ==========================================
function switchTab(tabName) {
    document.querySelectorAll('.nav-tabs button')
        .forEach(b => b.classList.remove('active'));

    document.getElementById(`nav-${tabName}`).classList.add('active');

    ['dashboard', 'analytics', 'anomaly'].forEach(v => {
        const view = document.getElementById(`view-${v}`);
        if (view) view.style.display = 'none';
    });

    document.getElementById(`view-${tabName}`).style.display = 'block';

    if (tabName === 'analytics') initGranularOnce();
    if (tabName === 'dashboard' && myChart) myChart.resize();
    if (tabName === 'anomaly' && anomChart) anomChart.resize();
}

// ==========================================
// DASHBOARD
// ==========================================
function loadDashboardStates() {
    fetch('/api/states')
        .then(r => r.json())
        .then(states => {
            const sel1 = document.getElementById('stateSelect');
            const sel2 = document.getElementById('anom-stateSelect');

            [sel1, sel2].forEach(sel => {
                if (!sel) return;
                sel.innerHTML = '';
                states.forEach(s => sel.add(new Option(s, s)));
            });

            loadDashboard('All India');
        });
}

document.getElementById('stateSelect')?.addEventListener('change', e => {
    loadDashboard(e.target.value);
});

document.getElementById('anom-stateSelect')?.addEventListener('change', e => {
    loadDashboard(e.target.value);
    document.getElementById('stateSelect').value = e.target.value;
});

function loadDashboard(region) {
    fetch(`/api/dashboard?region=${encodeURIComponent(region)}`)
        .then(r => r.json())
        .then(d => {
            if (d.error) return;

            setText('val-demand', d.metrics.total_demand);
            setText('val-daily-avg', d.metrics.daily_avg);
            setText('val-date', d.metrics.peak_date);
            setText('val-zone', d.metrics.top_zone);
            setText('val-conf', d.metrics.confidence);
            setText('val-kits', d.resources.kits);
            setText('anom-kits-count', d.resources.kits);

            renderDashboardChart(d.chart.labels, d.chart.data);
            renderAnomChart(d.chart.labels, d.chart.data, d.chart.upper, d.chart.lower, d.chart.base);
        });
}

// ==========================================
// DASHBOARD CHARTS
// ==========================================
function renderDashboardChart(labels, data) {
    const ctx = document.getElementById('demandChart')?.getContext('2d');
    if (!ctx) return;
    if (myChart) myChart.destroy();

    myChart = baseLineChart(ctx, labels, data, 'Forecast');
}

function renderAnomChart(labels, data, upper, lower, base) {
    const ctx = document.getElementById('anomDemandChart')?.getContext('2d');
    if (!ctx) return;
    if (anomChart) anomChart.destroy();

    anomChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                line('Upper Threshold', upper, '#dc2626', true),
                line('Base Line', base, '#6b7280'),
                fillLine('Predicted Demand', data, '#2563eb'),
                line('Lower Threshold', lower, '#dc2626', true)
            ]
        },
        options: chartOptions()
    });
}

function baseLineChart(ctx, labels, data, label) {
    return new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [fillLine(label, data, '#2563eb')] },
        options: chartOptions(false)
    });
}

// ==========================================
// GRANULAR ANALYTICS (FIXED)
// ==========================================
function initGranularOnce() {
    if (granularInitialized) return;
    granularInitialized = true;

    loadGranularStates();

    document.getElementById('ana-analyze')
        ?.addEventListener('click', fetchGranularGraph);
}

function loadGranularStates() {
    const sel = document.getElementById('ana-state');
    if (!sel) return;

    sel.innerHTML = '<option value="">Select State</option>';

    fetch('/api/granular/states')
        .then(r => r.json())
        .then(states => states.forEach(s => sel.add(new Option(s, s))));

    sel.addEventListener('change', () => {
        const dSel = document.getElementById('ana-district');
        dSel.innerHTML = '<option value="">Loading...</option>'; // Visual feedback
    
    if (!sel.value) return;

    fetch(`/api/granular/districts?state=${encodeURIComponent(sel.value)}`)
        .then(r => r.json())
        .then(dists => {
            console.log("Districts received:", dists); // Debugging line
            dSel.innerHTML = '<option value="">Select District</option>';
            dists.forEach(d => dSel.add(new Option(d, d)));
            dSel.disabled = false;
        });
    });
}

function fetchGranularGraph() {
    const district = document.getElementById('ana-district').value;
    if (!district) {
        alert('Please select a district first');
        return;
    }

    fetch(`/api/granular/data?district=${encodeURIComponent(district)}`)
        .then(r => r.json())
        .then(data => {
            if (data.error) return alert(data.error);
            if (data.data.length === 0) {
                alert('No data found for this district');
                return;
            }

            const ctx = document.getElementById('analyticsChart').getContext('2d');
            if (analyticsChart) analyticsChart.destroy();

            analyticsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: `Demand – ${district}`,
                        data: data.data,
                        backgroundColor: '#2563eb',
                        borderColor: '#1e40af',
                        borderWidth: 1
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true, // Forces scale to show actual values
                            ticks: { precision: 0 }
                        }
                    }
                }
            });
        });
}

// ==========================================
// HELPERS
// ==========================================
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function chartOptions(showLegend = true) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: showLegend } }
    };
}

function line(label, data, color, dashed = false) {
    return {
        label,
        data,
        borderColor: color,
        borderDash: dashed ? [5, 5] : [],
        fill: false,
        pointRadius: 0
    };
}

function fillLine(label, data, color) {
    return {
        label,
        data,
        borderColor: color,
        backgroundColor: color + '22',
        fill: true,
        tension: 0.4,
        pointRadius: 0
    };
}
