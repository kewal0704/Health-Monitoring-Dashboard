document.addEventListener("DOMContentLoaded", () => {
  const healthForm = document.getElementById("healthForm");
  const appointmentForm = document.getElementById("appointmentForm");
  const healthList = document.getElementById("healthList");
  const appointmentList = document.getElementById("appointmentList");
  const healthMessage = document.getElementById("healthMessage");
  const appointmentMessage = document.getElementById("appointmentMessage");
  const totalHealthRecords = document.getElementById("totalHealthRecords");
  const totalAppointments = document.getElementById("totalAppointments");
  const avgHeartRate = document.getElementById("avgHeartRate");
  const healthFormTitle = document.getElementById("healthFormTitle");
  const healthSubmitBtn = document.getElementById("healthSubmitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const healthId = document.getElementById("healthId");
  const hero = document.querySelector(".hero");
  const heroLight = document.getElementById("heroLight");
  const chartCanvas = document.getElementById("healthChart");
  const ctx = chartCanvas.getContext("2d");

  let healthDataCache = [];

  function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.style.color = isError ? "#fca5a5" : "#93c5fd";

    setTimeout(() => {
      element.textContent = "";
    }, 3000);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString();
  }

  function getHealthStatus(item) {
    if (item.heartRate > 120 || item.sugarLevel > 220) {
      return { text: "Critical", className: "critical" };
    }
    if (item.heartRate > 100 || item.sugarLevel > 160) {
      return { text: "Warning", className: "warning" };
    }
    return { text: "Normal", className: "normal" };
  }

  function resetHealthForm() {
    healthForm.reset();
    healthId.value = "";
    healthFormTitle.textContent = "Add Health Metrics";
    healthSubmitBtn.textContent = "Save Health Data";
    cancelEditBtn.classList.add("hidden");
  }

  function drawChart(data) {
    const width = chartCanvas.width;
    const height = chartCanvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(8, 18, 38, 1)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = 40 + i * 55;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 30, y);
      ctx.stroke();
    }

    if (!data.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px Segoe UI";
      ctx.fillText("No health data available for chart.", 70, height / 2);
      return;
    }

    const recent = [...data].slice(0, 6).reverse();
    const maxHeart = Math.max(...recent.map((d) => d.heartRate), 100);
    const chartHeight = height - 100;
    const chartWidth = width - 120;
    const stepX = recent.length > 1 ? chartWidth / (recent.length - 1) : chartWidth;

    ctx.beginPath();
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 3;

    recent.forEach((item, index) => {
      const x = 60 + index * stepX;
      const y = height - 50 - (item.heartRate / maxHeart) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    recent.forEach((item, index) => {
      const x = 60 + index * stepX;
      const y = height - 50 - (item.heartRate / maxHeart) * chartHeight;

      ctx.beginPath();
      ctx.fillStyle = "#93c5fd";
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px Segoe UI";
      ctx.fillText(item.name.slice(0, 8), x - 15, height - 20);

      ctx.fillStyle = "#60a5fa";
      ctx.fillText(String(item.heartRate), x - 10, y - 12);
    });

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Heart Rate Trend", 60, 28);
  }

  async function loadHealthMetrics() {
    try {
      const res = await fetch("/api/health");

      if (!res.ok) {
        throw new Error("Failed to fetch health records");
      }

      const data = await res.json();
      healthDataCache = data;
      healthList.innerHTML = "";
      totalHealthRecords.textContent = data.length;

      if (data.length > 0) {
        const avg = Math.round(
          data.reduce((sum, item) => sum + Number(item.heartRate || 0), 0) / data.length
        );
        avgHeartRate.textContent = avg;
      } else {
        avgHeartRate.textContent = "0";
      }

      if (data.length === 0) {
        healthList.innerHTML = `<p class="empty-state">No health records saved yet.</p>`;
        drawChart([]);
        return;
      }

      data.forEach((item) => {
        const status = getHealthStatus(item);

        healthList.innerHTML += `
          <div class="record-card">
            <h4>${item.name}</h4>
            <p><strong>Age:</strong> ${item.age}</p>
            <p><strong>Heart Rate:</strong> ${item.heartRate}</p>
            <p><strong>Blood Pressure:</strong> ${item.bloodPressure}</p>
            <p><strong>Sugar Level:</strong> ${item.sugarLevel}</p>
            <p><strong>Weight:</strong> ${item.weight} kg</p>
            <span class="badge ${status.className}">${status.text}</span>

            <div class="card-actions">
              <button class="action-btn edit-btn" onclick="editHealthRecord('${item._id}')">Edit</button>
              <button class="action-btn delete-btn" onclick="deleteHealthRecord('${item._id}')">Delete</button>
            </div>
          </div>
        `;
      });

      drawChart(data);
    } catch (error) {
      console.error("Health load error:", error);
      healthList.innerHTML = `<p class="empty-state">Unable to load health records.</p>`;
      drawChart([]);
    }
  }

  async function loadAppointments() {
    try {
      const res = await fetch("/api/appointments");

      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await res.json();
      appointmentList.innerHTML = "";
      totalAppointments.textContent = data.length;

      if (data.length === 0) {
        appointmentList.innerHTML = `<p class="empty-state">No appointments booked yet.</p>`;
        return;
      }

      data.forEach((item) => {
        appointmentList.innerHTML += `
          <div class="appointment-card">
            <h4>${item.patientName}</h4>
            <p><strong>Doctor:</strong> ${item.doctorName}</p>
            <p><strong>Date:</strong> ${formatDate(item.date)}</p>
            <p><strong>Time:</strong> ${item.time}</p>
            <p><strong>Reason:</strong> ${item.reason}</p>

            <div class="card-actions">
              <button class="action-btn delete-btn" onclick="deleteAppointment('${item._id}')">Delete</button>
            </div>
          </div>
        `;
      });
    } catch (error) {
      console.error("Appointment load error:", error);
      appointmentList.innerHTML = `<p class="empty-state">Unable to load appointments.</p>`;
    }
  }

  healthForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value.trim(),
      age: document.getElementById("age").value,
      heartRate: document.getElementById("heartRate").value,
      bloodPressure: document.getElementById("bloodPressure").value.trim(),
      sugarLevel: document.getElementById("sugarLevel").value,
      weight: document.getElementById("weight").value,
    };

    const id = healthId.value.trim();
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/health/${id}` : "/api/health";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Health data save failed");
      }

      resetHealthForm();
      showMessage(
        healthMessage,
        id ? "Health record updated successfully" : "Health record saved successfully"
      );
      await loadHealthMetrics();
    } catch (error) {
      console.error("Health submit error:", error);
      showMessage(healthMessage, error.message, true);
    }
  });

  appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      patientName: document.getElementById("patientName").value.trim(),
      doctorName: document.getElementById("doctorName").value.trim(),
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      reason: document.getElementById("reason").value.trim(),
    };

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Appointment booking failed");
      }

      appointmentForm.reset();
      showMessage(appointmentMessage, "Appointment booked successfully");
      await loadAppointments();
    } catch (error) {
      console.error("Appointment submit error:", error);
      showMessage(appointmentMessage, error.message, true);
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    resetHealthForm();
  });

  window.editHealthRecord = function (id) {
    const record = healthDataCache.find((item) => item._id === id);
    if (!record) return;

    healthId.value = record._id;
    document.getElementById("name").value = record.name;
    document.getElementById("age").value = record.age;
    document.getElementById("heartRate").value = record.heartRate;
    document.getElementById("bloodPressure").value = record.bloodPressure;
    document.getElementById("sugarLevel").value = record.sugarLevel;
    document.getElementById("weight").value = record.weight;

    healthFormTitle.textContent = "Edit Health Metrics";
    healthSubmitBtn.textContent = "Update Health Data";
    cancelEditBtn.classList.remove("hidden");

    document.getElementById("forms").scrollIntoView({ behavior: "smooth" });
  };

  window.deleteHealthRecord = async function (id) {
    const ok = confirm("Are you sure you want to delete this health record?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/health/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Delete failed");
      }

      showMessage(healthMessage, "Health record deleted successfully");
      await loadHealthMetrics();
    } catch (error) {
      console.error("Delete health error:", error);
      showMessage(healthMessage, error.message, true);
    }
  };

  window.deleteAppointment = async function (id) {
    const ok = confirm("Are you sure you want to delete this appointment?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Delete failed");
      }

      showMessage(appointmentMessage, "Appointment deleted successfully");
      await loadAppointments();
    } catch (error) {
      console.error("Delete appointment error:", error);
      showMessage(appointmentMessage, error.message, true);
    }
  };

  const revealElements = document.querySelectorAll(".reveal");

  function revealOnScroll() {
    revealElements.forEach((el) => {
      const windowHeight = window.innerHeight;
      const top = el.getBoundingClientRect().top;

      if (top < windowHeight - 100) {
        el.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    heroLight.style.left = `${x}px`;
    heroLight.style.top = `${y}px`;
  });

  hero.addEventListener("mouseleave", () => {
    heroLight.style.left = "50%";
    heroLight.style.top = "30%";
  });

  loadHealthMetrics();
  loadAppointments();
});