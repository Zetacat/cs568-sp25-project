console.log("✅ Content script running");

// window.addEventListener("load", () => {
//     chrome.storage.local.get("openai_api_key", ({ openai_api_key }) => {
//         if (!openai_api_key) {
//             console.warn("❌ API key 尚未設定！");
//             return;
//         }

//         fetch("https://api.openai.com/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${openai_api_key}`,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 model: "gpt-4.1-nano",
//                 messages: [{ role: "user", content: "hello world" }]
//             })
//         })
//             .then(res => res.json())
//             .then(data => {
//                 console.log("✅ OpenAI 回應：", data.choices[0].message.content);
//             })
//             .catch(err => {
//                 console.error("❌ API 錯誤：", err);
//             });
//     });
// });

function injectSafeStyledButton() {
    if (document.getElementById("tag-translate-btn")) return;

    const buttonContainer = document.querySelector('[data-testid="composer-footer-actions"]');
    if (!buttonContainer) return;

    const btn = document.createElement("button");
    btn.id = "tag-translate-btn";
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg" class="mr-1">
        <path fill-rule="evenodd" clip-rule="evenodd"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
           10-4.48 10-10S17.52 2 12 2zm0 18c-1.1
           0-2-.9-2-2s.9-2 2-2 2 .9
           2 2-.9 2-2 2zm-1-14h2v6h-2V6z"
          fill="currentColor"/>
      </svg>
      翻譯
    `;
    btn.className = `
      flex items-center justify-center h-9 rounded-full
      border border-token-border-default text-token-text-secondary
      min-w-8 w-auto px-3 text-[13px] font-semibold
      hover:bg-token-main-surface-secondary transition
    `;

    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const inputBox = document.querySelector("#prompt-textarea");
        if (!inputBox) return;

        const newText = "請幫我翻譯：\n" + inputBox.innerText;
        inputBox.innerText = newText;

        // 延遲觸發 input，確保同步
        setTimeout(() => {
            inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
            inputBox.focus(); // ✅ 保持 focus，防止 blur + mouseup combo 觸發送出
        }, 0);
    });

    btn.addEventListener("mouseup", (e) => {
        e.preventDefault(); // ✅ 保險起見也阻止這一步
        e.stopPropagation();
    });

    // THIS IS VERY IMPORTANT!!!!!!!!
    btn.addEventListener("click", (e) => {
        e.preventDefault();  // 雙保險
        e.stopPropagation();
    });

    buttonContainer.appendChild(btn);
    console.log("✅ 安全翻譯按鈕已注入");
}

// 主邏輯：等待輸入框並插入按鈕
function setup() {
    const inputBox = document.querySelector("#prompt-textarea");
    if (!inputBox || inputBox.dataset.hooked === "true") return;

    inputBox.dataset.hooked = "true";

    inputBox.addEventListener("input", () => {
        const inputText = inputBox.innerText;
        console.log("🧠 使用者輸入：", inputText);
    });

    // 注入翻譯按鈕
    injectSafeStyledButton();
}

// MutationObserver 監控頁面變動（防止 SPA 刷新後按鈕消失）
const observer = new MutationObserver(() => {
    const inputBox = document.querySelector("#prompt-textarea");
    if (inputBox && inputBox.dataset.hooked !== "true") {
        setup();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// 初始進行一次 setup
setup();