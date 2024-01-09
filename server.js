const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Azure Digital Twins configuration
const endpointUrl = process.env.YOUR_DIGITAL_TWINS_ENDPOINT_URL;
const digitalTwinID = process.env.DIGITAL_TWIN_ID;
const credential = new DefaultAzureCredential();

const digitalTwinsClient = new DigitalTwinsClient(endpointUrl, credential);

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// API endpoint to fetch accelerometer data
app.get('/api/accelerometer', async (req, res) => {
    try {
        // Fetch accelerometer data from Azure Digital Twins
        const twinData = await digitalTwinsClient.getDigitalTwin(digitalTwinID);

        // Extract accelerometer properties (replace these with your actual property names)
        const accelerometerData = {
            x: twinData.contents[0].x,
            y: twinData.contents[1].y,
            z: twinData.contents[2].z,
        };

        res.json(accelerometerData);
    } catch (error) {
        console.error('Error fetching accelerometer data:', error);

        // Log the entire error object, including the stack trace
        console.error(error);

        // Send a more detailed error response to help diagnose the issue
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('A client connected');

    // Example: Emit data to the client every 2 seconds
    setInterval(async () => {
        try {
            const twinData = await digitalTwinsClient.getDigitalTwin(digitalTwinID);

            // Extract accelerometer properties for real-time updates
            const realTimeAccelerometerData = {
                x: twinData.contents[0].x,
                y: twinData.contents[1].y,
                z: twinData.contents[2].z,
            };

            socket.emit('accelerometerData', realTimeAccelerometerData);
        } catch (error) {
            console.error('Error fetching real-time accelerometer data:', error);
        }
    }, 2000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

