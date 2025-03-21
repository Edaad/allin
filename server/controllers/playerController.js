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
        let player;
        let game;
        const { userId, gameId, requesterId } = req.body;

        // If requesterId is provided, it's a host accepting a join request
        if (requesterId) {
            // Verify the user is the host
            game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({ message: 'Game not found.' });
            }

            if (game.host_id.toString() !== userId) {
                return res.status(403).json({ message: 'Only the host can accept join requests.' });
            }

            // Find the player document
            player = await Player.findOne({
                user_id: requesterId,
                game_id: gameId,
                invitation_status: 'requested'
            });
            //TODO: Changes made in the following parts fix if needed
            if (!player) {
                return res.status(404).json({ message: 'Join request not found.' });
            }
        } else {
            // User is accepting their own invitation
            player = await Player.findOne({ user_id: userId, game_id: gameId });
            if (!player) {
                return res.status(404).json({ message: 'Invitation not found.' });
            }
            game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({ message: 'Game not found.' });
            }
        }

        // Count how many players are currently accepted
        const acceptedPlayersCount = await Player.countDocuments({
            game_id: gameId,
            invitation_status: 'accepted'
        });

        // Determine if the new player goes to the main list or waitlist
        if (acceptedPlayersCount < game.handed) {
            player.invitation_status = 'accepted';
            await player.save();
            return res.status(200).json({ 
                message: 'Join request accepted successfully.',
                status: 'accepted'
            });
        } else {
            player.invitation_status = 'waitlist';
            await player.save();
            
            // Get the player's position in the waitlist
            const waitlistPosition = await Player.countDocuments({
                game_id: gameId,
                invitation_status: 'waitlist',
                createdAt: { $lte: player.createdAt }
            });
            
            return res.status(200).json({ 
                message: 'Game is full. You have been added to the waitlist.',
                status: 'waitlist',
                position: waitlistPosition
            });
        }
    } catch (err) {
        console.error('Error accepting invitation/request:', err);
        res.status(500).json({ message: 'Server error.' });
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

//todo: changes made in removePlayer, fix if needed
const removePlayer = async (req, res) => {
    const { gameId, inviterId, inviteeId } = req.body;
    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        // Allow host or the player themselves to remove
        if (game.host_id.toString() !== inviterId && inviterId !== inviteeId) {
            return res.status(403).json({ message: 'You are not authorized to remove this player from the game.' });
        }

        // Remove the player record (it could be in any status: accepted, waitlist, or requested)
        const result = await Player.findOneAndDelete({
            game_id: gameId,
            user_id: inviteeId,
            invitation_status: { $in: ['accepted', 'waitlist', 'requested'] }
        });

        if (!result) {
            return res.status(404).json({ message: 'Player not found in the game.' });
        }

        // If an accepted player is removed, check for waitlisted players to promote
        if (result.invitation_status === 'accepted') {
            const acceptedPlayersCount = await Player.countDocuments({
                game_id: gameId,
                invitation_status: 'accepted'
            });
            if (acceptedPlayersCount < game.handed) {
                // Promote the earliest waitlisted player
                const waitlistedPlayer = await Player.findOne({
                    game_id: gameId,
                    invitation_status: 'waitlist'
                }).sort({ created_at: 1 });
                if (waitlistedPlayer) {
                    waitlistedPlayer.invitation_status = 'accepted';
                    await waitlistedPlayer.save();

                    return res.status(200).json({ 
                        message: 'Player removed and waitlisted player promoted.',
                        promotedPlayer: waitlistedPlayer.user_id
                    });
                }
            }
        }
        res.status(200).json({ message: 'Player removed from the game.' });
    } catch (error) {
        console.error('Error removing player:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

const requestToJoinGame = async (req, res) => {
    try {
        const { userId, gameId } = req.body;

        // Check if the game exists and is public
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        if (!game.is_public) {
            return res.status(403).json({ message: 'This game is private. You cannot request to join.' });
        }

        // Check if the user is already a player or has requested to join
        const existingPlayer = await Player.findOne({ user_id: userId, game_id: gameId });
        if (existingPlayer) {
            return res.status(400).json({
                message: `You have already ${existingPlayer.invitation_status === 'requested' ? 'requested to join' : 'been invited to'} this game.`
            });
        }

        // Check if the game is at capacity
        const acceptedPlayers = await Player.countDocuments({
            game_id: gameId,
            invitation_status: 'accepted'
        });

        // Create a new player record with status 'requested'
        const newPlayer = new Player({
            user_id: userId,
            game_id: gameId,
              // If game is full, add to waitlist, otherwise set to 'requested'
            invitation_status: acceptedPlayers >= game.handed ? 'waitlist' : 'requested'
        });

        await newPlayer.save();

          // Return appropriate message based on the status
        const message = acceptedPlayers >= game.handed 
            ? 'Added to waitlist. You will be notified when a spot becomes available.' 
            : 'Join request sent successfully.';

        res.status(201).json({ 
            message, 
            status: newPlayer.invitation_status,
            position: acceptedPlayers >= game.handed ? await Player.countDocuments({
                game_id: gameId,
                invitation_status: 'waitlist'
            }) : null
        });
    } catch (err) {
        console.error('Error requesting to join game:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Get all join requests for a specific game
const getGameJoinRequests = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { hostId } = req.query;

        // Verify the requester is the host
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: 'Only the host can view join requests.' });
        }

        // Get all players with 'requested' status
        const requests = await Player.find({
            game_id: gameId,
            invitation_status: 'requested'
        }).populate('user_id', 'username names email');

        res.status(200).json(requests);
    } catch (err) {
        console.error('Error fetching join requests:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Reject a join request
const rejectJoinRequest = async (req, res) => {
    try {
        const { gameId, hostId, requesterId, reason } = req.body;

        // Verify that the host is the one rejecting the request
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: 'Only the host can reject join requests.' });
        }

        // Update the player's status to 'rejected' and store the reason
        const result = await Player.findOneAndUpdate(
            { game_id: gameId, user_id: requesterId, invitation_status: 'requested' },
            { invitation_status: 'rejected', rejection_reason: reason || 'No reason provided' },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Join request not found.' });
        }

        res.status(200).json({ message: 'Join request rejected successfully.', rejection_reason: result.rejection_reason });
    } catch (err) {
        console.error('Error rejecting join request:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getWaitlistPosition = async (req, res) => {
    try {
        const { gameId, userId } = req.params;
        
        const player = await Player.findOne({
            game_id: gameId,
            user_id: userId,
            invitation_status: 'waitlist'
        });
        
        if (!player) {
            return res.status(404).json({ message: 'Player not found on waitlist.' });
        }
        
        // Count how many players are ahead in the waitlist (created earlier)
        const position = await Player.countDocuments({
            game_id: gameId,
            invitation_status: 'waitlist',
            createdAt: { $lte: player.createdAt }
        });
        
        res.status(200).json({ position });
    } catch (err) {
        console.error('Error getting waitlist position:', err);
    }
}
const getRejectedRequests = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all rejected requests for the user
        const rejectedRequests = await Player.find({
            user_id: userId,
            invitation_status: 'rejected'
        }).populate('game_id', 'game_name');

        res.status(200).json(rejectedRequests);
    } catch (err) {
        console.error('Error fetching rejected requests:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getRequestedGames = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all requested or rejected games for the user
        const requestedGames = await Player.find({
            user_id: userId,
            invitation_status: { $in: ['requested', 'rejected'] }
        }).populate({
            path: 'game_id',
            populate: { path: 'host_id', select: 'username' }
        });

        // Format the response
        const games = requestedGames.map(record => {
            const game = record.game_id;
            if (!game) return null;

            return {
                ...game.toObject(),
                playerStatus: record.invitation_status,
                rejectionReason: record.rejection_reason || null
            };
        }).filter(game => game !== null);

        res.status(200).json(games);
    } catch (err) {
        console.error('Error fetching requested games:', err);
        res.status(500).json({ message: 'Server error.' });
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
    removePlayer,
    requestToJoinGame,
    getGameJoinRequests,
    rejectJoinRequest,
    getWaitlistPosition,
    getRejectedRequests,
    getRequestedGames,
};