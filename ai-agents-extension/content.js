// content.js

const toggleSidebar = () => {
    const sidebar = document.querySelector(".ai-agents-sidebar");
    if (!sidebar) return;
    sidebar.classList.toggle("ai-agents-hidden");
    updateToggleButton();
};

const updateToggleButton = () => {
    const sidebar = document.querySelector(".ai-agents-sidebar");
    const toggleButton = document.querySelector(".ai-agents-toggle-button");
    if (!sidebar || !toggleButton) return;
    
    const isHidden = sidebar.classList.contains("ai-agents-hidden");
    if (isHidden) {
        // Sidebar đang đóng - hiển thị toggle button
        toggleButton.style.display = "block";
        toggleButton.textContent = "Toggle Sidebar";
    } else {
        // Sidebar đang mở - ẩn toggle button
        toggleButton.style.display = "none";
    }
};

// Handle agent click - fill ChatGPT input
const handleAgentClick = (agent) => {
    const existingCustomForm = document.querySelector("#custom-agent-form");
    if (existingCustomForm) existingCustomForm.remove();

    const chatContainer =
        document.querySelector("div.ProseMirror")?.parentElement;
    if (!chatContainer) return;

    // If the agent has no form fields, render the basic prompt trực tiếp
    if (!agent.formFields || agent.formFields.length === 0) {
        const chatInput = document.querySelector("div.ProseMirror");
        if (chatInput) {
            const formattedPrompt = agent.prompt
                .replace(/\n/g, "<br>")
                .replace(/ {2}/g, "&nbsp;&nbsp;");

            chatInput.innerHTML = formattedPrompt;
            chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return;
    }

    // Create a form container nếu agent có formFields
    const formContainer = document.createElement("div");
    formContainer.id = "custom-agent-form";

    // Ngăn event propagation để không trigger focus vào ChatGPT input
    formContainer.addEventListener("click", (e) => {
        e.stopPropagation();
    });
    formContainer.addEventListener("mousedown", (e) => {
        e.stopPropagation();
    });
    formContainer.addEventListener("mouseup", (e) => {
        e.stopPropagation();
    });
    formContainer.addEventListener("focusin", (e) => {
        e.stopPropagation();
    });

    // Header với title + toggle form
    const header = document.createElement("div");
    header.className = "ai-agents-form-header";

    const title = document.createElement("span");
    title.className = "ai-agents-form-title";
    title.textContent = agent.name || "Custom Form";

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "ai-agents-form-toggle";
    toggleButton.textContent = "Ẩn form";

    header.appendChild(title);
    header.appendChild(toggleButton);

    const body = document.createElement("div");
    body.className = "ai-agents-form-body";

    // Add fields dynamically from the agent's formFields
    agent.formFields.forEach((field) => {
        const fieldWrapper = document.createElement("div");

        const label = document.createElement("label");
        label.textContent = field.label;
        label.className = "block text-sm font-medium text-gray-700";

        let input;
        
        // Support select/dropdown type
        if (field.type === "select" || field.type === "dropdown") {
            input = document.createElement("select");
            input.className =
                "block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
            
            // Add options if provided
            if (field.options && Array.isArray(field.options)) {
                field.options.forEach((option) => {
                    const optionEl = document.createElement("option");
                    if (typeof option === "string") {
                        optionEl.value = option;
                        optionEl.textContent = option;
                    } else {
                        optionEl.value = option.value || option.label;
                        optionEl.textContent = option.label || option.value;
                    }
                    if (optionEl.value === (field.default || "")) {
                        optionEl.selected = true;
                    }
                    input.appendChild(optionEl);
                });
            } else if (field.placeholder) {
                // Parse options from placeholder (format: "option1 | option2 | option3")
                const options = field.placeholder.split("|").map(opt => opt.trim()).filter(opt => opt);
                options.forEach((option) => {
                    const optionEl = document.createElement("option");
                    optionEl.value = option;
                    optionEl.textContent = option;
                    if (option === (field.default || "")) {
                        optionEl.selected = true;
                    }
                    input.appendChild(optionEl);
                });
            }
        } else if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.placeholder = field.placeholder;
            input.defaultValue = field.default || "";
            input.className =
                "block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
            input.rows = field.rows || 3;
        } else {
            input = document.createElement("input");
            input.type = field.type || "text";
            input.placeholder = field.placeholder;
            input.defaultValue = field.default || "";
            input.className =
                "block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
        }

        // Ngăn event propagation cho input
        input.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("focus", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("focusin", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("change", updateCombinedPrompt);
        input.addEventListener("input", updateCombinedPrompt);

        fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(input);
        body.appendChild(fieldWrapper);
    });

    formContainer.appendChild(header);
    formContainer.appendChild(body);

    // Toggle hiển thị form body
    let collapsed = false;
    toggleButton.addEventListener("click", (e) => {
        e.stopPropagation();
        collapsed = !collapsed;
        body.style.display = collapsed ? "none" : "block";
        toggleButton.textContent = collapsed ? "Hiện form" : "Ẩn form";
    });

    chatContainer.insertBefore(formContainer, chatContainer.firstChild);

    // Function combine inputs và update textarea
    function updateCombinedPrompt() {
        const userInputs = Array.from(
            body.querySelectorAll("input, select, textarea")
        )
            .map((input) => {
                const label = input.previousElementSibling?.textContent || input.placeholder || "";
                const value = input.value || "";
                return value ? `${label}: ${value}` : "";
            })
            .filter(item => item)
            .join("\n");

        const combinedPrompt = `${agent.prompt}\n${userInputs}`;

        const chatInput = document.querySelector("div.ProseMirror");
        if (chatInput) {
            const formattedPrompt = combinedPrompt
                .replace(/\n/g, "<br>")
                .replace(/ {2}/g, "&nbsp;&nbsp;");

            chatInput.innerHTML = formattedPrompt;
            chatInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }
};

// Show agent dialog for create/edit
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

    // Add a hidden input to store the agent's id if editing
    if (agent) {
        const idInput = document.createElement("input");
        idInput.type = "hidden";
        idInput.name = "id";
        idInput.value = agent.id;
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

        input.dataset.key = key;
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
        "block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 sm:text-sm h-[250px]";

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
        document.body.removeChild(dialog);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const inputs = Array.from(form.querySelectorAll("input, textarea"));
            const formData = Object.fromEntries(
                inputs.map((input) => [input.dataset.key, input.value])
            );

            if (agent) {
                formData.id = agent.id;
            }

            // Parse form fields
            try {
                const formFieldsText = formFieldsTextarea.value.trim();
                let parsedFormFields;

                try {
                    parsedFormFields = JSON.parse(formFieldsText);
                } catch (directParseError) {
                    const jsonString = formFieldsText
                        .replace(/'/g, '"')
                        .replace(/(\w+):/g, '"$1":')
                        .replace(/\n/g, "")
                        .replace(/\s+/g, " ")
                        .replace(/,\s*}/g, "}")
                        .replace(/,\s*\]/g, "]");

                    parsedFormFields = JSON.parse(jsonString);
                }

                if (!Array.isArray(parsedFormFields)) {
                    throw new Error("Form fields must be an array");
                }

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

// Handle export data
const handleExport = async () => {
    try {
        await db.exportData();
        alert("Data exported successfully!");
    } catch (error) {
        console.error("Export failed:", error);
        alert(`Export failed: ${error.message}`);
    }
};

// Handle import data
const handleImport = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // Ask user if they want to clear existing data
            const clearExisting = confirm(
                "Do you want to replace all existing agents? (Cancel to merge with existing)"
            );

            const result = await db.importData(jsonData, clearExisting);
            alert(
                `Import successful! ${result.imported} of ${result.total} agents imported.`
            );
            renderAgents();
        } catch (error) {
            console.error("Import failed:", error);
            alert(`Import failed: ${error.message}`);
        }

        document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
};

// Render export/import buttons
const renderExportImportButtons = () => {
    const sidebar = document.querySelector(".ai-agents-sidebar");

    // Check if buttons already exist
    if (document.querySelector(".ai-agents-export-import-container")) return;

    const container = document.createElement("div");
    container.className = "ai-agents-export-import-container";

    const exportButton = document.createElement("button");
    exportButton.className = "ai-agents-export-button";
    exportButton.textContent = "Export Data";
    exportButton.addEventListener("click", handleExport);

    const importButton = document.createElement("button");
    importButton.className = "ai-agents-import-button";
    importButton.textContent = "Import Data";
    importButton.addEventListener("click", handleImport);

    container.appendChild(exportButton);
    container.appendChild(importButton);
    sidebar.appendChild(container);
};

// Render agents in the sidebar
const renderAgents = async () => {
    try {
        const agents = await db.getAgents();
        console.log("Agents: ", agents);

        const agentsContainer = document.querySelector(".ai-agents-container");

        // Create agents container if it doesn't exist
        if (!agentsContainer) {
        const newContainer = document.createElement("div");
        newContainer.className = "ai-agents-container";
        newContainer.style.marginTop = "20px";
        document.querySelector(".ai-agents-sidebar").appendChild(newContainer);
        }

        const container = document.querySelector(".ai-agents-container");
        container.innerHTML = "";

        if (agents.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-600">No agents available. Please create a new agent.</div>`;
            return;
        }

        agents.forEach((agent) => {
            const agentItem = document.createElement("div");

            agentItem.className = "ai-agents-item";
            agentItem.innerHTML = `
                <div class="ai-agents-name">${agent.name}</div>
                <div class="ai-agents-description">${agent.description}</div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="ai-agents-button ai-agents-edit-button">Edit</button>
                    <button class="ai-agents-button ai-agents-delete-button">Delete</button>
                    <button class="ai-agents-button ai-agents-clone-button">Clone</button>
                </div>
            `;

            // Edit button
            agentItem
                .querySelector(".ai-agents-edit-button")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    showAgentDialog(agent, async (agentData) => {
                        try {
                            await db.updateAgent(agentData.id, agentData);
                            renderAgents();
                        } catch (error) {
                            console.error("Failed to update agent:", error);
                            alert(`Failed to update agent: ${error.message}`);
                        }
                    });
                });

            // Delete button
            agentItem
                .querySelector(".ai-agents-delete-button")
                .addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${agent.name}"?`)) {
                        try {
                            await db.deleteAgent(agent.id);
                            renderAgents();
                        } catch (error) {
                            console.error("Failed to delete agent:", error);
                            alert(`Failed to delete agent: ${error.message}`);
                        }
                    }
                });

            // Clone button
            agentItem
                .querySelector(".ai-agents-clone-button")
                .addEventListener("click", async (e) => {
                    e.stopPropagation();
                    try {
                        await db.cloneAgent(agent.id);
                        renderAgents();
                    } catch (error) {
                        console.error("Failed to clone agent:", error);
                        alert(`Failed to clone agent: ${error.message}`);
                    }
                });

            agentItem.addEventListener("click", (e) => {
                e.stopPropagation();
                handleAgentClick(agent);
            });

            container.appendChild(agentItem);
        });
    } catch (error) {
        console.error("Failed to render agents:", error);
    }
};

// Render add agent button
const renderAddAgentButton = () => {
    const sidebar = document.querySelector(".ai-agents-sidebar");

    if (document.querySelector(".add-agent-button")) return;

    const addAgentButton = document.createElement("button");
    addAgentButton.className = "ai-agents-add-button";
    addAgentButton.textContent = "Add Agent";

    addAgentButton.addEventListener("click", (e) => {
        e.stopPropagation();
        showAgentDialog(null, async (agentData) => {
            try {
                await db.createAgent(agentData);
                renderAgents();
            } catch (error) {
                console.error("Failed to save agent:", error);
                alert(`Failed to save agent: ${error.message}`);
            }
        });
    });

    sidebar.appendChild(addAgentButton);
};

// Initialize extension
const initExtension = async () => {
    // Initialize database
    try {
        await db.initDB();
        console.log("Database initialized");
    } catch (error) {
        console.error("Failed to initialize database:", error);
        alert("Failed to initialize database. Please refresh the page.");
        return;
    }

    // Ensure sidebar exists
    let sidebar = document.querySelector(".ai-agents-sidebar");
    if (!sidebar) {
        sidebar = document.createElement("div");
        sidebar.className = "ai-agents-sidebar";
        document.body.appendChild(sidebar);
        
        // Add close button (X icon) in sidebar header
        const closeButton = document.createElement("button");
        closeButton.className = "ai-agents-close-button";
        closeButton.innerHTML = "&times;";
        closeButton.title = "Close sidebar";
        closeButton.addEventListener("click", toggleSidebar);
        sidebar.appendChild(closeButton);
    }

    // Add Toggle Button
    let toggleButton = document.querySelector(".ai-agents-toggle-button");
    if (!toggleButton) {
        toggleButton = document.createElement("button");
        toggleButton.className = "ai-agents-toggle-button";
        toggleButton.textContent = "Toggle Sidebar";
        toggleButton.addEventListener("click", toggleSidebar);
        document.body.appendChild(toggleButton);
    }
    
    // Update toggle button state based on sidebar visibility
    updateToggleButton();

    // Render export/import buttons
    renderExportImportButtons();

    // Render agents
    renderAgents();

    // Render add agent button (always visible now)
    renderAddAgentButton();

    console.log("Extension initialized.");
};

// Parse JSON from code block
const parseJSONFromCodeBlock = (codeElement) => {
    try {
        // Get text content, remove HTML tags and syntax highlighting spans
        let text = codeElement.textContent || codeElement.innerText;
        
        // Try to extract JSON from markdown code block if present
        text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        
        // Parse JSON
        const jsonData = JSON.parse(text);
        
        // Validate format
        if (!jsonData.version || !jsonData.agents || !Array.isArray(jsonData.agents)) {
            throw new Error("Invalid JSON format. Expected: {version, exportedAt, agents: []}");
        }
        
        return jsonData;
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        return null;
    }
};

// Add import button to JSON code blocks
const addImportButtonToCodeBlock = (codeElement) => {
    // Check if button already exists
    if (codeElement.parentElement?.querySelector(".ai-agents-import-json-btn")) {
        return;
    }
    
    // Strict validation: Must be a JSON code block with proper structure
    const text = codeElement.textContent || codeElement.innerText || "";
    const cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    
    // Must have all required fields for agent JSON format
    const hasVersion = cleanText.includes('"version"') || cleanText.includes("'version'");
    const hasExportedAt = cleanText.includes('"exportedAt"') || cleanText.includes("'exportedAt'");
    const hasAgents = cleanText.includes('"agents"') || cleanText.includes("'agents'");
    const hasName = cleanText.includes('"name"') || cleanText.includes("'name'");
    const hasDescription = cleanText.includes('"description"') || cleanText.includes("'description'");
    const hasPrompt = cleanText.includes('"prompt"') || cleanText.includes("'prompt'");
    
    // Must be inside a code block with language-json class
    const isJSONCodeBlock = codeElement.classList.contains("language-json") || 
                            codeElement.closest("pre")?.querySelector("code.language-json") === codeElement;
    
    // Validate it's actually valid agent JSON structure
    if (!isJSONCodeBlock || !hasVersion || !hasExportedAt || !hasAgents || !hasName || !hasDescription || !hasPrompt) {
        return;
    }
    
    // Try to parse to confirm it's valid JSON
    try {
        const testJson = JSON.parse(cleanText);
        if (!testJson.version || !testJson.agents || !Array.isArray(testJson.agents) || testJson.agents.length === 0) {
            return;
        }
        // Check first agent has required fields
        const firstAgent = testJson.agents[0];
        if (!firstAgent.name || !firstAgent.description || !firstAgent.prompt) {
            return;
        }
    } catch (e) {
        // Not valid JSON, skip
        return;
    }
    
    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "ai-agents-json-button-container";
    
    const importButton = document.createElement("button");
    importButton.className = "ai-agents-import-json-btn";
    importButton.textContent = "➕ Add Agent";
    importButton.title = "Import agent từ JSON này";
    
    importButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const jsonData = parseJSONFromCodeBlock(codeElement);
        if (!jsonData) {
            alert("Không thể parse JSON. Vui lòng kiểm tra format.");
            return;
        }
        
        try {
            // Import agents
            const result = await db.importData(jsonData, false); // false = merge, không xóa existing
            alert(`✅ Import thành công! ${result.imported} agent(s) đã được thêm vào extension.`);
            
            // Refresh agents list if sidebar is open
            const sidebar = document.querySelector(".ai-agents-sidebar");
            if (sidebar && !sidebar.classList.contains("ai-agents-hidden")) {
                renderAgents();
            }
            
            // Update button to show success
            importButton.textContent = "✅ Đã thêm";
            importButton.disabled = true;
            setTimeout(() => {
                importButton.textContent = "➕ Add Agent";
                importButton.disabled = false;
            }, 2000);
        } catch (error) {
            console.error("Import failed:", error);
            alert(`❌ Import thất bại: ${error.message}`);
        }
    });
    
    buttonContainer.appendChild(importButton);
    
    // Insert button after code block
    const parent = codeElement.parentElement;
    if (parent) {
        parent.insertBefore(buttonContainer, codeElement.nextSibling);
    } else {
        codeElement.insertAdjacentElement("afterend", buttonContainer);
    }
};

// Monitor ChatGPT responses for JSON code blocks
const setupJSONCodeBlockMonitor = () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Find code blocks with JSON - only check language-json class
                    const codeBlocks = node.querySelectorAll?.("code.language-json");
                    if (codeBlocks) {
                        codeBlocks.forEach((codeBlock) => {
                            addImportButtonToCodeBlock(codeBlock);
                        });
                    }
                    
                    // Check if the node itself is a JSON code block
                    if (node.tagName === "CODE" && node.classList?.contains("language-json")) {
                        addImportButtonToCodeBlock(node);
                    }
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also check existing code blocks - only JSON code blocks
    setTimeout(() => {
        const existingCodeBlocks = document.querySelectorAll("code.language-json");
        existingCodeBlocks.forEach((codeBlock) => {
            addImportButtonToCodeBlock(codeBlock);
        });
    }, 1000);
};

// Run the extension
initExtension();

// Setup JSON code block monitor after initialization
setTimeout(() => {
    setupJSONCodeBlockMonitor();
}, 2000);
