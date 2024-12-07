const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = "/tmp/appointments.txt";

const cors = require('cors');
app.use(cors());

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

// Routes
app.get("/check-phone/:phone", (req, res) => {
    const phone = req.params.phone;
    const appointments = loadAppointmentsFromFile();
    const appointment = appointments.find((a) => a.phone === phone);
    if (appointment) {
        res.json({ exists: true, appointment });
    } else {
        res.json({ exists: false });
    }
});

app.post("/submit-booking", (req, res) => {
    try {
        const { name, phone, service, time, date, notes } = req.body;

        // Validate input
        if (!name || !phone || !service || !time || !date) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const appointments = loadAppointmentsFromFile();
        const index = appointments.findIndex((a) => a.phone === phone);

        if (index !== -1) {
            // Update existing appointment
            appointments[index] = { name, phone, service, time, date, notes };
            saveAppointmentsToFile(appointments);
            res.json({ message: "Appointment updated successfully!", updated: true });
        } else {
            // Add new appointment
            appointments.push({ name, phone, service, time, date, notes });
            saveAppointmentsToFile(appointments);
            res.json({ message: "Appointment booked successfully!", updated: false });
        }
    } catch (error) {
        console.error("Error processing /submit-booking:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    console.log("Received booking data:", req.body);

});

app.post("/modify-appointment", (req, res) => {
    const { phone, name, service, time, date, notes } = req.body;
console.log("say 1");


    if (!phone || !name || !service || !time || !date || !notes) {
        return res.status(400).json({ error: "All fields are required!" });
    }
    
console.log("say 2");

    let appointments = loadAppointmentsFromFile();
    const index = appointments.findIndex((a) => a.phone === phone);

    if (index !== -1) {
        appointments[index] = { phone, name, service, time, date, notes };
        saveAppointmentsToFile(appointments);
        res.json({ message: "Appointment updated successfully!" });
console.log("say 3");
    } else {
        res.status(404).json({ error: "Appointment not found!" });
    }
});


app.post("/cancel-appointment", (req, res) => {
    const { phone } = req.body;
    let appointments = loadAppointmentsFromFile();
    const initialLength = appointments.length;

    // Filter out the appointment with the given phone number
    const updatedAppointments = appointments.filter((a) => a.phone !== phone);

    if (updatedAppointments.length < initialLength) {
        // Appointment was found and removed
        saveAppointmentsToFile(updatedAppointments);
        res.json({ message: "Appointment canceled successfully!" });
    } else {
        // Appointment not found
        res.status(404).json({ error: "Appointment not found!" });
    }
});

// Serve React Frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../spa-booking-frontend/build/index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});