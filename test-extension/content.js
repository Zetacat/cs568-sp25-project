console.log("✅ Content script running");

function callOpenAI(promptText, callback) {
    chrome.storage.local.get("openai_api_key", ({ openai_api_key }) => {
        if (!openai_api_key) {
            console.warn("❌ API key 尚未設定！");
            return;
        }

        fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openai_api_key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages: [{ role: "user", content: promptText }],
                temperature: 0.7
            })
        })
            .then(res => res.json())
            .then(data => {
                const reply = data.choices?.[0]?.message?.content;
                console.log("✅ GPT 回應：", reply);
                if (callback) callback(reply);
            })
            .catch(err => {
                console.error("❌ API 錯誤：", err);
            });
    });
}

function injectButtons() {
    const buttonContainer = document.querySelector('[data-testid="composer-footer-actions"]');
    if (!buttonContainer || document.getElementById("tag-translate-btn")) return;

    // Translate Button
    const translateBtn = document.createElement("button");
    translateBtn.id = "tag-translate-btn";
    translateBtn.innerHTML = `
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
    translateBtn.className = `
      flex items-center justify-center h-9 rounded-full border border-token-border-default text-token-text-secondary min-w-8 w-auto px-3 text-[13px] font-semibold hover:bg-token-main-surface-secondary transition
    `;

    translateBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const inputBox = document.querySelector("#prompt-textarea");
        if (!inputBox) return;

        inputBox.innerText = "請幫我翻譯：\n" + inputBox.innerText;
        setTimeout(() => inputBox.dispatchEvent(new InputEvent("input", { bubbles: true })), 0);
    });

    buttonContainer.appendChild(translateBtn);

    // Generate Tag Button
    const genTagBtn = document.createElement("button");
    genTagBtn.id = "tag-generate-btn";
    genTagBtn.innerHTML = `🧠 生成新標籤`;
    genTagBtn.className = `
      flex items-center justify-center h-9 rounded-full border border-token-border-default text-token-text-secondary min-w-8 w-auto px-3 ml-2 text-[13px] font-semibold hover:bg-token-main-surface-secondary transition
    `;

    genTagBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const inputBox = document.querySelector("#prompt-textarea");
        if (!inputBox) return;

        const userInput = inputBox.innerText;
        const prompt = `Suggest a single concise tag (in English) and a brief instruction (prompt) based on the following user input:\n"${userInput}". Return it in this format:\nTag: <your-tag>\nPrompt: <your-prompt>`;

        callOpenAI(prompt, (reply) => {
            const tagMatch = reply.match(/Tag:\s*(.*)\nPrompt:\s*(.*)/);
            if (!tagMatch) {
                console.warn("❌ 回覆格式錯誤：", reply);
                return;
            }
            const [_, newTag, newPrompt] = tagMatch;

            const newTagBtn = document.createElement("button");
            newTagBtn.className = `
              flex items-center justify-center h-8 rounded-full border border-token-border-default text-token-text-secondary px-2 ml-2 text-[12px] font-semibold hover:bg-token-main-surface-secondary transition
            `;
            newTagBtn.textContent = newTag;

            newTagBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                inputBox.innerText = newPrompt + "\n" + inputBox.innerText;
                setTimeout(() => inputBox.dispatchEvent(new InputEvent("input", { bubbles: true })), 0);
            });

            buttonContainer.appendChild(newTagBtn);
            console.log("✅ 新標籤已注入：", newTag);
        });
    });

    buttonContainer.appendChild(genTagBtn);
    console.log("✅ 所有按鈕已注入");
}

// 主邏輯：等待輸入框並插入按鈕
function setup() {
    const inputBox = document.querySelector("#prompt-textarea");
    if (!inputBox || inputBox.dataset.hooked === "true") return;
    inputBox.dataset.hooked = "true";

    injectButtons();
}

// MutationObserver to handle SPA updates
const observer = new MutationObserver(setup);
observer.observe(document.body, { childList: true, subtree: true });

// Initial setup
setup();