const express = require("express");
const router = express.Router();
const HealthMetric = require("../models/HealthMetric");

router.post("/", async (req, res) => {
  try {
    const { name, age, heartRate, bloodPressure, sugarLevel, weight } = req.body;

    const metric = new HealthMetric({
      name,
      age: Number(age),
      heartRate: Number(heartRate),
      bloodPressure,
      sugarLevel: Number(sugarLevel),
      weight: Number(weight),
    });

    const saved = await metric.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Health POST error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await HealthMetric.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error("Health GET error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, age, heartRate, bloodPressure, sugarLevel, weight } = req.body;

    const updated = await HealthMetric.findByIdAndUpdate(
      req.params.id,
      {
        name,
        age: Number(age),
        heartRate: Number(heartRate),
        bloodPressure,
        sugarLevel: Number(sugarLevel),
        weight: Number(weight),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Health record not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Health PUT error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await HealthMetric.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Health record not found" });
    }

    res.status(200).json({ message: "Health record deleted successfully" });
  } catch (err) {
    console.error("Health DELETE error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;