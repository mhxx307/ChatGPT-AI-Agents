// content.js
const agents = [
    {
        name: "Content Creator",
        description: "Create blog content optimized for SEO.",
        prompt: "Create a blog optimized for SEO:",
        formFields: [
            {
                label: "Topic of the Blog",
                type: "text",
                placeholder: "Enter the blog topic",
                default: "",
            },
            {
                label: "Number of Blogs",
                type: "number",
                placeholder: "Enter the number of blogs",
                default: "1",
            },
        ],
    },
    {
        name: "Summarizer",
        description: "Summarizes text for clarity.",
        prompt: "Summarize the following content:",
        formFields: [],
    },
    {
        name: "English Translator",
        description: "Translates text into English.",
        prompt: `
        You are an expert English-to-Vietnamese translator specializing in light novels. Your task is to translate the story *Too Many Losing Heroines* into Vietnamese while preserving the conversational and natural tone typical of light novels.  

        Maintain the distinct personalities and tones of all characters in the dialogue, ensuring their unique speech patterns and mannerisms come across naturally in Vietnamese. Additionally, provide concise footnotes or in-line explanations for cultural references, idiomatic expressions, or phrases that might not directly translate to Vietnamese. These explanations should clarify the meaning while keeping the reading experience immersive.  

        When translating:  
        - Use modern and relatable Vietnamese vocabulary that fits the tone of a light novel.  
        - Avoid overly formal or outdated language unless explicitly required by the context.  
        - Stay true to the original text while ensuring it feels natural in Vietnamese.  
        - Highlight any parts where clarification was necessary or significant adaptations were made for the target audience.  

        Example communication style:  
        In previous projects, I prioritize maintaining the natural flow of conversation, reflecting how native speakers communicate. I also prefer providing clear and accessible explanations for any cultural nuances or idioms, helping the reader connect better with the text.

        ---

        **Critique:**  
        This draft effectively captures your main goals but could benefit from a specific example to demonstrate how idiomatic expressions should be explained or how character tones should be adapted. Additionally, clarifying the level of detail expected in explanations (e.g., short one-liners or detailed notes) would improve precision.

        ---

        **Questions:**  
        1. Should the explanations for cultural references be included as in-line comments, footnotes, or endnotes?  
        2. Are there specific types of idiomatic expressions or cultural references you would like handled differently (e.g., localized vs. explained literally)?  
        3. Would you like a brief summary of changes or adaptations after the translation of each chapter?  
        `,
        formFields: [],
    },
    {
        name: "Prompt Generator",
        description: "Generate prompts for ChatGPT.",
        prompt: `
            I want you to become my Expert Prompt Creator. Your goal is to help me craft the best possible prompt for my needs. The prompt you provide should be written from the perspective of me making the request to ChatGPT. Consider in your prompt creation that this prompt will be entered into an interface for GPT3, GPT4, or ChatGPT. The prompt will include instructions to write the output using my communication style. The process is as follows:

1. You will generate the following sections:

"
**Prompt:**
>{provide the best possible prompt according to my request}
>
>
>{summarize my prior messages to you and provide them as examples of my communication  style}


**Critique:**
{provide a concise paragraph on how to improve the prompt. Be very critical in your response. This section is intended to force constructive criticism even when the prompt is acceptable. Any assumptions and or issues should be included}

**Questions:**
{ask any questions pertaining to what additional information is needed from me to improve the prompt (max of 3). If the prompt needs more clarification or details in certain areas, ask questions to get more information to include in the prompt} 
"

2. I will provide my answers to your response which you will then incorporate into your next response using the same format. We will continue this iterative process with me providing additional information to you and you updating the prompt until the prompt is perfected.

Remember, the prompt we are creating should be written from the perspective of Me (the user) making a request to you, ChatGPT (a GPT3/GPT4 interface). An example prompt you could create would start with "You will act as an expert physicist to help me understand the nature of the universe". 

Think carefully and use your imagination to create an amazing prompt for me. 

Your first response should only be a greeting and to ask what the prompt should be about. 
        `,
        formFields: [],
    },
];

// Create sidebar
const sidebar = document.createElement("div");
sidebar.className = "sidebar";
document.body.appendChild(sidebar);

// Render agents (example)
agents.forEach((agent) => {
    const agentItem = document.createElement("div");
    agentItem.className = "agent-item";
    agentItem.innerHTML = `
      <div class="agent-name">${agent.name}</div>
      <div class="agent-description">${agent.description}</div>
    `;
    agentItem.addEventListener("click", () => handleAgentClick(agent));
    sidebar.appendChild(agentItem);
});

const handleAgentClick = (agent) => {
    // Check if the form exists already
    const existingCustomForm = document.querySelector("#custom-agent-form");
    console.log("Existing form: ", existingCustomForm); // Debug log
    if (existingCustomForm) existingCustomForm.remove();

    // Get the chat input container and check if it exists
    const chatContainer =
        document.querySelector("div.ProseMirror")?.parentElement;
    console.log("Chat container found: ", chatContainer); // Debug log
    if (!chatContainer) return;

    // If the agent has no form fields, render the basic prompt directly
    if (!agent.formFields || agent.formFields.length === 0) {
        const chatInput = document.querySelector("div.ProseMirror");
        if (chatInput) {
            // Replace HTML content with formatted text
            const formattedPrompt = agent.prompt
                .replace(/\n/g, "<br>") // Convert newlines to HTML line breaks
                .replace(/ {2}/g, "&nbsp;&nbsp;"); // Preserve spaces for indentation

            chatInput.innerHTML = formattedPrompt;

            // Simulate input event to ensure the submit button appears
            chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return;
    }

    // Create a form container if form fields exist
    const formContainer = document.createElement("div");
    formContainer.id = "custom-agent-form";
    formContainer.className = "space-y-4";

    // Add fields dynamically from the agent's formFields
    agent.formFields.forEach((field) => {
        const fieldWrapper = document.createElement("div");

        const label = document.createElement("label");
        label.textContent = field.label;
        label.className = "block text-sm font-medium text-gray-700";

        const input = document.createElement("input");
        input.type = field.type;
        input.placeholder = field.placeholder;
        input.defaultValue = field.default || "";
        input.className =
            "block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

        // Add an event listener to update the prompt whenever the input changes
        input.addEventListener("input", updateCombinedPrompt);

        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        formContainer.appendChild(fieldWrapper);
    });

    // Insert the new form above the default input field
    chatContainer.insertBefore(formContainer, chatContainer.firstChild);

    // Function to combine inputs and update the textarea
    function updateCombinedPrompt() {
        const userInputs = Array.from(formContainer.querySelectorAll("input"))
            .map((input) => `${input.placeholder}: ${input.value}`)
            .join("\n");

        // Combine the agent prompt with the user inputs
        const combinedPrompt = `${agent.prompt}\n${userInputs}`;

        // Get the chat input area (ProseMirror div) and set the combined prompt
        const chatInput = document.querySelector("div.ProseMirror");
        if (chatInput) {
            // Replace with formatted prompt
            const formattedPrompt = combinedPrompt
                .replace(/\n/g, "<br>")
                .replace(/ {2}/g, "&nbsp;&nbsp;");

            chatInput.innerHTML = formattedPrompt;

            // Simulate input event to ensure the submit button appears
            chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }
};
