// Listen for a click on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Create a new tab and open the 'popup.html' from the extension's directory
  chrome.tabs.create({
    url: chrome.runtime.getURL("popup.html") // This will open the popup.html as a new tab
  });
});

// Optional: Handling the case where you might want to manage or log the tab
chrome.tabs.onCreated.addListener((newTab) => {
  console.log('New tab created: ', newTab);
  // You can add any custom logic here to handle the new tab, like updating the UI or storing tab details.
});

// You could also listen for events like tab closed or activated, for additional functionality:
// Example: Log when a tab is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`Tab with ID: ${tabId} was closed.`);
});
