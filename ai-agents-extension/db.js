// IndexedDB Database Layer
const DB_NAME = "aiAgentsDB";
const DB_VERSION = 1;
const STORE_NAME = "agents";

let dbInstance = null;

// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error("Failed to open database"));
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true,
                });

                // Create indexes
                objectStore.createIndex("name", "name", { unique: false });
                objectStore.createIndex("createdAt", "createdAt", {
                    unique: false,
                });
            }
        };
    });
};

// Get all agents
const getAgents = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(new Error("Failed to get agents"));
        };
    });
};

// Create a new agent
const createAgent = async (agentData) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const newAgent = {
            name: agentData.name,
            description: agentData.description,
            prompt: agentData.prompt,
            formFields: agentData.formFields || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const request = store.add(newAgent);

        request.onsuccess = () => {
            resolve({ ...newAgent, id: request.result });
        };

        request.onerror = () => {
            reject(new Error("Failed to create agent"));
        };
    });
};

// Update an agent
const updateAgent = async (id, agentData) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const existingAgent = getRequest.result;
            if (!existingAgent) {
                reject(new Error("Agent not found"));
                return;
            }

            const updatedAgent = {
                ...existingAgent,
                name: agentData.name,
                description: agentData.description,
                prompt: agentData.prompt,
                formFields: agentData.formFields || [],
                updatedAt: new Date().toISOString(),
            };

            const updateRequest = store.put(updatedAgent);

            updateRequest.onsuccess = () => {
                resolve(updatedAgent);
            };

            updateRequest.onerror = () => {
                reject(new Error("Failed to update agent"));
            };
        };

        getRequest.onerror = () => {
            reject(new Error("Failed to get agent"));
        };
    });
};

// Delete an agent
const deleteAgent = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve({ message: "Agent deleted" });
        };

        request.onerror = () => {
            reject(new Error("Failed to delete agent"));
        };
    });
};

// Clone an agent
const cloneAgent = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const agent = getRequest.result;
            if (!agent) {
                reject(new Error("Agent not found"));
                return;
            }

            const clonedAgent = {
                name: `${agent.name} (Copy)`,
                description: agent.description,
                prompt: agent.prompt,
                formFields: agent.formFields || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const addRequest = store.add(clonedAgent);

            addRequest.onsuccess = () => {
                resolve({ ...clonedAgent, id: addRequest.result });
            };

            addRequest.onerror = () => {
                reject(new Error("Failed to clone agent"));
            };
        };

        getRequest.onerror = () => {
            reject(new Error("Failed to get agent"));
        };
    });
};

// Export all agents to JSON
const exportData = async () => {
    const agents = await getAgents();
    const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        agents: agents,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `ai-agents-backup-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return exportData;
};

// Import agents from JSON
const importData = async (jsonData, clearExisting = false) => {
    try {
        // Validate JSON structure
        if (!jsonData.version || !jsonData.agents || !Array.isArray(jsonData.agents)) {
            throw new Error("Invalid JSON format. Expected: {version, exportedAt, agents: []}");
        }

        const db = await initDB();

        if (clearExisting) {
            // Clear all existing data
            await clearAll();
        }

        // Import each agent
        const importedAgents = [];
        for (const agent of jsonData.agents) {
            try {
                const agentData = {
                    name: agent.name,
                    description: agent.description,
                    prompt: agent.prompt,
                    formFields: agent.formFields || [],
                };

                // If agent has id and we're not clearing, try to update
                if (agent.id && !clearExisting) {
                    try {
                        const updated = await updateAgent(agent.id, agentData);
                        importedAgents.push(updated);
                    } catch (error) {
                        // If update fails, create new
                        const created = await createAgent(agentData);
                        importedAgents.push(created);
                    }
                } else {
                    // Create new agent
                    const created = await createAgent(agentData);
                    importedAgents.push(created);
                }
            } catch (error) {
                console.error(`Failed to import agent: ${agent.name}`, error);
            }
        }

        return {
            success: true,
            imported: importedAgents.length,
            total: jsonData.agents.length,
        };
    } catch (error) {
        throw new Error(`Import failed: ${error.message}`);
    }
};

// Clear all data
const clearAll = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve({ message: "All data cleared" });
        };

        request.onerror = () => {
            reject(new Error("Failed to clear data"));
        };
    });
};

// Export database functions
const db = {
    initDB,
    getAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    cloneAgent,
    exportData,
    importData,
    clearAll,
};

// Auto-initialize on load
if (typeof window !== "undefined") {
    initDB().catch((error) => {
        console.error("Failed to initialize database:", error);
    });
}

// Export for use in content script
if (typeof module !== "undefined" && module.exports) {
    module.exports = db;
} else {
    window.db = db;
}

