require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
const authMiddleware = require("./middlewares/authMiddleware");
const connectDatabase = require("./configs/connectDatabase");
const User = require("./models/user");
const Agent = require("./models/agents");

// Enable CORS with specific origin
app.use(
    cors({
        origin: "https://chatgpt.com", // Allow requests from your extension's domain
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

connectDatabase();

app.use(express.json());

const SECRET_KEY = "SECRET_KEY";

// User registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await User.create({
            username,
            password: hashedPassword,
        });
        res.json(newUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

// User login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword)
            return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user._id }, SECRET_KEY, {
            expiresIn: "1h",
        });
        res.json({ token });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get all agents
app.get("/agents", async (req, res) => {
    const agents = await Agent.find().populate("createdBy", "username");
    res.json(agents);
});

// Get current user
app.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

// Add an agent
app.post("/agents", authMiddleware, async (req, res) => {
    const { name, description, prompt, formFields } = req.body;

    try {
        const newAgent = await Agent.create({
            name,
            description,
            prompt,
            formFields,
            createdBy: req.user.id,
        });
        res.json(newAgent);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update an agent
app.put("/agents/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const agent = await Agent.findOne({ _id: id, createdBy: req.user.id });
        if (!agent) return res.status(403).json({ error: "Unauthorized" });

        const updatedAgent = await Agent.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json(updatedAgent);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Delete an agent
app.delete("/agents/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const agent = await Agent.findOne({ _id: id, createdBy: req.user.id });
        if (!agent) return res.status(403).json({ error: "Unauthorized" });

        await Agent.findByIdAndDelete(id);
        res.json({ message: "Agent deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Clone an agent
app.post("/agents/:id/clone", authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const agent = await Agent.findById(id);
        if (!agent) return res.status(404).json({ error: "Agent not found" });

        const clonedAgent = await Agent.create({
            ...agent.toObject(),
            _id: undefined,
            createdBy: req.user.id,
        });
        res.json(clonedAgent);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
