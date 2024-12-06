# ChatGPT AI Agents Extension

## Overview

The ChatGPT AI Agents extension is a browser extension that enhances the ChatGPT experience by providing a sidebar with various AI agents. Each agent can assist users in generating content, summarizing text, and more, with customizable input fields.

## Features

-   Sidebar interface for easy access to AI agents.
-   Dynamic form fields for user input based on selected agent.
-   Integration with ChatGPT's input area for seamless interaction.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/chatgpt-ai-agents.git
    cd chatgpt-ai-agents
    ```

2. Load the extension in your browser:

    - For Chrome:
        1. Open Chrome and go to `chrome://extensions/`.
        2. Enable "Developer mode" in the top right corner.
        3. Click "Load unpacked" and select the directory where the extension files are located.

3. Ensure you have the necessary permissions set in the `manifest.json` file.

## Usage

1. Navigate to the ChatGPT website.
2. Click on the extension icon to open the sidebar.
3. Select an AI agent from the list to display its description and input fields.
4. Fill in the required fields and focus on the ChatGPT input area to combine the agent's prompt with your inputs.

## Key Components

### `manifest.json`

Defines the extension's metadata, permissions, and content scripts.

### `content.js`

Handles the creation of the sidebar, rendering of agents, and dynamic form generation based on user selection.

### `agents.json`

Stores the configuration for each AI agent, including their names, descriptions, prompts, and form fields.

### `styles.css`

Contains the styles for the sidebar and agent items, ensuring a user-friendly interface.

## Example Agent Configuration

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
