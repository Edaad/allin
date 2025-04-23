const mongoose = require("mongoose");

const guestProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    games_joined: [{
        game_id: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        joined_at: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ["accepted", "pending", "rejected", "requested", "waitlist"],
            default: "pending"
        }
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Indexes for faster querying
guestProfileSchema.index({ phone: 1 });
guestProfileSchema.index({ email: 1 });

module.exports = mongoose.model("GuestProfile", guestProfileSchema); 