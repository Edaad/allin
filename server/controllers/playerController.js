// controllers/playerController.js

const Player = require('../models/player');
const Game = require('../models/game');
const User = require('../models/user');

// Get all players
const getPlayers = async (req, res) => {
    try {
        const players = await Player.find({})
            .populate('user_id', 'username names email')
            .populate('game_id', 'game_name');
        res.json(players);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).send(err);
    }
};

// Create a new player (unused in this context but included for completeness)
const createPlayer = async (req, res) => {
    try {
        const newPlayer = new Player(req.body);
        await newPlayer.save();
        res.status(201).send(newPlayer);
    } catch (err) {
        console.error('Error creating player:', err);
        res.status(400).send(err);
    }
};

// Send game invitations
const sendInvitations = async (req, res) => {
    try {
        const { gameId, inviterId, inviteeIds } = req.body;

        // Verify the inviter is the host of the game
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).send({ message: 'Game not found.' });
        }
        if (game.host_id.toString() !== inviterId) {
            return res.status(403).send({ message: 'Only the host can send invitations.' });
        }

        // Fetch the inviter's friends
        const inviter = await User.findById(inviterId);
        if (!inviter) {
            return res.status(404).send({ message: 'Inviter not found.' });
        }

        // Filter inviteeIds to only include friends
        const friendsSet = new Set(inviter.friends.map(id => id.toString()));
        const validInviteeIds = inviteeIds.filter(id => friendsSet.has(id));

        // Create Player documents with 'pending' status
        const invitations = validInviteeIds.map(inviteeId => ({
            user_id: inviteeId,
            game_id: gameId,
            invitation_status: 'pending',
        }));

        // Insert invitations
        await Player.insertMany(invitations, { ordered: false });

        res.status(201).send({ message: 'Invitations sent successfully.' });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error (invitation already exists)
            return res.status(400).send({ message: 'One or more users have already been invited.' });
        }
        console.error('Error sending invitations:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Cancel a game invitation
const cancelInvitation = async (req, res) => {
    try {
        const { gameId, inviterId, inviteeId } = req.body;

        // Verify the inviter is the host of the game
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).send({ message: 'Game not found.' });
        }
        if (game.host_id.toString() !== inviterId) {
            return res.status(403).send({ message: 'Only the host can cancel invitations.' });
        }

        // Delete the invitation
        const result = await Player.deleteOne({
            user_id: inviteeId,
            game_id: gameId,
            invitation_status: 'pending',
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'Invitation not found.' });
        }

        res.status(200).send({ message: 'Invitation canceled successfully.' });
    } catch (err) {
        console.error('Error canceling invitation:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Get all players for a specific game
const getGamePlayers = async (req, res) => {
    try {
        const { gameId } = req.params;

        const players = await Player.find({ game_id: gameId })
            .populate('user_id', 'username names email');

        res.status(200).json(players);
    } catch (err) {
        console.error('Error fetching game players:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Accept a game invitation
const acceptInvitation = async (req, res) => {
    try {
        const { userId, gameId } = req.body;

        // Find the player document
        const player = await Player.findOne({ user_id: userId, game_id: gameId });
        if (!player) {
            return res.status(404).send({ message: 'Invitation not found.' });
        }

        // Update the invitation_status to 'accepted'
        player.invitation_status = 'accepted';
        await player.save();

        res.status(200).send({ message: 'Invitation accepted successfully.' });
    } catch (err) {
        console.error('Error accepting invitation:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Decline a game invitation
const declineInvitation = async (req, res) => {
    try {
        const { userId, gameId } = req.body;

        // Delete the player document
        const result = await Player.deleteOne({ user_id: userId, game_id: gameId });
        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'Invitation not found.' });
        }

        res.status(200).send({ message: 'Invitation declined successfully.' });
    } catch (err) {
        console.error('Error declining invitation:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Get game invitations for a player
const getInvitationsForPlayer = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all pending invitations for the user
        const invitations = await Player.find({ user_id: userId, invitation_status: 'pending' })
            .populate({
                path: 'game_id',
                populate: { path: 'host_id', select: 'username' },
            });

        // Filter out any invitations where game_id is null (in case the game was deleted)
        const validInvitations = invitations.filter(invitation => invitation.game_id != null);

        // Map to extract game details
        const games = validInvitations.map(invitation => invitation.game_id);

        res.status(200).json(games);
    } catch (err) {
        console.error('Error fetching invitations:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Export all controller functions
module.exports = {
    getPlayers,
    createPlayer,
    sendInvitations,
    cancelInvitation,
    getGamePlayers,
    acceptInvitation,
    declineInvitation,
    getInvitationsForPlayer,
};
