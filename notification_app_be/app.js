const express = require("express");
const axios = require("axios");
const Log = require("../logging_middleware/logger");
const { TOKEN } = require("../config");

const app = express();
app.use(express.json());

const BASE = "http://20.207.122.201/evaluation-service"; // ← fixed IP
const headers = { Authorization: `Bearer ${TOKEN}` };
const PRIORITY = { Placement: 3, Result: 2, Event: 1 };

app.get("/notifications", async (req, res) => {
  await Log("backend", "info", "route", "GET /notifications called");
  const n = parseInt(req.query.n) || 5;

  try {
    await Log("backend", "info", "service", "Fetching notifications from API");
    const { data } = await axios.get(`${BASE}/notifications`, { headers });

    const notifications = data.notifications || data;

    await Log("backend", "debug", "service", "Sorting by priority and timestamp");
    const sorted = notifications.sort((a, b) => {
      if (PRIORITY[b.Type] !== PRIORITY[a.Type]) {
        return PRIORITY[b.Type] - PRIORITY[a.Type];
      }
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    const topN = sorted.slice(0, n);
    await Log("backend", "info", "controller", `Returning top ${n} notifications`);
    res.json(topN);
  } catch (e) {
    await Log("backend", "error", "controller", `Error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

app.listen(4000, () => console.log("Notification server on port 4000"));