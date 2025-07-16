document.addEventListener('DOMContentLoaded', () => {
    const deviceSelector = document.getElementById('deviceSelector');
    const latestCpuUsage = document.getElementById('latestCpuUsage');
    const latestHeapFree = document.getElementById('latestHeapFree');
    const latestMinHeapFree = document.getElementById('latestMinHeapFree');
    const latestTaskCount = document.getElementById('latestTaskCount');
    const latestStackHWM = document.getElementById('latestStackHWM');
    const latestTimestamp = document.getElementById('latestTimestamp');
    const rawDataLogBody = document.querySelector('#rawDataLog tbody');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // --- Chart Instances ---
    let cpuChart;
    let heapChart;

    const BACKEND_URL = 'http://YOUR_BACKEND_SERVER_IP_OR_HOSTNAME:5000'; // IMPORTANT: Replace with your backend URL

    let selectedDeviceId = '';
    const dataLimit = 50; // Number of records to fetch for historical data
    let offset = 0;

    // --- Functions ---

    async function fetchDevices() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/devices`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const devices = await response.json();
            deviceSelector.innerHTML = ''; // Clear existing options
            if (devices.length === 0) {
                deviceSelector.innerHTML = '<option value="">No devices found</option>';
                return;
            }
            devices.forEach(deviceId => {
                const option = document.createElement('option');
                option.value = deviceId;
                option.textContent = deviceId;
                deviceSelector.appendChild(option);
            });
            selectedDeviceId = devices[0]; // Select the first device by default
            deviceSelector.value = selectedDeviceId;
            await fetchDataAndRender(); // Fetch data for the first device
        } catch (error) {
            console.error('Error fetching devices:', error);
            deviceSelector.innerHTML = '<option value="">Error loading devices</option>';
        }
    }

    async function fetchLatestData() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/latest_data`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Find the data for the currently selected device
            const latestDataForSelectedDevice = data.find(item => item.device_id === selectedDeviceId);

            if (latestDataForSelectedDevice) {
                updateLatestMetrics(latestDataForSelectedDevice);
            } else {
                clearLatestMetrics();
            }
        } catch (error) {
            console.error('Error fetching latest data:', error);
            clearLatestMetrics();
        }
    }

    async function fetchHistoricalData(loadMore = false) {
        if (!selectedDeviceId) return;

        if (!loadMore) {
            offset = 0; // Reset offset for new device or initial load
            rawDataLogBody.innerHTML = ''; // Clear table
            if (cpuChart) cpuChart.destroy(); // Destroy old charts
            if (heapChart) heapChart.destroy();
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/data/${selectedDeviceId}?limit=${dataLimit}&offset=${offset}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.length === 0 && !loadMore) {
                rawDataLogBody.innerHTML = '<tr><td colspan="6">No historical data for this device.</td></tr>';
                return;
            } else if (data.length === 0 && loadMore) {
                loadMoreBtn.style.display = 'none'; // Hide button if no more data
                return;
            }

            // Append new data to the table
            data.forEach(item => {
                const row = rawDataLogBody.insertRow();
                row.insertCell().textContent = new Date(item.timestamp).toLocaleString();
                row.insertCell().textContent = item.cpu_usage.toFixed(2);
                row.insertCell().textContent = item.heap_free;
                row.insertCell().textContent = item.min_heap_free;
                row.insertCell().textContent = item.task_count;
                row.insertCell().textContent = item.stack_hwm;
            });

            offset += data.length; // Update offset for next load

            // Prepare data for charts (only if not loading more, or if charts are not initialized)
            if (!loadMore || (!cpuChart && !heapChart)) {
                renderCharts(data);
            } else {
                // If charts exist, update them with new data
                updateCharts(data);
            }

            loadMoreBtn.style.display = 'block'; // Show button if data was loaded
        } catch (error) {
            console.error('Error fetching historical data:', error);
            if (!loadMore) {
                rawDataLogBody.innerHTML = '<tr><td colspan="6">Error loading historical data.</td></tr>';
            }
            loadMoreBtn.style.display = 'none';
        }
    }

    function updateLatestMetrics(data) {
        latestCpuUsage.textContent = `${data.cpu_usage.toFixed(2)} %`;
        latestHeapFree.textContent = `${data.heap_free} Bytes`;
        latestMinHeapFree.textContent = `${data.min_heap_free} Bytes`;
        latestTaskCount.textContent = data.task_count;
        latestStackHWM.textContent = `${data.stack_hwm} Bytes`;
        latestTimestamp.textContent = new Date(data.timestamp).toLocaleString();
    }

    function clearLatestMetrics() {
        latestCpuUsage.textContent = '-- %';
        latestHeapFree.textContent = '-- Bytes';
        latestMinHeapFree.textContent = '-- Bytes';
        latestTaskCount.textContent = '--';
        latestStackHWM.textContent = '-- Bytes';
        latestTimestamp.textContent = '--';
    }

    function renderCharts(data) {
        const timestamps = data.map(item => new Date(item.timestamp).toLocaleTimeString());
        const cpuUsages = data.map(item => item.cpu_usage);
        const heapFrees = data.map(item => item.heap_free);

        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        if (cpuChart) cpuChart.destroy(); // Destroy existing chart before creating a new one
        cpuChart = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: cpuUsages,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'CPU Usage (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });

        const heapCtx = document.getElementById('heapChart').getContext('2d');
        if (heapChart) heapChart.destroy(); // Destroy existing chart before creating a new one
        heapChart = new Chart(heapCtx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Free Heap (Bytes)',
                    data: heapFrees,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Free Heap (Bytes)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    function updateCharts(newData) {
        // This function is for appending new data to existing charts
        if (!cpuChart || !heapChart) {
            renderCharts(newData); // If charts not initialized, render them
            return;
        }

        newData.forEach(item => {
            const timestamp = new Date(item.timestamp).toLocaleTimeString();
            cpuChart.data.labels.push(timestamp);
            cpuChart.data.datasets[0].data.push(item.cpu_usage);
            heapChart.data.labels.push(timestamp);
            heapChart.data.datasets[0].data.push(item.heap_free);
        });

        // Limit data points to avoid performance issues with too many points
        const maxDataPoints = 100;
        if (cpuChart.data.labels.length > maxDataPoints) {
            const startIndex = cpuChart.data.labels.length - maxDataPoints;
            cpuChart.data.labels = cpuChart.data.labels.slice(startIndex);
            cpuChart.data.datasets[0].data = cpuChart.data.datasets[0].data.slice(startIndex);
            heapChart.data.labels = heapChart.data.labels.slice(startIndex);
            heapChart.data.datasets[0].data = heapChart.data.datasets[0].data.slice(startIndex);
        }

        cpuChart.update();
        heapChart.update();
    }


    async function fetchDataAndRender() {
        await fetchLatestData();
        await fetchHistoricalData();
    }

    // --- Event Listeners ---
    deviceSelector.addEventListener('change', (event) => {
        selectedDeviceId = event.target.value;
        fetchDataAndRender(); // Fetch data for the newly selected device
    });

    loadMoreBtn.addEventListener('click', () => {
        fetchHistoricalData(true); // Load more data
    });

    // Initial fetch when the page loads
    fetchDevices();
    // Set up an interval to refresh latest data every 5 seconds
    setInterval(fetchLatestData, 5000);
});
