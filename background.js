let tests = {}; // Store tests for each profile
let isTesting = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startTest") {
    const { profile, curlInput, concurrent, level } = message.data;
    startTest(profile, curlInput, concurrent, level);
    sendResponse({ status: "started" });
  } else if (message.command === "cancelTest") {
    cancelTest();
    sendResponse({ status: "cancelled" });
  } else if (message.command === "getStatus") {
    sendResponse({ status: isTesting, tests });
  }
});

function startTest(profile, curlInput, concurrent, level) {
  isTesting = true;
  if (!tests[profile]) {
    tests[profile] = { curlInput, concurrent, level, results: [], tested: 0, found: 0 };
  }

  const payloads = []; // Load payloads from level file
  fetch(`${level}.txt`)
    .then((response) => response.text())
    .then((text) => {
      payloads.push(...text.split("\n").filter((line) => line.trim()));

      // Run tests sequentially
      runTests(profile, payloads);
    });
}

async function runTests(profile, payloads) {
  for (let i = 0; i < payloads.length; i++) {
    if (!isTesting) break;

    const payload = payloads[i];
    const curlCommand = tests[profile].curlInput.replace("XSS", payload);

    try {
      const result = await sendCurl(curlCommand);

      tests[profile].tested++;
      if (result.includes(payload)) {
        tests[profile].found++;
        tests[profile].results.push({ payload, status: "found" });
      } else {
        tests[profile].results.push({ payload, status: "tested" });
      }
    } catch (error) {
      tests[profile].results.push({ payload, status: "error", error: error.message });
    }

    saveTests(); // Persist data to storage
  }

  isTesting = false;
}

function cancelTest() {
  isTesting = false;
}

function sendCurl(curlCommand) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResponse = `Mock response for ${curlCommand}`;
      resolve(mockResponse);
    }, 200);
  });
}

function saveTests() {
  chrome.storage.local.set({ tests });
}

function loadTests() {
  chrome.storage.local.get("tests", (data) => {
    if (data.tests) {
      tests = data.tests;
    }
  });
}

// Load previous tests on startup
loadTests();
