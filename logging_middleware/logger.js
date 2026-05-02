const axios = require("axios");
const https = require("https");
const { TOKEN } = require("../config");

const agent = new https.Agent({ rejectUnauthorized: false });

async function Log(stack, level, pkg, message) {
  try {
    console.log("Sending log...", { stack, level, pkg, message });
    await axios.post(
      "http://20.207.122.201/evaluation-service/logs",
      { stack, level, package: pkg, message },
      { 
        headers: { Authorization: `Bearer ${TOKEN}` },
        httpsAgent: agent
      }
    );
    console.log("Log sent ✅");
  } catch (e) {
    console.log("Log failed ❌:", e.message);
  }
}

module.exports = Log;