// popup.js

// 頁面載入時，自動從 storage 載入已儲存的 key
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["openai_api_key"], (result) => {
        if (result.openai_api_key) {
            document.getElementById("apiKey").value = result.openai_api_key;
        }
    });
});

// 點擊儲存按鈕，將 key 儲存在 chrome.storage.local
document.getElementById("saveBtn").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    chrome.storage.local.set({ openai_api_key: apiKey }, () => {
        document.getElementById("status").textContent = "✅ API key saved!";
        setTimeout(() => {
            document.getElementById("status").textContent = "";
        }, 2000);
    });
});