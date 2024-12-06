const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "/tmp/appointments.txt";

const cors = require("cors");
app.use(cors({ origin: "*" }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

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
    const { name, phone, service, time, date, notes } = req.body;

    if (!name || !phone || !service || !time || !date) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const appointments = loadAppointmentsFromFile();
    const index = appointments.findIndex((a) => a.phone === phone);

    if (index !== -1) {
        appointments[index] = { name, phone, service, time, date, notes };
        saveAppointmentsToFile(appointments);
        return res.json({ message: "Appointment updated successfully!" });
    }

    appointments.push({ name, phone, service, time, date, notes });
    saveAppointmentsToFile(appointments);
    res.json({ message: "Appointment booked successfully!" });
});

app.post("/modify-appointment", (req, res) => {
    const { phone, name, service, time, date, notes } = req.body;

    if (!phone || !name || !service || !time || !date || !notes) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const appointments = loadAppointmentsFromFile();
    const index = appointments.findIndex((a) => a.phone === phone);

    if (index !== -1) {
        appointments[index] = { phone, name, service, time, date, notes };
        saveAppointmentsToFile(appointments);
        return res.json({ message: "Appointment updated successfully!" });
    }

    res.status(404).json({ error: "Appointment not found!" });
});

app.post("/cancel-appointment", (req, res) => {
    const { phone } = req.body;
    const appointments = loadAppointmentsFromFile();
    const updatedAppointments = appointments.filter((a) => a.phone !== phone);

    if (updatedAppointments.length !== appointments.length) {
        saveAppointmentsToFile(updatedAppointments);
        return res.json({ message: "Appointment canceled successfully!" });
    }

    res.status(404).json({ error: "Appointment not found!" });
});

const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
