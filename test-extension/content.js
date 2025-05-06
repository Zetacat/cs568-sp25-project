console.log("✅ Content script running");

function callOpenAI(promptText, callback) {
    chrome.storage.local.get("openai_api_key", ({ openai_api_key }) => {
        if (!openai_api_key) {
            console.warn("API key not found");
            alert("Please set your OpenAI API key in the extension options.");
            return;
        }

        fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openai_api_key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                messages: [{ role: "user", content: promptText }],
                temperature: 0.7
            })
        })
            .then(res => res.json())
            .then(data => {
                const reply = data.choices?.[0]?.message?.content;
                console.log("OpenAI reply", reply);
                if (callback) callback(reply);
            })
            .catch(err => {
                console.error("API error", err);
            });
    });
}

function moveCaretToEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function scrollToBottom(el) {
    const scrollParent = el.closest(".overflow-auto, .max-h-\\[25dvh\\], .max-h-52");
    if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
    } else {
        console.warn("⚠️ Scrollable container not found");
    }
}

function injectButtons() {
    const buttonContainer = document.querySelector('[data-testid="composer-footer-actions"]');
    if (!buttonContainer || document.getElementById("tag-translate-btn")) return;
    // Add 'flex-wrap' to allow wrapping
    buttonContainer.classList.add('flex-wrap');
    // (Optional) Remove 'overflow-x-auto' if you don't want horizontal scroll anymore
    buttonContainer.classList.remove('overflow-x-auto');
    // Adjust spacer height to avoid blocking input
    const inputContainer = document.querySelector('div.relative.flex.w-full.items-end.px-3.py-3');
    if (inputContainer) {
        inputContainer.style.paddingBottom = "6rem"; // or 7rem (adjust based on how many rows you have)
    }

    // Translate Button
    // const translateBtn = document.createElement("button");
    // translateBtn.id = "tag-translate-btn";
    // translateBtn.innerHTML = `
    //   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    //        xmlns="http://www.w3.org/2000/svg" class="mr-1">
    //     <path fill-rule="evenodd" clip-rule="evenodd"
    //       d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
    //        10-4.48 10-10S17.52 2 12 2zm0 18c-1.1
    //        0-2-.9-2-2s.9-2 2-2 2 .9
    //        2 2-.9 2-2 2zm-1-14h2v6h-2V6z"
    //       fill="currentColor"/>
    //   </svg>
    //   Translate
    // `;
    // translateBtn.className = `
    //   flex items-center justify-center h-9 rounded-full border border-token-border-default text-token-text-secondary min-w-8 w-auto px-3 text-[13px] font-semibold hover:bg-token-main-surface-secondary transition
    // `;

    // translateBtn.addEventListener("mousedown", (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     const inputBox = document.querySelector("#prompt-textarea");
    //     if (!inputBox) return;

    //     inputBox.innerText = "Translate\n" + inputBox.innerText;
    //     setTimeout(() => inputBox.dispatchEvent(new InputEvent("input", { bubbles: true })), 0);
    // });

    // buttonContainer.appendChild(translateBtn);

    // Generate Tag Button
    const genTagBtn = document.createElement("button");
    genTagBtn.id = "tag-generate-btn";
    genTagBtn.innerHTML = `Generate new tags`;
    genTagBtn.className = `
      flex items-center justify-center h-9 rounded-full border border-token-border-default text-token-text-secondary min-w-8 w-auto px-3 ml-2 text-[13px] font-semibold hover:bg-token-main-surface-secondary transition
    `;

    genTagBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const inputBox = document.querySelector("#prompt-textarea");
        if (!inputBox) return;

        // First remove all previous generated tag buttons
        const oldTagButtons = buttonContainer.querySelectorAll(".generated-tag-btn");
        oldTagButtons.forEach(btn => btn.remove());

        const userInput = inputBox.innerText;
        const prompt = `Generate a diverse set of concise tags (no more than 6) based on the given paragraph, capturing its core ideas, likely future directions, and applicable methods or tools. The model should be aware that the paragraph may be part of an ongoing conversation, so tags can reflect information already discussed as well as reasonable predictions about what might come next.

Tags should reflect different dimensions of the paragraph's content:
- 1 tags should summarize the paragraph's main idea.
- 1-2 tags should predict what the next part of the conversation might involve.
- 2-4 tags should name techniques, tools, or frameworks that could be used to solve the problem or complete the task described.
- All tags should be semantically distinct, concise (1-3 words), and should not overlap in focus.
- The total number of tags must not exceed 6.

# Steps

- Read the paragraph and identify the main idea or topic.
- Consider the paragraph as part of an ongoing conversation—some steps may already have been discussed or implemented.
- Infer reasonable next directions based on what is currently described.
- Identify tools, methods, or technical strategies that could be or have been applied.
- Create a set of 6 or fewer unique tags covering these dimensions.

# Output Format

Return the output as a Python-style list of comma-separated strings in square brackets, e.g.:  
[tag1, tag2, tag3, ...]  
Each tag must be 1-3 words and should not repeat meaning. Do not include quotes or any other formatting.

# Examples

Input Paragraph:  
The project involves building a responsive web application for task management. Future plans include adding user authentication, real-time updates with WebSocket, and deployment to a cloud provider.

Output Tags:  
[task manager app, UI design, user login, real-time updates, React, FastAPI]  
(In real use, paragraphs may be longer and include more complex information; adjust tag specificity accordingly.)

# Notes

- Be aware that the paragraph may come mid-conversation. Consider prior context when identifying what is a summary vs. prediction.
- If the paragraph does not clearly imply a next-step or method, infer a reasonable one based on context.
- Avoid duplicating tags (e.g., don't use "React" and "react.js" in the same list).
- All tags should be lowercase unless they are proper nouns or acronyms (e.g., "PostgreSQL").

        Input: ${userInput}`;

        callOpenAI(prompt, (reply) => {

            const tagMatch = reply.match(/^\[([^\]]+)\]$/);
            if (!tagMatch) {
                console.warn("format error", reply);
                return;
            }
            const tags = tagMatch[1].split(", ").map(tag => tag.trim());
            console.log("tag generated", tags);

            for (const newTag of tags) {
                const newTagBtn = document.createElement("button");
                newTagBtn.className = `
                generated-tag-btn flex items-center justify-center h-8 rounded-full border border-token-border-default text-token-text-secondary px-2 ml-2 text-[12px] font-semibold hover:bg-token-main-surface-secondary transition
                `;
                newTagBtn.textContent = newTag;

                newTagBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newPrompt = `Given an input, a tag, and assuming there may have been previous conversation context, generate a clear and natural instruction that tells the model to perform the action described by the tag on the input. 
                    The generated instruction should be framed as a direct request, written in a way that feels like a continuation of an ongoing conversation (not a full standalone prompt unless necessary). 
                    Assume the model already knows the prior context, and focus on being concise, specific, and natural.
                    Input: ${inputBox.innerText}, Tag: ${newTag}`;
                    callOpenAI(newPrompt, (reply) => {
                        // inputBox.innerHTML = `${inputBox.innerHTML}<br>${reply}`;
                        const newParagraph = document.createElement("p");
                        newParagraph.textContent = reply;
                        inputBox.appendChild(newParagraph);

                        // Force caret to move to the bottom + notify the editor
                        setTimeout(() => {
                            moveCaretToEnd(inputBox);
                            scrollToBottom(inputBox);
                            inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
                        }, 0);
                    });
                    setTimeout(() => inputBox.dispatchEvent(new InputEvent("input", { bubbles: true })), 0);
                });

                buttonContainer.appendChild(newTagBtn);
                console.log("new tag injected", newTag);
            }
        });
    });

    buttonContainer.appendChild(genTagBtn);
    console.log("All buttons injected");
}

// wait for the page to load and the input box to be available
// and then inject the buttons
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