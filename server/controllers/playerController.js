// controllers/playerController.js

const Player = require('../models/player');
const Game = require('../models/game');
const User = require('../models/user');
const notificationService = require('../services/notificationService');

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

        // Send notifications to invitees and the host
        try {
            // Notify each invitee
            for (const inviteeId of validInviteeIds) {
                await notificationService.notifyGameInvitationReceived(inviteeId, inviterId, gameId);
            }

            // Notify the host about sent invitations
            await notificationService.notifyGameInvitationSent(inviterId, validInviteeIds.length, gameId);
            console.log(`Sent ${validInviteeIds.length} game invitations notifications`);
        } catch (notificationError) {
            console.error("Error creating invitation notifications:", notificationError);
            // Continue execution even if notification fails
        }

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

            if (!player) {
                return res.status(404).json({ message: 'Join request not found.' });
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

                // Notify the player their request was accepted
                try {
                    await notificationService.notifyGameJoinAccepted(requesterId, userId, gameId);
                    console.log("Game join accepted notification sent");
                } catch (notificationError) {
                    console.error("Error creating notification:", notificationError);
                }

                return res.status(200).json({
                    message: 'Join request accepted successfully.',
                    status: 'accepted'
                });
            } else {
                player.invitation_status = 'waitlist';
                await player.save();

                // Different notification could be sent for waitlist

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

            // Determine if the new player goes to the main list or waitlist
            if (acceptedPlayersCount < game.handed) {
                player.invitation_status = 'accepted';
                await player.save();

                // Notify the host that the player accepted
                try {
                    await notificationService.notifyGameInvitationAccepted(game.host_id, userId, gameId);
                    console.log("Game invitation accepted notification sent");
                } catch (notificationError) {
                    console.error("Error creating notification:", notificationError);
                }

                return res.status(200).json({
                    message: 'Invitation accepted successfully.',
                    status: 'accepted'
                });
            } else {
                player.invitation_status = 'waitlist';
                await player.save();

                // Different notification for waitlist

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

        // Get game and player info for notification before deletion
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).send({ message: 'Game not found.' });
        }

        const player = await Player.findOne({ user_id: userId, game_id: gameId });
        if (!player) {
            return res.status(404).send({ message: 'Invitation not found.' });
        }

        // Delete the player document
        await Player.deleteOne({ user_id: userId, game_id: gameId });

        // Notify the host that the invitation was declined
        try {
            await notificationService.notifyGameInvitationDeclined(game.host_id, userId, gameId);
            console.log("Game invitation declined notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
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

        // Remove the player record
        const result = await Player.findOneAndDelete({
            game_id: gameId,
            user_id: inviteeId,
            invitation_status: { $in: ['accepted', 'waitlist', 'requested'] }
        });

        if (!result) {
            return res.status(404).json({ message: 'Player not found in the game.' });
        }

        // If host is removing player, notify the player
        if (game.host_id.toString() === inviterId && inviterId !== inviteeId) {
            try {
                await notificationService.notifyPlayerRemoved(inviteeId, inviterId, gameId);
                console.log("Player removed notification sent");
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
        }
        // If player is removing themselves, notify the host
        else if (inviterId === inviteeId) {
            try {
                await notificationService.notifyPlayerLeft(game.host_id, inviteeId, gameId);
                console.log("Player left notification sent");
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
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

        // Create a new player record
        const newPlayer = new Player({
            user_id: userId,
            game_id: gameId,
            // If game is full, add to waitlist, otherwise set to 'requested'
            invitation_status: acceptedPlayers >= game.handed ? 'waitlist' : 'requested'
        });

        await newPlayer.save();

        // If the player is requesting to join (not waitlisted), notify the host
        if (newPlayer.invitation_status === 'requested') {
            try {
                await notificationService.notifyGameJoinRequest(game.host_id, userId, gameId);
                console.log("Game join request notification sent");
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
        }

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

        // Notify the player that their request was rejected
        try {
            await notificationService.notifyGameJoinRejected(requesterId, hostId, gameId, reason || 'No reason provided');
            console.log("Game join rejected notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
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
        const { blinds, dateRange, handed } = req.query;

        // Create base query
        let matchQuery = {
            user_id: userId,
            invitation_status: { $in: ['requested', 'rejected'] }
        };

        // Find all requested or rejected games for the user
        const requestedPlayers = await Player.find(matchQuery)
            .select('game_id invitation_status rejection_reason');

        // Get the game IDs
        const gameIds = requestedPlayers.map(p => p.game_id);

        if (gameIds.length === 0) {
            return res.status(200).json([]);
        }

        // Create a map of game ID to player status and rejection reason
        const playerStatusMap = {};
        requestedPlayers.forEach(record => {
            playerStatusMap[record.game_id.toString()] = {
                status: record.invitation_status,
                rejectionReason: record.rejection_reason || null
            };
        });

        // Build query for games with filters
        const gameQuery = {
            _id: { $in: gameIds }
        };

        // Apply filter for blinds if provided
        if (blinds) {
            if (Array.isArray(blinds)) {
                gameQuery.blinds = { $in: blinds };
            } else {
                gameQuery.blinds = { $in: blinds.split(",") };
            }
        }

        // Apply filter for handed range if provided
        if (handed) {
            try {
                const handedObj = typeof handed === "string" ? JSON.parse(handed) : handed;
                if (handedObj && typeof handedObj === "object") {
                    const handedQuery = {};
                    if (handedObj.min !== undefined) {
                        handedQuery.$gte = Number(handedObj.min);
                    }
                    if (handedObj.max !== undefined) {
                        handedQuery.$lte = Number(handedObj.max);
                    }
                    if (Object.keys(handedQuery).length > 0) {
                        gameQuery.handed = handedQuery;
                    }
                }
            } catch (e) {
                console.error("Error parsing handed filter:", e);
            }
        }

        // Apply filter for date range if provided
        if (dateRange) {
            try {
                const dateRangeObj = typeof dateRange === "string" ? JSON.parse(dateRange) : dateRange;

                if (dateRangeObj && typeof dateRangeObj === "object") {
                    const dateQuery = {};

                    if (dateRangeObj.startDate) {
                        const startDate = new Date(dateRangeObj.startDate);
                        const startDateOffset = startDate.getTimezoneOffset();
                        const startOffsetHours = Math.abs(startDateOffset) / 60;
                        startDate.setUTCHours(startOffsetHours, 0, 0, 0);
                        dateQuery.$gte = startDate;
                    }

                    if (dateRangeObj.endDate) {
                        const endDate = new Date(dateRangeObj.endDate);
                        const endDateOffset = endDate.getTimezoneOffset();
                        const endOffsetHours = Math.abs(endDateOffset) / 60;
                        endDate.setUTCHours(24 + endOffsetHours, 59, 59, 999);
                        dateQuery.$lte = endDate;
                    }

                    if (Object.keys(dateQuery).length > 0) {
                        gameQuery.game_date = dateQuery;
                    }
                }
            } catch (e) {
                console.error("Error parsing date range filter:", e);
            }
        }

        // Get the filtered games
        const games = await Game.find(gameQuery).populate("host_id", "username");

        // Format the response with player status and rejection reason
        const formattedGames = games.map(game => {
            const gameObj = game.toObject();
            const gameId = game._id.toString();
            const playerInfo = playerStatusMap[gameId] || { status: 'unknown', rejectionReason: null };

            return {
                ...gameObj,
                playerStatus: playerInfo.status,
                rejectionReason: playerInfo.rejectionReason
            };
        });

        res.status(200).json(formattedGames);
    } catch (err) {
        console.error('Error fetching requested games:', err);
        res.status(500).json({ message: 'Server error' });
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