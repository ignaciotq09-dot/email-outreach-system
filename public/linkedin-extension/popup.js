const STORAGE_KEYS = {
  BACKEND_URL: "backendUrl",
  AUTH_TOKEN: "authToken",
  CONNECTED: "isConnected",
  CONNECTED_AT: "connectedAt"
};

const elements = {
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  setupSection: document.getElementById("setupSection"),
  connectedSection: document.getElementById("connectedSection"),
  backendUrl: document.getElementById("backendUrl"),
  authToken: document.getElementById("authToken"),
  connectBtn: document.getElementById("connectBtn"),
  openLinkedInBtn: document.getElementById("openLinkedInBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  messageBox: document.getElementById("messageBox"),
  helpLink: document.getElementById("helpLink")
};

function showMessage(text, type) {
  elements.messageBox.textContent = text;
  elements.messageBox.className = `message ${type}`;
  elements.messageBox.classList.remove("hidden");
  
  if (type === "success") {
    setTimeout(() => {
      elements.messageBox.classList.add("hidden");
    }, 5000);
  }
}

function hideMessage() {
  elements.messageBox.classList.add("hidden");
}

function updateStatus(status) {
  elements.statusDot.className = `status-dot ${status}`;
  
  switch (status) {
    case "connected":
      elements.statusText.textContent = "Connected to LinkedIn";
      elements.setupSection.classList.add("hidden");
      elements.connectedSection.classList.remove("hidden");
      break;
    case "disconnected":
      elements.statusText.textContent = "Not connected";
      elements.setupSection.classList.remove("hidden");
      elements.connectedSection.classList.add("hidden");
      break;
    case "pending":
      elements.statusText.textContent = "Connecting...";
      break;
    default:
      elements.statusText.textContent = "Checking...";
  }
}

async function loadSavedSettings() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.BACKEND_URL,
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.CONNECTED
  ]);
  
  if (stored[STORAGE_KEYS.BACKEND_URL]) {
    elements.backendUrl.value = stored[STORAGE_KEYS.BACKEND_URL];
  }
  
  if (stored[STORAGE_KEYS.AUTH_TOKEN]) {
    elements.authToken.value = stored[STORAGE_KEYS.AUTH_TOKEN];
  }
  
  return stored[STORAGE_KEYS.CONNECTED] || false;
}

async function saveSettings(backendUrl, authToken) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.BACKEND_URL]: backendUrl,
    [STORAGE_KEYS.AUTH_TOKEN]: authToken
  });
}

async function setConnected(connected) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.CONNECTED]: connected,
    [STORAGE_KEYS.CONNECTED_AT]: connected ? Date.now() : null
  });
}

async function checkLinkedInStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
      resolve(response || { isLoggedIn: false, hasAllCookies: false });
    });
  });
}

async function connectLinkedIn() {
  const backendUrl = elements.backendUrl.value.trim();
  const authToken = elements.authToken.value.trim();
  
  if (!backendUrl) {
    showMessage("Please enter your app URL", "error");
    return;
  }
  
  if (!authToken) {
    showMessage("Please enter your connection token", "error");
    return;
  }
  
  elements.connectBtn.disabled = true;
  updateStatus("pending");
  hideMessage();
  
  try {
    await saveSettings(backendUrl, authToken);
    
    const linkedInStatus = await checkLinkedInStatus();
    
    if (!linkedInStatus.isLoggedIn) {
      showMessage("Please log in to LinkedIn first, then try again", "warning");
      updateStatus("disconnected");
      elements.connectBtn.disabled = false;
      return;
    }
    
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: "connectLinkedIn",
        backendUrl,
        authToken
      }, resolve);
    });
    
    if (result.success) {
      await setConnected(true);
      updateStatus("connected");
      showMessage("Successfully connected to LinkedIn!", "success");
    } else {
      updateStatus("disconnected");
      showMessage(result.error || "Failed to connect", "error");
    }
  } catch (error) {
    updateStatus("disconnected");
    showMessage(error.message || "Connection failed", "error");
  } finally {
    elements.connectBtn.disabled = false;
  }
}

async function disconnect() {
  await setConnected(false);
  updateStatus("disconnected");
  showMessage("Disconnected from LinkedIn", "success");
}

function openLinkedIn() {
  chrome.tabs.create({ url: "https://www.linkedin.com" });
}

async function initialize() {
  const wasConnected = await loadSavedSettings();
  const linkedInStatus = await checkLinkedInStatus();
  
  if (wasConnected && linkedInStatus.isLoggedIn && linkedInStatus.hasAllCookies) {
    updateStatus("connected");
  } else if (linkedInStatus.isLoggedIn) {
    updateStatus("disconnected");
  } else {
    updateStatus("disconnected");
    showMessage("Please log in to LinkedIn first", "warning");
  }
}

elements.connectBtn.addEventListener("click", connectLinkedIn);
elements.openLinkedInBtn.addEventListener("click", openLinkedIn);
elements.disconnectBtn.addEventListener("click", disconnect);
elements.helpLink.addEventListener("click", (e) => {
  e.preventDefault();
  const backendUrl = elements.backendUrl.value.trim();
  if (backendUrl) {
    chrome.tabs.create({ url: `${backendUrl}/settings?tab=linkedin` });
  } else {
    showMessage("Enter your app URL first", "warning");
  }
});

initialize();
