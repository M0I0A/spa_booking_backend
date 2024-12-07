const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Adjusted local file path for file read/write
const DATA_FILE = path.join(__dirname, "appointments.txt");

const cors = require('cors');
app.use(cors({ origin: "https://spa-booking-rouge.vercel.app" })); // Replace with your actual frontend domain

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Load appointments from file
const loadAppointmentsFromFile = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, "utf-8");
            return JSON.parse(data || "[]");
        }
    } catch (error) {
        console.error("Error reading appointments file:", error);
    }
    return [];
};

const saveAppointmentsToFile = (appointments) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2), "utf-8");
    } catch (error) {
        console.error("Error writing to appointments file:", error);
    }
};

// Handle routes
app.post("/submit-booking", (req, res) => {
    try {
        const { name, phone, service, time, date, notes } = req.body;

        if (!name || !phone || !service || !time || !date) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const appointments = loadAppointmentsFromFile();
        appointments.push({ name, phone, service, time, date, notes });
        saveAppointmentsToFile(appointments);

        res.status(200).json({ message: "Appointment successfully created." });
    } catch (error) {
        console.error("Error processing booking:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
