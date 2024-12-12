// // content.js

// Create sidebar
const sidebar = document.createElement("div");
sidebar.className = "sidebar";
document.body.appendChild(sidebar);

// Base API URL
const API_BASE_URL = "http://localhost:3000";

// JWT Token (to be set after login)
let authToken = null;

// --- Utility Functions ---
const localStorageUtils = (() => {
    const addAgentToCache = (agent) => {
        const cachedAgents =
            JSON.parse(localStorage.getItem("cachedAgents")) || [];
        cachedAgents.push(agent);
        updateCache(cachedAgents);
    };

    const updateAgentInCache = (updatedAgent) => {
        const cachedAgents =
            JSON.parse(localStorage.getItem("cachedAgents")) || [];
        const index = cachedAgents.findIndex(
            (agent) => agent._id === updatedAgent._id
        );
        if (index > -1) {
            cachedAgents[index] = updatedAgent;
            updateCache(cachedAgents);
        }
    };

    const removeAgentFromCache = (id) => {
        const cachedAgents =
            JSON.parse(localStorage.getItem("cachedAgents")) || [];
        const updatedAgents = cachedAgents.filter((agent) => agent._id !== id);
        updateCache(updatedAgents);
    };

    const updateCache = (updatedAgents) => {
        localStorage.setItem("cachedAgents", JSON.stringify(updatedAgents));
    };

    return {
        addAgentToCache,
        updateAgentInCache,
        removeAgentFromCache,
    };
})();

const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    // Toggle the visibility class
    sidebar.classList.toggle("hidden");
};

// Utility to fetch agents
const fetchAgents = async () => {
    // Check if cached data exists
    const cachedAgents = localStorage.getItem("cachedAgents");
    if (cachedAgents) {
        return JSON.parse(cachedAgents);
    }

    // If no cached data, fetch from the server
    try {
        const response = await fetch(`${API_BASE_URL}/agents`, {
            headers: { Authorization: authToken },
        });
        if (!response.ok) throw new Error("Failed to fetch agents");
        const freshAgents = await response.json();
        // Cache the fetched data
        localStorage.setItem("cachedAgents", JSON.stringify(freshAgents));

        return freshAgents;
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
    console.log("Saving agent: ", agentData);
    try {
        const url = isUpdate
            ? `${API_BASE_URL}/agents/${agentData._id}`
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
        const savedAgent = await response.json();
        // Update cache using utilities function
        if (isUpdate) {
            localStorageUtils.updateAgentInCache(savedAgent);
        } else {
            localStorageUtils.addAgentToCache(savedAgent);
        }
        // Update UI when adding or updating agent item
        renderAgents();
        return savedAgent;
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
        const result = await response.json();
        // Update cache using utilities function
        localStorageUtils.removeAgentFromCache(id);
        // Update UI after successful deletion
        renderAgents();
        return result;
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
        const result = await response.json();
        // Update cache using utilities function
        localStorageUtils.addAgentToCache(result);
        // Update UI after successful deletion
        renderAgents();
        return result;
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

    // Add a hidden input to store the agent's _id if editing
    if (agent) {
        const idInput = document.createElement("input");
        idInput.type = "hidden";
        idInput.name = "_id";
        idInput.value = agent._id;
        form.appendChild(idInput);
    }

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

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save";
    saveButton.className =
        "px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring focus:ring-blue-300";
    form.appendChild(saveButton);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className =
        "px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring focus:ring-gray-300";
    form.appendChild(cancelButton);

    cancelButton.addEventListener("click", () => {
        document.body.removeChild(dialog); // Close the modal
        console.log("Modal closed.");
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form default action
        console.log("Save button clicked!"); // Debugging log

        try {
            const inputs = Array.from(form.querySelectorAll("input, textarea"));
            const formData = Object.fromEntries(
                inputs.map((input) => [input.dataset.key, input.value])
            );

            // If agent is provided, include its _id in formData for update
            if (agent) {
                formData._id = agent._id;
            }

            // Parse form fields correctly
            try {
                // More comprehensive JSON parsing
                const formFieldsText = formFieldsTextarea.value.trim();

                // Attempt to parse JSON directly first
                let parsedFormFields;
                try {
                    parsedFormFields = JSON.parse(formFieldsText);
                } catch (directParseError) {
                    // If direct parse fails, try more lenient parsing
                    // Replace single quotes with double quotes
                    const jsonString = formFieldsText
                        .replace(/'/g, '"') // Replace single quotes with double quotes
                        .replace(/(\w+):/g, '"$1":') // Wrap unquoted keys in double quotes
                        .replace(/\n/g, "") // Remove newlines
                        .replace(/\s+/g, " ") // Remove extra whitespace
                        .replace(/,\s*}/g, "}") // Remove trailing commas in objects
                        .replace(/,\s*\]/g, "]"); // Remove trailing commas in arrays

                    parsedFormFields = JSON.parse(jsonString);
                }

                // Validate parsed form fields
                if (!Array.isArray(parsedFormFields)) {
                    throw new Error("Form fields must be an array");
                }

                // Optional: Additional validation of form fields structure
                parsedFormFields.forEach((field) => {
                    if (!field.label || !field.type || !field.placeholder) {
                        throw new Error(
                            "Each form field must have label, type, and placeholder"
                        );
                    }
                });

                formData.formFields = parsedFormFields;
            } catch (jsonError) {
                console.error("Invalid JSON in form fields:", jsonError);
                alert(
                    `Failed to parse form fields. Please check your JSON format.\n\nError: ${jsonError.message}`
                );
                return;
            }

            console.log("formdata: ", formData);
            await onSubmit(formData);
            document.body.removeChild(dialog);
        } catch (error) {
            console.error("Error in form submission:", error);
            alert(`Submission failed: ${error.message}`);
        }
    });

    formContainer.appendChild(form);
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
                console.log("Token:", token);
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

    // Clear existing buttons
    sidebar.innerHTML = "";

    if (authToken) {
        // Logout Button
        const logoutButton = document.createElement("button");
        logoutButton.className =
            "logout-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2";
        logoutButton.textContent = "Logout";

        logoutButton.addEventListener("click", () => {
            // Clear the token from memory and localStorage
            localStorage.removeItem("token");
            authToken = null;

            // Re-render the auth buttons and other UI elements
            renderAuthButtons();
            renderAgents();

            console.log("User logged out.");
        });

        sidebar.appendChild(logoutButton);
    } else {
        // Login Button
        const loginButton = document.createElement("button");
        loginButton.className =
            "login-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2";
        loginButton.textContent = "Login";

        loginButton.addEventListener("click", (e) => {
            e.stopPropagation();
            showLoginDialog(() => {
                console.log("Login successful!");
                renderAuthButtons();
                renderAgents();
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
    }
};

// Render agents in the sidebar
const renderAgents = async () => {
    const agents = await fetchAgents();
    console.log("Agents: ", agents);
    // const agents = [...agentsData, ...agentsMock];
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
        console.log("Agent: ", agent);
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
                    showAgentDialog(agent, (agentData) =>
                        saveAgent(agentData, true)
                    );
                });
            agentItem
                .querySelector(".delete-agent")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    console.log("Deleting agent with ID:", agent._id);
                    deleteAgent(agent._id);
                });
        }

        if (authToken) {
            agentItem
                .querySelector(".clone-agent")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    cloneAgent(agent._id);
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
    const sidebar = document.querySelector(".sidebar");

    // Avoid duplicate button
    if (document.querySelector(".add-agent-button")) return;

    const addAgentButton = document.createElement("button");
    addAgentButton.className =
        "add-agent-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4";
    addAgentButton.textContent = "Add Agent";

    addAgentButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showAgentDialog(null, async (agentData) => {
            try {
                const newAgent = await saveAgent(agentData);
                console.log("New agent added:", newAgent);
                renderAgents(); // Refresh agents list
            } catch (error) {
                console.error("Failed to save agent:", error);
            }
        });
    });

    sidebar.appendChild(addAgentButton);
};

// Initialize extension
const initExtension = () => {
    // Load authToken from localStorage
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
        authToken = storedToken;
        console.log("Auth token loaded from localStorage:", authToken);
    } else {
        console.log("No auth token found in localStorage.");
    }

    // Ensure sidebar exists
    let sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
        sidebar = document.createElement("div");
        sidebar.className =
            "sidebar fixed left-0 top-0 h-full w-64 bg-gray-100 p-4 shadow-md transition-transform transform";
        document.body.appendChild(sidebar);
    }

    // Add Toggle Button
    let toggleButton = document.querySelector(".toggle-sidebar-button");
    if (!toggleButton) {
        toggleButton = document.createElement("button");
        toggleButton.className =
            "toggle-sidebar-button fixed top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded shadow-md z-50";
        toggleButton.textContent = "Toggle Sidebar";
        toggleButton.addEventListener("click", toggleSidebar);
        document.body.appendChild(toggleButton);
    }

    // Render auth buttons and agents
    renderAuthButtons();
    renderAgents();

    // Render "Add Agent" button if logged in
    if (storedToken) {
        renderAddAgentButton();
    }

    console.log("Extension initialized.");
};

// Run the extension
initExtension();
