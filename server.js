const express = require('express');
const http = require('http');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');

const app = express();
const server = http.createServer(app);

let digitalTwinsClient;

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

        // Log the entire twinData object
        console.log('Fetched accelerometer data:', twinData);

        // Access properties based on the model information
        const accelerometerData = {
            x: getValueFromContents(twinData.contents, 'x'),
            y: getValueFromContents(twinData.contents, 'y'),
            z: getValueFromContents(twinData.contents, 'z'),
        };

        // Respond with the accelerometer data
        res.json(accelerometerData);
    } catch (error) {
        // Log the error information
        console.error('Error fetching accelerometer data:', error);

        // Log specific details from the error object
        console.error('Error details:', error.message, error.code, error.statusCode);

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

// Function to extract property value from contents array
const getValueFromContents = (contents, propertyName) => {
    const property = contents.find(prop => prop.name === propertyName);
    return property ? property.value : 'N/A';
};



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
