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
		const players = await Player.find({ game_id: gameId }).populate("user_id", "username names email");
		res.status(200).json(players);
	} catch (err) {
		console.error("Error fetching game players:", err);
		res.status(500).json({ message: "Server error." });
	}
};

const acceptInvitation = async (req, res) => {
	try {
		const result = await playerService.acceptInvitation(req.body);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error accepting invitation/request:", err);
		res.status(500).json({ message: err.message });
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
	try {
		const { gameId, inviterId, inviteeId } = req.body;
		const result = await playerService.removePlayer(gameId, inviterId, inviteeId);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error removing player:", err);
		res.status(500).json({ message: err.message });
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

const getGameJoinRequests = async (req, res) => {
	try {
		const { gameId } = req.params;
		const { hostId } = req.query;
		const requests = await playerService.getGameJoinRequests(gameId, hostId);
		res.status(200).json(requests);
	} catch (err) {
		console.error("Error fetching join requests:", err);
		res.status(500).json({ message: err.message });
	}
};

const rejectJoinRequest = async (req, res) => {
	try {
		const { gameId, hostId, requesterId, reason } = req.body;
		const result = await playerService.rejectJoinRequest(gameId, hostId, requesterId, reason);
		res.status(200).json(result);
	} catch (err) {
		console.error("Error rejecting join request:", err);
		res.status(500).json({ message: err.message });
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
