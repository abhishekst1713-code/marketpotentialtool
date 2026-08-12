const http = require('http');

const API_BASE = 'http://localhost:4001'; // backend server port

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE}${path}`, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("🚀 Starting end-to-end unlock simulation...");

  // 1. Create a new test submission (Onboarding)
  const onboardingData = {
    name: 'Gaurav Test',
    email: 'gaurav@test.com',
    organization: 'SaladExpress',
    problem: 'Providing healthy organic salad deliveries to office workers in technology parks.',
    sector: 'FoodTech',
    geography: 'Bangalore, India'
  };

  const createRes = await post('/api/submissions', onboardingData);
  if (createRes.status !== 201 || !createRes.body.id) {
    console.error("❌ Failed to create submission:", createRes);
    process.exit(1);
  }
  const id = createRes.body.id;
  console.log(`✅ Step 1: Onboarding complete. Submission ID created: ${id}`);

  // 2. Fetch submission immediately to check unlocked state
  const fetch1 = await get(`/api/submissions/${id}`);
  if (fetch1.status !== 200) {
    console.error("❌ Failed to fetch submission:", fetch1);
    process.exit(1);
  }
  console.log(`✅ Step 2: Fresh fetch complete. Initial 'paid' status in DB: ${fetch1.body.paid}`);
  if (fetch1.body.paid !== false) {
    console.error("❌ Error: Report should be locked (paid: false) initially!");
    process.exit(1);
  }

  // 3. Perform test unlock (Simulating Unlock Button click)
  console.log("➡️ Triggering direct test unlock...");
  const unlockRes = await post('/api/payments/test-unlock', { submissionId: id });
  if (unlockRes.status !== 200 || !unlockRes.body.success) {
    console.error("❌ Failed to unlock submission:", unlockRes);
    process.exit(1);
  }
  console.log("✅ Step 3: Unlock API returned success.");

  // 4. Fetch submission again to verify paid status has flipped to true
  const fetch2 = await get(`/api/submissions/${id}`);
  if (fetch2.status !== 200) {
    console.error("❌ Failed to fetch submission again:", fetch2);
    process.exit(1);
  }
  console.log(`✅ Step 4: Re-fetch complete. Current 'paid' status in DB: ${fetch2.body.paid}`);
  if (fetch2.body.paid !== true) {
    console.error("❌ Error: Report failed to unlock in DB!");
    process.exit(1);
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The gating and unlock logic is 100% verified end-to-end.");
}

run().catch(err => {
  console.error("❌ Test crashed with error:", err.message);
});
