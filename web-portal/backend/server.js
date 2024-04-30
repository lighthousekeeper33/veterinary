require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const authenticate = require('./src/authenticate');

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

async function getAccessToken() {
    const tokenUrl = process.env.APPOINTMENTS_OAUTH_TOKEN_URL;
    const clientId = process.env.APPOINTMENTS_OAUTH_CLIENT_ID;
    const clientSecret = process.env.APPOINTMENTS_OAUTH_CLIENT_SECRET;

    try {
        const accessToken = await authenticate(tokenUrl, clientId, clientSecret);
        return accessToken;
    } catch (error) {
        console.error('Error obtaining access token:', error);
        throw error;
    }
}

app.get('/appointments', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).send('Email query parameter is required');
        }

        const accessToken = await getAccessToken();

        const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL;
        const response = await axios.get(`${appointmentServiceUrl}/appointments?email=${email}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

app.post('/create-appointment', async (req, res) => {
    try {
        const accessToken = await getAccessToken(); 

        const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL;
        if (!appointmentServiceUrl) {
            throw new Error('Appointment service URL is not defined in the environment variables');
        }

        const response = await axios.post(`${appointmentServiceUrl}/appointments`, req.body, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error forwarding appointment creation request:', error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
