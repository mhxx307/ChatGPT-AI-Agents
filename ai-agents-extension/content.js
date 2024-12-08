// // content.js

const agentsMock = [
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

// Base API URL
const API_BASE_URL = "http://localhost:3000";

// JWT Token (to be set after login)
let authToken = null;

// Utility to fetch agents
const fetchAgents = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/agents`, {
            headers: { Authorization: authToken },
        });
        if (!response.ok) throw new Error("Failed to fetch agents");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Utility to fetch current user
const fetchCurrentUser = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: { Authorization: authToken },
        });
        if (!response.ok) throw new Error("Failed to fetch user");
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

// Utility to create/update an agent
const saveAgent = async (agentData, isUpdate = false) => {
    try {
        const url = isUpdate
            ? `${API_BASE_URL}/agents/${agentData.id}`
            : `${API_BASE_URL}/agents`;
        const method = isUpdate ? "PUT" : "POST";
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            },
            body: JSON.stringify(agentData),
        });
        if (!response.ok) throw new Error("Failed to save agent");
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

// Utility to delete an agent
const deleteAgent = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
            method: "DELETE",
            headers: { Authorization: authToken },
        });
        if (!response.ok) throw new Error("Failed to delete agent");
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

// Utility to clone an agent
const cloneAgent = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/agents/${id}/clone`, {
            method: "POST",
            headers: { Authorization: authToken },
        });
        if (!response.ok) throw new Error("Failed to clone agent");
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

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

// dialog.js
const showAgentDialog = (agent = null, onSubmit) => {
    const dialog = document.createElement("div");
    dialog.className =
        "fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center";

    const formContainer = document.createElement("div");
    formContainer.className =
        "bg-white p-6 rounded-xl shadow-lg w-full max-w-lg space-y-6";

    const title = document.createElement("h2");
    title.className = "text-2xl font-bold text-gray-800";
    title.textContent = agent ? "Update Agent" : "Create Agent";
    formContainer.appendChild(title);

    const form = document.createElement("form");
    form.className = "space-y-5";

    const fields = [
        {
            label: "Name",
            key: "name",
            type: "text",
            default: agent?.name || "",
        },
        {
            label: "Description",
            key: "description",
            type: "text",
            default: agent?.description || "",
        },
        {
            label: "Prompt",
            key: "prompt",
            type: "textarea",
            default: agent?.prompt || "",
        },
    ];

    fields.forEach(({ label, key, type, default: defaultValue }) => {
        const wrapper = document.createElement("div");
        wrapper.className = "space-y-1";

        const labelElement = document.createElement("label");
        labelElement.textContent = label;
        labelElement.className = "block text-sm font-medium text-gray-700";

        const input =
            type === "textarea"
                ? document.createElement("textarea")
                : document.createElement("input");
        input.type = type;
        input.value = defaultValue;
        input.className =
            "block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 sm:text-sm";

        wrapper.appendChild(labelElement);
        wrapper.appendChild(input);

        input.dataset.key = key; // Save the key for form submission
        form.appendChild(wrapper);
    });

    // Form fields section for formFields array
    const formFieldsWrapper = document.createElement("div");
    formFieldsWrapper.className = "space-y-1";

    const formFieldsLabel = document.createElement("label");
    formFieldsLabel.textContent = "Form Fields (JSON Array)";
    formFieldsLabel.className = "block text-sm font-medium text-gray-700";

    const formFieldsTextarea = document.createElement("textarea");
    formFieldsTextarea.value = agent?.formFields
        ? JSON.stringify(agent.formFields, null, 2)
        : "[]";
    formFieldsTextarea.className =
        "block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 sm:text-sm  h-[250px]";

    formFieldsWrapper.appendChild(formFieldsLabel);
    formFieldsWrapper.appendChild(formFieldsTextarea);
    form.appendChild(formFieldsWrapper);

    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.className = "flex justify-end space-x-4";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className =
        "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring focus:ring-gray-300";
    cancelButton.addEventListener("click", () =>
        document.body.removeChild(dialog)
    );
    buttonsWrapper.appendChild(cancelButton);

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save";
    saveButton.className =
        "px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring focus:ring-blue-300";
    buttonsWrapper.appendChild(saveButton);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const inputs = Array.from(form.querySelectorAll("input, textarea"));
        const formData = Object.fromEntries(
            inputs.map((input) => [input.dataset.key, input.value])
        );
        formData.formFields = JSON.parse(formFieldsTextarea.value || "[]");
        onSubmit(formData);
        document.body.removeChild(dialog);
    });

    formContainer.appendChild(form);
    formContainer.appendChild(buttonsWrapper);
    dialog.appendChild(formContainer);
    document.body.appendChild(dialog);
};

const showLoginDialog = (onSuccess) => {
    // Create dialog backdrop
    const dialog = document.createElement("div");
    dialog.className =
        "dialog-backdrop flex justify-center items-center fixed inset-0 bg-gray-800 bg-opacity-75 z-50";

    // Create dialog container
    const formContainer = document.createElement("div");
    formContainer.className =
        "bg-white p-6 rounded-lg shadow-lg w-96 space-y-4";

    // Add dialog title and form
    formContainer.innerHTML = `
        <h2 class="text-lg font-semibold">Login</h2>
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" class="block w-full px-3 py-2 border rounded-md" data-key="username">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" class="block w-full px-3 py-2 border rounded-md" data-key="password">
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" class="cancel-button px-4 py-2 bg-gray-200 text-gray-700 rounded-md">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md">Login</button>
            </div>
        </form>
    `;

    // Handle form submission
    formContainer
        .querySelector("form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = Array.from(formContainer.querySelectorAll("input"));
            const credentials = Object.fromEntries(
                inputs.map((input) => [input.dataset.key, input.value])
            );

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials),
                });

                if (!response.ok) {
                    alert("Login failed. Please check your credentials.");
                    return;
                }

                const { token } = await response.json();
                localStorage.setItem("token", token);
                authToken = token; // Update global token
                onSuccess(); // Trigger success callback
                document.body.removeChild(dialog); // Close dialog
            } catch (error) {
                alert("Login failed. Please try again.");
            }
        });

    // Handle cancel button
    formContainer
        .querySelector(".cancel-button")
        .addEventListener("click", () => {
            document.body.removeChild(dialog);
        });

    dialog.appendChild(formContainer);
    document.body.appendChild(dialog); // Show dialog
};

const showRegisterDialog = (onSuccess) => {
    const dialog = document.createElement("div");
    dialog.className =
        "dialog-backdrop flex justify-center items-center fixed inset-0 bg-gray-800 bg-opacity-75 z-50";

    const formContainer = document.createElement("div");
    formContainer.className =
        "bg-white p-6 rounded-lg shadow-lg w-96 space-y-4";

    formContainer.innerHTML = `
        <h2 class="text-lg font-semibold">Register</h2>
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" class="block w-full px-3 py-2 border rounded-md" data-key="username">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" class="block w-full px-3 py-2 border rounded-md" data-key="password">
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" class="cancel-button px-4 py-2 bg-gray-200 text-gray-700 rounded-md">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md">Register</button>
            </div>
        </form>
    `;

    // Handle form submission
    formContainer
        .querySelector("form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = Array.from(formContainer.querySelectorAll("input"));
            const credentials = Object.fromEntries(
                inputs.map((input) => [input.dataset.key, input.value])
            );

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials),
                });

                if (!response.ok) {
                    alert("Registration failed. Please try again.");
                    return;
                }

                alert("Registration successful! Please log in.");
                document.body.removeChild(dialog); // Close dialog
                onSuccess();
            } catch (error) {
                alert("Registration failed. Please try again.");
            }
        });

    // Handle cancel button
    formContainer
        .querySelector(".cancel-button")
        .addEventListener("click", () => {
            document.body.removeChild(dialog);
        });

    dialog.appendChild(formContainer);
    document.body.appendChild(dialog);
};

// Render login button
const renderAuthButtons = () => {
    const sidebar = document.querySelector(".sidebar");

    // Avoid duplicate buttons
    if (
        document.querySelector(".login-button") ||
        document.querySelector(".register-button")
    )
        return;

    // Login Button
    const loginButton = document.createElement("button");
    loginButton.className =
        "login-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2";
    loginButton.textContent = "Login";

    loginButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showLoginDialog(() => {
            console.log("Login successful!");
            renderAgents(); // Refresh agents after login
            renderAddAgentButton(); // Show "Add Agent" button after login
        });
    });

    // Register Button
    const registerButton = document.createElement("button");
    registerButton.className =
        "register-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded";
    registerButton.textContent = "Register";

    registerButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showRegisterDialog(() => {
            console.log("Registration dialog closed.");
        });
    });

    sidebar.appendChild(loginButton);
    sidebar.appendChild(registerButton);
};

// Render agents in the sidebar
const renderAgents = async () => {
    const agentsData = await fetchAgents();
    const agents = [...agentsData, ...agentsMock];
    const agentsContainer = document.querySelector(".agents-container");
    const currentUser = authToken ? await fetchCurrentUser() : null;

    // Create agents container if it doesn't exist
    if (!agentsContainer) {
        const newContainer = document.createElement("div");
        newContainer.className = "agents-container";
        newContainer.style.marginTop = "20px";
        document.querySelector(".sidebar").appendChild(newContainer);
    }

    const container = document.querySelector(".agents-container");
    container.innerHTML = ""; // Clear existing agents

    if (agents.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-600">No agents available. Please create a new agent.</div>`;
        return;
    }

    agents.forEach((agent) => {
        const isOwner = currentUser && agent.createdBy?._id === currentUser._id;
        const agentItem = document.createElement("div");

        agentItem.className =
            "agent-item flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg shadow-sm";
        agentItem.innerHTML = `
            <div class="agent-name text-lg font-semibold mb-2">${
                agent.name
            }</div>
            <div class="agent-description text-sm text-gray-600 mb-4">${
                agent.description
            }</div>
            <div class="flex space-x-2">
              ${
                  isOwner
                      ? `
                      <button class="edit-agent px-4 py-2 bg-blue-500 text-white rounded-md">Edit</button>
                      <button class="delete-agent px-4 py-2 bg-red-500 text-white rounded-md">Delete</button>
                    `
                      : ""
              }
              <button class="clone-agent px-4 py-2 bg-green-500 text-white rounded-md">Clone</button>
            </div>
          `;

        // Attach event listeners
        if (isOwner) {
            agentItem
                .querySelector(".edit-agent")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    showAgentDialog(agent, saveAgent);
                });
            agentItem
                .querySelector(".delete-agent")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteAgent(agent.id);
                });
        }

        if (authToken) {
            agentItem
                .querySelector(".clone-agent")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    cloneAgent(agent.id);
                });
        } else {
            agentItem.querySelector(".clone-agent").remove();
        }

        agentItem.addEventListener("click", (e) => {
            e.stopPropagation();
            handleAgentClick(agent);
        });

        container.appendChild(agentItem);
    });
};

// Render add agent button
const renderAddAgentButton = () => {
    if (!authToken) return; // Ensure user is logged in

    const sidebar = document.querySelector(".sidebar");

    // Avoid duplicate button
    if (document.querySelector(".add-agent-button")) return;

    const addAgentButton = document.createElement("button");
    addAgentButton.className =
        "add-agent-button bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4";
    addAgentButton.textContent = "Add Agent";

    addAgentButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showAgentDialog(null, async (agentData) => {
            const newAgent = await saveAgent(agentData);
            console.log("New agent added:", newAgent);
            renderAgents(); // Refresh agents list
        });
    });

    sidebar.appendChild(addAgentButton);
};

// Initialize extension
const initExtension = () => {
    // Ensure sidebar exists
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
        const newSidebar = document.createElement("div");
        newSidebar.className = "sidebar";
        document.body.appendChild(newSidebar);
    }

    // Render auth buttons and agents
    renderAuthButtons();
    renderAgents();

    // Render "Add Agent" button if logged in
    if (authToken) {
        renderAddAgentButton();
    }
};

// Run the extension
initExtension();
