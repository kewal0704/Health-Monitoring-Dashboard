const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");

router.post("/", async (req, res) => {
  try {
    const { patientName, doctorName, date, time, reason } = req.body;

    const appointment = new Appointment({
      patientName,
      doctorName,
      date,
      time,
      reason,
    });

    const saved = await appointment.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Appointment POST error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await Appointment.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error("Appointment GET error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Appointment DELETE error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;