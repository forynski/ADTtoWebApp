const express = require('express');
const http = require('http');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let digitalTwinsClient;

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

app.use(express.static(path.join(__dirname)));

const sendAccelerometerDataToClients = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

app.get('/api/accelerometer', async (req, res) => {
    try {
        if (!digitalTwinsClient) {
            await connectToAzureDigitalTwins();
        }

        const digitalTwinID = process.env.DIGITAL_TWIN_ID;
        const twinData = await digitalTwinsClient.getDigitalTwin(digitalTwinID);

        const accelerometerData = {
            x: twinData.body.x,
            y: twinData.body.y,
            z: twinData.body.z,
        };

        sendAccelerometerDataToClients(accelerometerData);

        res.json(accelerometerData);
    } catch (error) {
        console.error('Error fetching accelerometer data:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode,
        });
    }
});

wss.on('connection', (wss) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

const PORT = process.env.PORT || 3000;

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
