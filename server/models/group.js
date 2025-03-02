// models/group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: ''},
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

//Ensure group names are unique
groupSchema.index({ name: 1 }, { unique: true });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;


