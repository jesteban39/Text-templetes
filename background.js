
/**
 * pressing the command Alt+V = 'open-tralates' opens a modal window,
 * where the user selects the traslat and clicking on it inserts it into the last focused element.
 * @param {*String: command name input for user} command 
 */
const incerTemplet = async (command) => {

  if (command === 'open-traslates') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['modal.css']
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['modal.js']
      //func: showModal,
      //args: [allTempletes]
    });
  }
}

const updateBD = async ()=>{}

chrome.runtime.onInstalled.addListener(updateBD)
chrome.commands.onCommand.addListener(incerTemplet);

/*
"permissions": ["storage", "activeTab", "scripting"],

    "windows": "Alt+V",
    "mac": "Alt+V",
    "chromeos": "Alt+V",
    "linux": "Alt+V"

    Item.textContent = 'No hay notas almacenadas.';

*/