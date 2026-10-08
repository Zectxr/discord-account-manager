function enableSidePanelOnActionClick() {
  if (!chrome.sidePanel || !chrome.sidePanel.setPanelBehavior) {
    return;
  }

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

chrome.runtime.onInstalled.addListener(enableSidePanelOnActionClick);
chrome.runtime.onStartup.addListener(enableSidePanelOnActionClick);