// DOM Elements
const curlInput = document.getElementById("curlInput");
const startBtn = document.getElementById("startBtn");
const cancelBtn = document.getElementById("cancelBtn");
const liveResults = document.getElementById("liveResults");
const testStatus = document.getElementById("testStatus");
const foundCount = document.getElementById("foundCount");
const testedCount = document.getElementById("testedCount");
const errorElement = document.getElementById("error");

let currentProfile = "profile1"; // Track the active profile

// Profiles data
let profiles = {
  profile1: {
    curlInput: "",
    concurrent: 1,
    level: "basic",
    results: [],
    tested: 0,
    found: 0,
    isTesting: false,
    status: "Not Started",
  },
  profile2: {
    curlInput: "",
    concurrent: 1,
    level: "basic",
    results: [],
    tested: 0,
    found: 0,
    isTesting: false,
    status: "Not Started",
  },
  profile3: {
    curlInput: "",
    concurrent: 1,
    level: "basic",
    results: [],
    tested: 0,
    found: 0,
    isTesting: false,
    status: "Not Started",
  },
  profile4: {
    curlInput: "",
    concurrent: 1,
    level: "basic",
    results: [],
    tested: 0,
    found: 0,
    isTesting: false,
    status: "Not Started",
  },
  profile5: {
    curlInput: "",
    concurrent: 1,
    level: "basic",
    results: [],
    tested: 0,
    found: 0,
    isTesting: false,
    status: "Not Started",
  },
};

// Load profile data and status when popup is opened
document.addEventListener("DOMContentLoaded", () => {
  loadProfileData(currentProfile);

  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.command === "updateResults") {
      const { profile, results, tested, found } = message;
      if (profiles[profile]) {
        profiles[profile].results = results;
        profiles[profile].tested = tested;
        profiles[profile].found = found;
      }
      if (profile === currentProfile) {
        updateLiveResults(results, tested, found);
      }
    }
  });
});
// Set Active Option
function setActiveOption(selector, value, attribute = "data-value") {
  document
    .querySelectorAll(selector)
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`${selector}[${attribute}="${value}"]`)
    .classList.add("active");
}

// Handle Concurrent Request Count Selection
document.querySelectorAll(".concurrent-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    profiles[currentProfile].concurrent = parseInt(btn.dataset.value, 10);
    setActiveOption(".concurrent-option", profiles[currentProfile].concurrent);
  });
});

// Handle Test Level Selection
document.querySelectorAll(".level-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    profiles[currentProfile].level = btn.dataset.level;
    setActiveOption(
      ".level-option",
      profiles[currentProfile].level,
      "data-level"
    );
  });
});
// Start Test
startBtn.addEventListener("click", async () => {
  const curlText = curlInput.value.trim();
  if (!curlText.includes("XSS")) {
    errorElement.classList.remove("hidden");
    return;
  }
  errorElement.classList.add("hidden");
  resetLiveResults();

  const concurrent = profiles[currentProfile].concurrent;
  const level = profiles[currentProfile].level;
  const response = await fetch(`${level}.txt`);
  const payloads = (await response.text())
    .split("\n")
    .filter((line) => line.trim());

  profiles[currentProfile].isTesting = true;
  profiles[currentProfile].status = "In Progress";
  updateButtonStates();
  updateStatus();
  startTesting(curlText, payloads, concurrent, currentProfile);
});

// Cancel Test
cancelBtn.addEventListener("click", () => {
  profiles[currentProfile].isTesting = false;
  profiles[currentProfile].status = "Cancelled";
  updateButtonStates();
  updateStatus();
});

// Profile Tab Switching
document.querySelectorAll(".profile-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    saveProfileData(currentProfile);

    // Switch active profile
    document.querySelector(".profile-tab.active").classList.remove("active");
    tab.classList.add("active");
    currentProfile = tab.id;

    // Load the new profile's state
    loadProfileData(currentProfile);

    // Ensure live results are updated or hidden based on the profile's state
    const profileData = profiles[currentProfile];
    if (
      (!profileData.results ||
        profileData.results.length === 0 ||
        profileData.found === 0) &&
      testStatus.innerText === "Not Started"
    ) {
      liveResults.parentElement.classList.add("hidden");
      liveResults.innerText = "";
      testedCount.innerText = 0;
      foundCount.innerText = 0;
    } else {
      updateLiveResults(
        profileData.results,
        profileData.tested,
        profileData.found
      );
    }
  });
});

// Save Profile Data
function saveProfileData(profile) {
  profiles[profile].curlInput = curlInput.value.trim();
  profiles[profile].tested = parseInt(testedCount.innerText, 10);
  profiles[profile].found = parseInt(foundCount.innerText, 10);
  profiles[profile].results = liveResults.innerText.split("\n").map((line) => ({
    payload: line.split("Payload: ")[1] || "",
    status: line.includes("✔️") ? "found" : "tested",
  }));
}

// Load Profile Data
function loadProfileData(profile) {
  const profileData = profiles[profile];
  curlInput.value = profileData.curlInput || "";
  updateLiveResults(profileData.results, profileData.tested, profileData.found);
  setActiveOption(".concurrent-option", profileData.concurrent);
  setActiveOption(".level-option", profileData.level, "data-level");
  updateButtonStates();
  updateStatus();

  if (
    (!profileData.results ||
      profileData.results.length === 0 ||
      !profileData.isTesting) &&
    testStatus.innerText === "Not Started"
  ) {
    liveResults.parentElement.classList.add("hidden");
    liveResults.innerText = "";
    testedCount.innerText = 0;
    foundCount.innerText = 0;
  }
}

// Set Active Option
function setActiveOption(selector, value, attribute = "data-value") {
  document
    .querySelectorAll(selector)
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`${selector}[${attribute}="${value}"]`)
    .classList.add("active");
}

// Reset Live Results and Stats
function resetLiveResults() {
  profiles[currentProfile].results = [];
  profiles[currentProfile].tested = 0;
  profiles[currentProfile].found = 0;

  liveResults.innerText = ""; // Clear the live results
  testedCount.innerText = 0; // Reset tested count
  foundCount.innerText = 0; // Reset found count
  testStatus.innerText = "Not Started"; // Reset status
  liveResults.parentElement.classList.add("hidden"); // Hide the results section
}

function updateLiveResults(results, tested, found) {
  if (
    (!results || results.length === 0 || found === 0) &&
    testStatus.innerText === "Not Started"
  ) {
    liveResults.parentElement.classList.add("hidden"); // Hide live results if no data or found count is 0
    liveResults.innerText = ""; // Clear live results display
    testedCount.innerText = 0; // Reset tested count
    foundCount.innerText = 0; // Reset found count
    return;
  }

  // Only include results where the status is "found"
  const filteredResults = results.filter((result) => result.status === "found");

  liveResults.innerText = filteredResults
    .map((result) => `➣ ${result.payload}`)
    .join("\n"); // Properly join the results with newline

  testedCount.innerText = tested;
  foundCount.innerText = found;
  if (filteredResults?.length > 0) {
    liveResults.parentElement.classList.remove("hidden");
  }
}

// Update Start and Cancel Button States
function updateButtonStates() {
  const isTesting = profiles[currentProfile].isTesting;
  startBtn.classList.toggle("hidden", isTesting);
  cancelBtn.classList.toggle("hidden", !isTesting);
}

// Update the Status in the UI
function updateStatus() {
  testStatus.innerText = profiles[currentProfile].status;
}

// Handle Concurrent API Requests
async function startTesting(curlText, payloads, concurrent, profile) {
  let index = 0;
  while (index < payloads.length && profiles[profile].isTesting) {
    const currentPayloads = payloads.slice(index, index + concurrent);
    const promises = currentPayloads.map((payload) => {
      const testCurl = curlText.replace("XSS", payload); // Replace XSS with payload
      console.log(`Payload Used: ${payload}`); // Log the payload being used

      return sendCurl(testCurl).then((response) => {
        console.log(`Actual Response Received:`, response); // Log the actual API response
        const found = response.includes(payload);
        console.log(
          `Payload Checking Result: ${found ? "✔️ Found" : "❌ Not Found"}`
        ); // Log the result

        profiles[profile].results.push({
          payload,
          status: found ? "found" : "tested",
        });
        if (found) profiles[profile].found++;
        profiles[profile].tested++;
        if (profile === currentProfile) {
          updateLiveResults(
            profiles[profile].results,
            profiles[profile].tested,
            profiles[profile].found
          );
        }
      });
    });

    await Promise.all(promises); // Wait for all concurrent requests to finish
    index += concurrent; // Move to the next batch
  }
  profiles[profile].isTesting = false;
  profiles[profile].status = "Completed";
  if (profile === currentProfile) {
    updateButtonStates();
    updateStatus();
  }
}

// Simulate Sending Curl Command
async function sendCurl(curlCommand) {
  const urlMatch = curlCommand.match(/curl\s'([^']+)'/); // Extract URL from the curl command
  const headersMatch = [...curlCommand.matchAll(/-H\s'([^']+)'/g)]; // Extract all headers

  if (!urlMatch) {
    console.error("No URL found in the curl command.");
    return "No URL found.";
  }

  const url = urlMatch[1];
  const headers = {};

  // Parse headers into an object
  headersMatch.forEach((header) => {
    const [key, value] = header[1].split(":").map((str) => str.trim());
    headers[key] = value;
  });

  console.log(`Sending Request to URL: ${url}`);
  console.log("Headers:", headers);

  try {
    const response = await fetch(url, {
      method: "GET", // Adjust method if necessary (e.g., POST, PUT)
      headers: headers,
    });

    const responseBody = await response.text(); // Capture the response body
    console.log("Actual Response:", responseBody);

    return responseBody; // Return the actual response
  } catch (error) {
    console.error("Error making the request:", error);
    return `Error: ${error.message}`;
  }
}
