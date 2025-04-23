// controllers/playerController.js

const Player = require("../models/player");
const playerService = require("../services/playerService");

const getPlayers = async (req, res) => {
	try {
		const players = await Player.find({})
			.populate("user_id", "username names email")
			.populate("game_id", "game_name");
		res.json(players);
	} catch (err) {
		console.error("Error fetching players:", err);
		res.status(500).send(err);
	}
};

const createPlayer = async (req, res) => {
	try {
		const newPlayer = new Player(req.body);
		await newPlayer.save();
		res.status(201).send(newPlayer);
	} catch (err) {
		console.error("Error creating player:", err);
		res.status(400).send(err);
	}
};

const sendInvitations = async (req, res) => {
	try {
		const { gameId, inviterId, inviteeIds } = req.body;
		const results = await playerService.sendInvitations(gameId, inviterId, inviteeIds);
		res.status(200).json({ message: "Invitations sent successfully.", results, success: true });
	} catch (error) {
		console.error("Error sending invitations:", error);
		res.status(500).json({ error: error.message });
	}
};

const cancelInvitation = async (req, res) => {
	try {
		const { gameId, inviterId, inviteeId } = req.body;
		const result = await playerService.cancelInvitation(gameId, inviterId, inviteeId);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error canceling invitation:", err);
		res.status(500).json({ message: err.message });
	}
};

const getGamePlayers = async (req, res) => {
    try {
        const { gameId } = req.params;

        const players = await Player.find({ game_id: gameId })
            .populate('user_id', 'username names email')
            .populate('guest_id', 'name phone email');

        res.status(200).json(players);
    } catch (err) {
        console.error('Error fetching game players:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

const acceptInvitation = async (req, res) => {
    try {
        let player;
        let game;
        const { userId, gameId, requesterId, isGuest } = req.body;

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

            // Find the player document based on whether it's a guest or regular user
            const query = {
                game_id: gameId,
                invitation_status: { $in: ['requested', 'waitlist_requested'] }
            };

            if (isGuest) {
                query.guest_id = requesterId;
                query.is_guest = true;
            } else {
                query.user_id = requesterId;
                query.is_guest = false;
            }

            player = await Player.findOne(query);

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

                // Notify the player their request was accepted (only for regular users)
                if (!isGuest) {
                    try {
                        await notificationService.notifyGameJoinAccepted(requesterId, userId, gameId);
                        console.log("Game join accepted notification sent");
                    } catch (notificationError) {
                        console.error("Error creating notification:", notificationError);
                    }
                }

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
                    invitation_status: 'waitlist'
                });

                return res.status(200).json({
                    message: 'Player added to waitlist.',
                    status: 'waitlist',
                    position: waitlistPosition
                });
            }
        }

        // Regular invitation acceptance logic...
        player = await Player.findOne({
            user_id: userId,
            game_id: gameId,
            invitation_status: 'pending'
        });

        if (!player) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }

        player.invitation_status = 'accepted';
        await player.save();

        res.status(200).json({ message: 'Invitation accepted successfully.' });
    } catch (err) {
        console.error('Error accepting invitation:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const declineInvitation = async (req, res) => {
	try {
		const { userId, gameId } = req.body;
		const result = await playerService.declineInvitation(userId, gameId);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error declining invitation:", err);
		res.status(500).json({ message: err.message });
	}
};

const getInvitationsForPlayer = async (req, res) => {
	try {
		const { userId } = req.params;
		const invitations = await Player.find({
			user_id: userId,
			invitation_status: "pending",
		}).populate({
			path: "game_id",
			populate: { path: "host_id", select: "username" },
			options: { sort: { game_date: 1 } },
		});
		const validInvites = invitations.filter((i) => i.game_id != null).map((i) => i.game_id);
		res.status(200).json(validInvites);
	} catch (err) {
		console.error("Error fetching invitations:", err);
		res.status(500).json({ message: "Server error." });
	}
};

const removePlayer = async (req, res) => {
    const { gameId, inviterId, inviteeId, isGuest } = req.body;
    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        // Allow host or the player themselves to remove
        if (game.host_id.toString() !== inviterId && inviterId !== inviteeId) {
            return res.status(403).json({ message: 'You are not authorized to remove this player from the game.' });
        }

        // Create the query based on whether it's a guest or regular user
        const query = {
            game_id: gameId,
            invitation_status: { $in: ['accepted', 'waitlist', 'requested'] }
        };

        if (isGuest) {
            query.guest_id = inviteeId;
            query.is_guest = true;
        } else {
            query.user_id = inviteeId;
            query.is_guest = false;
        }

        // Remove the player record
        const result = await Player.findOneAndDelete(query);

        if (!result) {
            return res.status(404).json({ message: 'Player not found in the game.' });
        }

        // If host is removing player, notify the player (only for regular users)
        if (game.host_id.toString() === inviterId && inviterId !== inviteeId && !isGuest) {
            try {
                await notificationService.notifyPlayerRemoved(inviteeId, inviterId, gameId);
                console.log("Player removed notification sent");
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
        }
        // If player is removing themselves, notify the host (only for regular users)
        else if (inviterId === inviteeId && !isGuest) {
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

                    // Return information about the promoted player
                    const promotedPlayerId = waitlistedPlayer.is_guest ? 
                        waitlistedPlayer.guest_id : waitlistedPlayer.user_id;

                    return res.status(200).json({
                        message: 'Player removed and waitlisted player promoted.',
                        promotedPlayer: promotedPlayerId,
                        isGuestPromoted: waitlistedPlayer.is_guest
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
		const result = await playerService.requestToJoinGame(userId, gameId);
		res.status(201).json(result);
	} catch (err) {
		console.error("Error requesting to join game:", err);
		res.status(500).json({ message: err.message });
	}
};

// Get join requests for a game
const getGameJoinRequests = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { hostId } = req.query;

        // Verify the user is the host
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: 'Only the host can view join requests.' });
        }

        // Get both regular user and guest requests
        const requests = await Player.find({
            game_id: gameId,
            invitation_status: { $in: ['requested', 'waitlist_requested'] }
        })
        .populate('user_id', 'username names email')  // Populate user data for regular users
        .populate('guest_id', 'name phone email');    // Populate guest data for guest users

        res.status(200).json(requests);
    } catch (err) {
        console.error('Error fetching join requests:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const rejectJoinRequest = async (req, res) => {
    try {
        const { hostId, gameId, requesterId, reason, isGuest } = req.body;

        // Verify the user is the host
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: 'Only the host can reject join requests.' });
        }

        // Find and update the player document based on whether it's a guest or regular user
        const query = {
            game_id: gameId,
            invitation_status: { $in: ['requested', 'waitlist_requested'] }
        };

        if (isGuest) {
            query.guest_id = requesterId;
            query.is_guest = true;
        } else {
            query.user_id = requesterId;
            query.is_guest = false;
        }

        const player = await Player.findOne(query);

        if (!player) {
            return res.status(404).json({ message: 'Join request not found.' });
        }

        player.invitation_status = 'rejected';
        player.rejection_reason = reason;
        await player.save();

        // Only send notification for regular users
        if (!isGuest) {
            try {
                await notificationService.notifyGameJoinRejected(requesterId, hostId, gameId, reason);
                console.log("Game join rejection notification sent");
            } catch (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
        }

        res.status(200).json({ message: 'Join request rejected successfully.' });
    } catch (err) {
        console.error('Error rejecting join request:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getWaitlistPosition = async (req, res) => {
	try {
		const { gameId, userId } = req.params;
		const result = await playerService.getWaitlistPosition(gameId, userId);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error getting waitlist position:", err);
		res.status(500).json({ message: err.message });
	}
};

const getRejectedRequests = async (req, res) => {
	try {
		const { userId } = req.params;
		const results = await playerService.getRejectedRequests(userId);
		res.status(200).json(results);
	} catch (err) {
		console.error("Error fetching rejected requests:", err);
		res.status(500).json({ message: err.message });
	}
};

const getRequestedGames = async (req, res) => {
	try {
		const { userId } = req.params;
		const filters = req.query;
		const games = await playerService.getRequestedGames(userId, filters);
		res.status(200).json(games);
	} catch (err) {
		console.error("Error fetching requested games:", err);
		res.status(500).json({ message: err.message });
	}
};

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
