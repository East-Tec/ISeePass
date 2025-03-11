// @ts-check

/**
 * Object to store the state of the extension for each tab.
 * Key: tabId, Value: boolean (true for on, false for off)
 * @type {Object<number, boolean>}
 */
const tabStates = {};

/**
 * Function to reveal or hide passwords in the current page.
 * @param {boolean} shouldReveal Whether to reveal the passwords (true) or hide them back (false).
 * @returns {void}
 */
function setPasswordVisibility(shouldReveal) {
  (function () {

    /**
     * Custom attribute to remember that an input was a password field.
     */
    const WAS_PASSWORD = 'data-iseepass';

    /**
     * Custom attribute to remember the original autocomplete attribute value.
     */
    const ORIGINAL_AUTOCOMPLETE = "data-iseepass-autocomplete";

    /**
     * Process all input elements in the given root element.
     * @param {Element} root The root element to start processing from.
     * @param {boolean} reveal Whether to reveal the passwords (true) or hide them (false).
     * @returns {void}
     */
    function processInputs(root, reveal) {

      // Process all inputs in the root element
      const allInputs = root.querySelectorAll('input');
      for (let i = 0; i < allInputs.length; i++) {
        const curInput = allInputs[i];

        // If 'reveal' is true, show the passwords
        if (reveal) {
          // If the input is a password field
          if (curInput.getAttribute('type') === 'password') {

            // Save original autocomplete attribute value, if any
            if (curInput.hasAttribute("autocomplete")) {
              curInput.setAttribute(ORIGINAL_AUTOCOMPLETE, curInput.getAttribute("autocomplete"));
            }

            // Set autocomplete to 'off' to prevent browser from suggesting passwords in plain text
            curInput.setAttribute('autocomplete', 'off');

            // Remember that this input was a password
            curInput.setAttribute(WAS_PASSWORD, 'true');

            // Show the password (main functionality)
            curInput.setAttribute('type', 'text');
          }
        }
        // If 'reveal' is false, hide the passwords (default behavior)
        else {
          // If the input was a password field (converted to text by the extension)
          if (curInput.getAttribute('data-iseepass')) {

            // Convert back to password field
            curInput.setAttribute('type', 'password');

            // Clean up the custom ISeePass attribute that remembered this input was a password
            curInput.removeAttribute(WAS_PASSWORD);

            // Restore the original autocomplete attribute, if it was saved, and clean up
            if (curInput.hasAttribute(ORIGINAL_AUTOCOMPLETE)) {
              curInput.setAttribute("autocomplete", curInput.getAttribute(ORIGINAL_AUTOCOMPLETE));
              curInput.removeAttribute(ORIGINAL_AUTOCOMPLETE);
            } else {
              // Remove the "off" autocomplete attribute that was added by the extension
              curInput.removeAttribute("autocomplete");
            }
          }
        }
      }

      // Process shadow DOMs recursively
      var shadowHosts = root.querySelectorAll('*');
      for (var j = 0; j < shadowHosts.length; j++) {
        var shadowHost = shadowHosts[j];
        if (shadowHost.shadowRoot) {
          processInputs(shadowHost.shadowRoot, reveal);
        }
      }
    }

    // Start processing inputs from the document root
    processInputs(document, shouldReveal);

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