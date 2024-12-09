const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        prompt: { type: String, required: true },
        formFields: { type: Array, default: [] },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;
