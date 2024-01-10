const express = require('express');
const http = require('http');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');

const app = express();
const server = http.createServer(app);

// Azure Digital Twins configuration
const endpointUrl = process.env.YOUR_DIGITAL_TWINS_ENDPOINT_URL;
const digitalTwinID = process.env.DIGITAL_TWIN_ID;

if (!endpointUrl || !digitalTwinID) {
    console.error('Please provide values for YOUR_DIGITAL_TWINS_ENDPOINT_URL and DIGITAL_TWIN_ID in the environment variables.');
    process.exit(1);
}

const credential = new DefaultAzureCredential();
const digitalTwinsClient = new DigitalTwinsClient(endpointUrl, credential);

// Serve static files from the main directory
app.use(express.static(path.join(__dirname)));

// API endpoint to fetch accelerometer data
app.get('/api/accelerometer', async (req, res) => {
    try {
        const twinData = await digitalTwinsClient.getDigitalTwin(digitalTwinID);
        console.log('Fetched accelerometer data:', twinData);

        const accelerometerData = {
            x: twinData.contents[0]?.x || 'N/A',
            y: twinData.contents[1]?.y || 'N/A',
            z: twinData.contents[2]?.z || 'N/A',
        };

        res.json(accelerometerData);
    } catch (error) {
        console.error('Error fetching accelerometer data:', error);

        // Log the entire error object, including the stack trace
        console.error(error);

        // Log specific details from the error object
        console.error('Error details:', error.message, error.code, error.statusCode);

        // Send a more detailed error response to help diagnose the issue
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode,
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
