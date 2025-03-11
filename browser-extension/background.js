// @ts-check

const tabStates = {}; // To store the state (on/off) for each tab

function setPasswordVisibility(shouldReveal) {
  (function () {

    const WAS_PASSWORD = 'data-iseepass';

    function processInputs(root, reveal) { // Pass 'reveal' parameter down to processInputs
      const allInputs = root.querySelectorAll('input');
      for (let i = 0; i < allInputs.length; i++) {
        const curInput = allInputs[i];
        if (reveal) { // Reveal passwords
          if (curInput.getAttribute('type') === 'password') {
            curInput.setAttribute('type', 'text');
            curInput.setAttribute('autocomplete', 'off');
            curInput.setAttribute(WAS_PASSWORD, 'true');
          }
        } else { // Hide passwords
          if (curInput.getAttribute('data-iseepass')) {
            curInput.setAttribute('type', 'password');
            curInput.removeAttribute(WAS_PASSWORD);
          }
        }
      }

      var shadowHosts = root.querySelectorAll('*');
      for (var j = 0; j < shadowHosts.length; j++) {
        var shadowHost = shadowHosts[j];
        if (shadowHost.shadowRoot) {
          processInputs(shadowHost.shadowRoot, reveal); // Pass 'reveal' parameter recursively
        }
      }
    }

    processInputs(document, shouldReveal); // Call processInputs with the 'shouldReveal' parameter

  }());
}


// Function to set the extension icon based on state (remains the same)
function updateIcon(tabId, isPasswordRevealed) {
  const iconPath = isPasswordRevealed ? { // Icon paths for 'on' state
    '16': 'images/icon-on-16.png',
    '32': 'images/icon-on-32.png',
    '48': 'images/icon-on-48.png',
    '128': 'images/icon-on-128.png'
  } : { // Icon paths for 'off' state
    '16': 'images/icon-off-16.png',
    '32': 'images/icon-off-32.png',
    '48': 'images/icon-off-48.png',
    '128': 'images/icon-off-128.png'
  };
  chrome.action.setIcon({ tabId: tabId, path: iconPath });
}


chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  if (!tabId) return; // Should not happen, but for safety

  // Get current state for the tab, default to false (off) if not set
  const prevState = tabStates[tabId] || false;
  const newState = !prevState; // Toggle the state

  tabStates[tabId] = newState; // Update state for the tab
  updateIcon(tabId, newState); // Update the icon

  // Call setPasswordVisibility with the new state (true for reveal, false for hide)
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: setPasswordVisibility,
    args: [newState] // Pass 'newState' as argument to setPasswordVisibility
  });
});

// When a tab is updated (e.g., page load), ensure icon is "off" initially
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') { // When page load is complete
    updateIcon(tabId, false); // Set "off" icon for updated tab
    delete tabStates[tabId]; // Clear the state for the tab on page reload/navigation
  }
});

// When a tab is removed (closed), remove its state
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId]; // Clean up state when tab is closed
});