$(document).ready(function () {
    let isFetchingStarted = false;
    let x, y, z;
    let timestampCounter = 0;

    // Create an empty array to store accelerometer data for chart
    let accelerometerChartData = [];

    // Create the chart context
    const ctx = document.getElementById('accelerometerChart').getContext('2d');
    const accelerometerChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'X',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [],
                    cubicInterpolationMode: 'monotone',
                },
                {
                    label: 'Y',
                    borderColor: 'rgb(75, 192, 192)',
                    data: [],
                    cubicInterpolationMode: 'monotone',
                },
                {
                    label: 'Z',
                    borderColor: 'rgb(54, 162, 235)',
                    data: [],
                    cubicInterpolationMode: 'monotone',
                },
            ],
        },
        options: {
            animation: {
                duration: 0, // Turn off animation
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        stepSize: 1, // Adjust the step size based on your preference
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                },
            },
        },
    });

    // Function to update the chart with new data
    const updateChart = () => {
        accelerometerChart.data.datasets[0].data = accelerometerChartData.map(entry => ({ x: entry.timestamp, y: entry.x }));
        accelerometerChart.data.datasets[1].data = accelerometerChartData.map(entry => ({ x: entry.timestamp, y: entry.y }));
        accelerometerChart.data.datasets[2].data = accelerometerChartData.map(entry => ({ x: entry.timestamp, y: entry.z }));

        // Limit the number of data points to keep the chart clean
        const maxDataPoints = 20; // Adjust the maximum data points based on your preference
        if (accelerometerChartData.length > maxDataPoints) {
            accelerometerChartData.shift();
        }

        // Update the chart
        accelerometerChart.update();

        // Log chart data for debugging
        console.log('Chart Data:', accelerometerChart.data);

        // Update every 2s (2000) or 0.2 (200)
        setTimeout(updateAccelerometerData, 200);
    };

    const updateAccelerometerData = () => {
        if (isFetchingStarted) {
            $.ajax({
                url: '/api/accelerometer',
                method: 'GET',
                dataType: 'json',
                success: (data) => {
                    // Update the values
                    x = data.accelerometerData.x;
                    y = data.accelerometerData.y;
                    z = data.accelerometerData.z;

                    // Log values for debugging
                    console.log('X:', x, 'Y:', y, 'Z:', z);

                    // Update the displayed values
                    $('#xValue').text(x);
                    $('#yValue').text(y);
                    $('#zValue').text(z);

                    // Check if the threshold is exceeded
                    if (data.threshold) {
                        alert('Warning: Accelerometer threshold exceeded!');
                    }

                    // Update the chart with new data
                    accelerometerChartData.push({ timestamp: timestampCounter++, x, y, z });
                    updateChart();
                },
                error: (xhr, status, error) => {
                    console.error('Error fetching accelerometer data:', xhr, status, error);
                    setTimeout(updateAccelerometerData, 200);
                }
            });
        }
    };

    $('#toggleFetching').click(() => {
        isFetchingStarted = !isFetchingStarted;
        const buttonLabel = isFetchingStarted ? 'Stop Fetching Data' : 'Start Fetching Data';
        $('#toggleFetching').text(buttonLabel);

        if (isFetchingStarted) {
            updateAccelerometerData();
        }
    });
});

