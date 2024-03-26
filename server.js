// server.js

const express = require('express');
const http = require('http');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');

const app = express();
const server = http.createServer(app);

let digitalTwinsClient;
let isThresholdExceeded = false; // New variable to track threshold exceeding

// Function to establish the connection with Azure Digital Twins
const connectToAzureDigitalTwins = async () => {
    try {
        const endpointUrl = process.env.YOUR_DIGITAL_TWINS_ENDPOINT_URL;

        if (!endpointUrl) {
            console.error('Please provide a value for YOUR_DIGITAL_TWINS_ENDPOINT_URL in the environment variables.');
            process.exit(1);
        }

        const credential = new DefaultAzureCredential();
        digitalTwinsClient = new DigitalTwinsClient(endpointUrl, credential);

        console.log('Connected to Azure Digital Twins');
    } catch (error) {
        console.error('Error connecting to Azure Digital Twins:', error);
        process.exit(1);
    }
};

// Serve static files from the main directory
app.use(express.static(path.join(__dirname)));

// Define a function to get a value from contents
const getValueFromContents = (contents, propertyName) => {
    if (contents && contents.body) {
        const property = contents.body[propertyName];

        if (property !== undefined) {
            return property;
        } else {
            console.log(`Property '${propertyName}' not found in the contents.`);
            return 'N/A';
        }
    } else {
        console.log('Contents array or body property is undefined.');
        return 'N/A';
    }
};

// API endpoint to fetch accelerometer data
app.get('/api/accelerometer', async (req, res) => {
    try {
        // Check if the client is connected, and if not, establish the connection
        if (!digitalTwinsClient) {
            await connectToAzureDigitalTwins();
        }

        // Fetch accelerometer data from the Digital Twin
        const digitalTwinID = process.env.DIGITAL_TWIN_ID;
        const twinData = await digitalTwinsClient.getDigitalTwin(digitalTwinID);

        // Log fetched accelerometer data
        console.log('Fetched accelerometer data:', twinData);

        // Extract accelerometer data from the response
        const accelerometerData = {
            x: twinData.body.x,
            y: twinData.body.y,
            z: twinData.body.z,
        };

        // Update the digital twin if the threshold is exceeded
        if (isThresholdExceeded) {
            await digitalTwinsClient.updateDigitalTwin(digitalTwinID, [
                {
                    op: 'replace',
                    path: '/isThresholdExceeded',
                    value: true,
                },
            ]);
        }

        // Respond with the accelerometer data
        res.json(accelerometerData);
    } catch (error) {
        // Log the error information
        console.error('Error fetching accelerometer data:', error);

        // Send a detailed error response to help diagnose the issue
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

// Call the connectToAzureDigitalTwins function before starting the server
connectToAzureDigitalTwins()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error during server startup:', error);
        process.exit(1);
    });
