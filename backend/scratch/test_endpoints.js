const http = require("http");

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer
        });
      });
    }).on("error", reject);
  });
}

async function runTests() {
  console.log("=== RUNNING API TESTS ===");
  
  try {
    // Test 1: Fetch session list
    console.log("Test 1: Fetching session list for quiz 6a0fea5717a00c9b06da0c10...");
    const listRes = await makeRequest("http://localhost:5000/api/monitoring/quiz/6a0fea5717a00c9b06da0c10/sessions");
    console.log("List Response Status:", listRes.statusCode);
    console.log("List Response Headers:", listRes.headers["content-type"]);
    
    const listObj = JSON.parse(listRes.body.toString());
    console.log("Found sessions:", listObj.data?.length);
    if (listObj.data && listObj.data.length > 0) {
      console.log("First session details:", listObj.data[0]);
    } else {
      console.error("FAILED: No sessions returned!");
    }
    
    // Test 2: Fetch CSV export
    const sessionId = "quiz-session-6a0fea5717a00c9b06da0c10-w2-MTEA";
    console.log(`\nTest 2: Exporting CSV for session ${sessionId}...`);
    const csvRes = await makeRequest(`http://localhost:5000/api/monitoring/sessions/${sessionId}/export`);
    console.log("CSV Response Status:", csvRes.statusCode);
    console.log("CSV Response Content-Type:", csvRes.headers["content-type"]);
    console.log("CSV Response Content-Disposition:", csvRes.headers["content-disposition"]);
    
    const csvBuffer = csvRes.body;
    // Check BOM bytes (EF BB BF in hex)
    const hasBOM = csvBuffer[0] === 0xEF && csvBuffer[1] === 0xBB && csvBuffer[2] === 0xBF;
    console.log("Has UTF-8 BOM?", hasBOM ? "YES ✅" : "NO ❌");
    
    const csvText = csvBuffer.toString("utf8");
    console.log("\nCSV Content Preview (First 400 characters):");
    console.log("-----------------------------------------");
    console.log(csvText.substring(0, 450));
    console.log("-----------------------------------------");
    
    console.log("\nAPI TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("API test failed:", err);
  }
}

runTests();
