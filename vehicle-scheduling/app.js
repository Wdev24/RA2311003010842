const axios = require("axios");
const Log = require("../logging_middleware/logger");
const { TOKEN } = require("../config");

const BASE = "http://20.207.122.201/evaluation-service"; // ← fixed IP
const headers = { Authorization: `Bearer ${TOKEN}` };

function knapsack(tasks, capacity) {
  const n = tasks.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const duration = tasks[i - 1].Duration;
    const impact = tasks[i - 1].Impact;
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - duration] + impact);
      }
    }
  }

  let w = capacity;
  const selected = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(tasks[i - 1].TaskID);
      w -= tasks[i - 1].Duration;
    }
  }

  return { totalImpact: dp[n][capacity], selectedTasks: selected };
}

async function main() {
  await Log("backend", "info", "service", "Fetching depots");
  const { data: depotData } = await axios.get(`${BASE}/depots`, { headers });

  await Log("backend", "info", "service", "Fetching vehicles");
  const { data: vehicleData } = await axios.get(`${BASE}/vehicles`, { headers });

  const depots = depotData.depots || depotData;
  const tasks = vehicleData.vehicles || vehicleData;

  const results = [];

  for (const depot of depots) {
    await Log("backend", "info", "service", `Processing depot ${depot.ID}`);
    const capacity = depot.MechanicHours;
    const { totalImpact, selectedTasks } = knapsack(tasks, capacity);

    const totalDuration = tasks
      .filter(t => selectedTasks.includes(t.TaskID))
      .reduce((sum, t) => sum + t.Duration, 0);

    results.push({
      depotId: depot.ID,
      selectedTasks,
      totalImpact,
      totalDuration
    });

    await Log("backend", "debug", "service", `Depot ${depot.ID} done, impact: ${totalImpact}`);
  }

  console.log(JSON.stringify(results, null, 2));
  await Log("backend", "info", "service", "Vehicle scheduling complete");
}

main().catch(async (e) => {
  await Log("backend", "error", "service", `Error: ${e.message}`);
  console.error(e.message);
});