const LINKEDIN_DOMAIN = ".linkedin.com";
const REQUIRED_COOKIES = ["li_at", "JSESSIONID"];

async function getLinkedInCookies() {
  try {
    const cookies = await chrome.cookies.getAll({ domain: LINKEDIN_DOMAIN });
    const cookieMap = {};
    
    for (const cookie of cookies) {
      cookieMap[cookie.name] = {
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate
      };
    }
    
    const hasRequired = REQUIRED_COOKIES.every(name => cookieMap[name]);
    
    return {
      success: hasRequired,
      cookies: cookieMap,
      isLoggedIn: !!cookieMap["li_at"],
      missingCookies: REQUIRED_COOKIES.filter(name => !cookieMap[name])
    };
  } catch (error) {
    console.error("Error getting LinkedIn cookies:", error);
    return {
      success: false,
      error: error.message,
      cookies: {},
      isLoggedIn: false
    };
  }
}

async function sendCookiesToBackend(cookies, backendUrl, authToken) {
  try {
    const response = await fetch(`${backendUrl}/api/linkedin/extension/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        cookies: cookies,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to connect");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending cookies to backend:", error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    getLinkedInCookies().then(sendResponse);
    return true;
  }
  
  if (request.action === "connectLinkedIn") {
    const { backendUrl, authToken } = request;
    
    getLinkedInCookies()
      .then(result => {
        if (!result.success) {
          sendResponse({
            success: false,
            error: result.isLoggedIn 
              ? `Missing cookies: ${result.missingCookies.join(", ")}`
              : "Please log in to LinkedIn first"
          });
          return;
        }
        
        return sendCookiesToBackend(result.cookies, backendUrl, authToken);
      })
      .then(result => {
        if (result) {
          sendResponse(result);
        }
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    return true;
  }
  
  if (request.action === "checkStatus") {
    getLinkedInCookies().then(result => {
      sendResponse({
        isLoggedIn: result.isLoggedIn,
        hasAllCookies: result.success
      });
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkedIn Outreach Connector installed");
});
