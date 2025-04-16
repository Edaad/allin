const Player = require('../models/player');
const Game = require('../models/game');
const notificationService = require('./notificationService');

const sendInvitations = async (gameId, inviterId, inviteeIds) => {
	const results = [];

	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");
	if (game.host_id.toString() !== inviterId)
		throw new Error("Only the host can send invitations");

	for (const inviteeId of inviteeIds) {
		const existing = await Player.findOne({
			game_id: gameId,
			user_id: inviteeId,
		});

		if (existing) {
			results.push({ inviteeId, status: "already_invited" });
			continue;
		}

		const newPlayer = new Player({
			game_id: gameId,
			user_id: inviteeId,
			invitation_status: "pending",
		});
		await newPlayer.save();

		try {
			await notificationService.notifyGameInvitationSent(
				inviteeId,
				inviterId,
				gameId
			);
			results.push({ inviteeId, status: "invited" });
		} catch (err) {
			console.error(`Failed to notify invitee ${inviteeId}`, err);
			results.push({ inviteeId, status: "invited_but_notification_failed" });
		}
	}

	return results;
};

const cancelInvitation = async (gameId, inviterId, inviteeId) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");
	if (game.host_id.toString() !== inviterId) throw new Error("Only the host can cancel invitations");

	const result = await Player.deleteOne({
		user_id: inviteeId,
		game_id: gameId,
		invitation_status: "pending",
	});

	if (result.deletedCount === 0) {
		throw new Error("Invitation not found");
	}

	return { message: "Invitation canceled successfully." };
};

const acceptInvitation = async ({ userId, gameId, requesterId }) => {
	let player;
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");

	if (requesterId) {
		if (game.host_id.toString() !== userId) throw new Error("Only the host can accept join requests");

		player = await Player.findOne({
			user_id: requesterId,
			game_id: gameId,
			invitation_status: { $in: ["requested", "waitlist_requested"] },
		});

		if (!player) throw new Error("Join request not found");
	} else {
		player = await Player.findOne({ user_id: userId, game_id: gameId });
		if (!player) throw new Error("Invitation not found");
	}

	const acceptedPlayersCount = await Player.countDocuments({
		game_id: gameId,
		invitation_status: "accepted",
	});

	if (acceptedPlayersCount < game.handed) {
		player.invitation_status = "accepted";
		await player.save();

		try {
			if (requesterId) {
				await notificationService.notifyGameJoinAccepted(requesterId, userId, gameId);
			} else {
				await notificationService.notifyGameInvitationAccepted(game.host_id, userId, gameId);
			}
		} catch (err) {
			console.error("Notification error:", err);
		}

		return { status: "accepted", message: "Invitation accepted successfully." };
	} else {
		player.invitation_status = "waitlist";
		await player.save();

		const position = await Player.countDocuments({
			game_id: gameId,
			invitation_status: "waitlist",
			createdAt: { $lte: player.createdAt },
		});

		return {
			status: "waitlist",
			message: "Game is full. You have been added to the waitlist.",
			position,
		};
	}
};

const declineInvitation = async (userId, gameId) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");

	const player = await Player.findOne({ user_id: userId, game_id: gameId });
	if (!player) throw new Error("Invitation not found");

	await Player.deleteOne({ user_id: userId, game_id: gameId });

	try {
		await notificationService.notifyGameInvitationDeclined(game.host_id, userId, gameId);
	} catch (err) {
		console.error("Notification error:", err);
	}

	return { message: "Invitation declined successfully." };
};

const removePlayer = async (gameId, inviterId, inviteeId) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");

	if (game.host_id.toString() !== inviterId && inviterId !== inviteeId) {
		throw new Error("You are not authorized to remove this player from the game.");
	}

	const result = await Player.findOneAndDelete({
		game_id: gameId,
		user_id: inviteeId,
		invitation_status: { $in: ["accepted", "waitlist", "requested"] },
	});

	if (!result) throw new Error("Player not found in the game.");

	if (game.host_id.toString() === inviterId && inviterId !== inviteeId) {
		try {
			await notificationService.notifyPlayerRemoved(inviteeId, inviterId, gameId);
		} catch (err) {
			console.error("Notification error:", err);
		}
	} else if (inviterId === inviteeId) {
		try {
			await notificationService.notifyPlayerLeft(game.host_id, inviteeId, gameId);
		} catch (err) {
			console.error("Notification error:", err);
		}
	}

	if (result.invitation_status === "accepted") {
		const acceptedPlayersCount = await Player.countDocuments({
			game_id: gameId,
			invitation_status: "accepted",
		});

		if (acceptedPlayersCount < game.handed) {
			const waitlistedPlayer = await Player.findOne({
				game_id: gameId,
				invitation_status: "waitlist",
			}).sort({ created_at: 1 });

			if (waitlistedPlayer) {
				waitlistedPlayer.invitation_status = "accepted";
				await waitlistedPlayer.save();
				return {
					message: "Player removed and waitlisted player promoted.",
					promotedPlayer: waitlistedPlayer.user_id,
				};
			}
		}
	}

	return { message: "Player removed from the game." };
};

const requestToJoinGame = async (userId, gameId) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");
	if (!game.is_public) throw new Error("This game is private. You cannot request to join.");

	const existingPlayer = await Player.findOne({ user_id: userId, game_id: gameId });
	if (existingPlayer) {
		throw new Error(
			`You have already ${
				existingPlayer.invitation_status === "requested"
					? "requested to join"
					: "been invited to"
			} this game.`
		);
	}

	const acceptedPlayers = await Player.countDocuments({
		game_id: gameId,
		invitation_status: "accepted",
	});

	const isGameFull = acceptedPlayers >= game.handed;

	const newPlayer = new Player({
		user_id: userId,
		game_id: gameId,
		invitation_status: isGameFull ? "waitlist_requested" : "requested",
	});

	await newPlayer.save();

	return {
		message: isGameFull
			? "Join request for waitlist sent successfully. You will be notified when the host approves your request."
			: "Join request sent successfully.",
		status: newPlayer.invitation_status,
		position: null,
	};
};

const getGameJoinRequests = async (gameId, hostId) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");
	if (game.host_id.toString() !== hostId) throw new Error("Only the host can view join requests");

	const requests = await Player.find({
		game_id: gameId,
		invitation_status: { $in: ["requested", "waitlist_requested"] },
	}).populate("user_id", "username names email");

	return requests;
};

const rejectJoinRequest = async (gameId, hostId, requesterId, reason) => {
	const game = await Game.findById(gameId);
	if (!game) throw new Error("Game not found");
	if (game.host_id.toString() !== hostId) throw new Error("Only the host can reject join requests");

	const result = await Player.findOneAndUpdate(
		{
			game_id: gameId,
			user_id: requesterId,
			invitation_status: { $in: ["requested", "waitlist_requested"] },
		},
		{
			invitation_status: "rejected",
			rejection_reason: reason || "No reason provided",
		},
		{ new: true }
	);

	if (!result) throw new Error("Join request not found");

	try {
		await notificationService.notifyGameJoinRejected(
			requesterId,
			hostId,
			gameId,
			reason || "No reason provided"
		);
	} catch (err) {
		console.error("Notification error:", err);
	}

	return {
		message: "Join request rejected successfully.",
		rejection_reason: result.rejection_reason,
		request_type: result.invitation_status === "waitlist_requested" ? "waitlist" : "standard",
	};
};

const getWaitlistPosition = async (gameId, userId) => {
	const player = await Player.findOne({
		game_id: gameId,
		user_id: userId,
		invitation_status: "waitlist",
	});
	if (!player) throw new Error("Player not found on waitlist.");

	const position = await Player.countDocuments({
		game_id: gameId,
		invitation_status: "waitlist",
		createdAt: { $lte: player.createdAt },
	});

	return { position };
};

const getRejectedRequests = async (userId) => {
	const rejectedRequests = await Player.find({
		user_id: userId,
		invitation_status: "rejected",
	}).populate("game_id", "game_name");
	return rejectedRequests;
};

const getRequestedGames = async (userId, filters) => {
	const { blinds, dateRange, handed } = filters;

	const matchQuery = {
		user_id: userId,
		invitation_status: { $in: ["requested", "rejected"] },
	};

	const requestedPlayers = await Player.find(matchQuery).select(
		"game_id invitation_status rejection_reason"
	);

	const gameIds = requestedPlayers.map((p) => p.game_id);
	if (gameIds.length === 0) return [];

	const playerStatusMap = {};
	requestedPlayers.forEach((record) => {
		playerStatusMap[record.game_id.toString()] = {
			status: record.invitation_status,
			rejectionReason: record.rejection_reason || null,
		};
	});

	const gameQuery = { _id: { $in: gameIds } };

	if (blinds) {
		gameQuery.blinds = Array.isArray(blinds) ? { $in: blinds } : { $in: blinds.split(",") };
	}

	if (handed) {
		try {
			const handedObj = typeof handed === "string" ? JSON.parse(handed) : handed;
			if (handedObj && typeof handedObj === "object") {
				const handedQuery = {};
				if (handedObj.min !== undefined) handedQuery.$gte = Number(handedObj.min);
				if (handedObj.max !== undefined) handedQuery.$lte = Number(handedObj.max);
				if (Object.keys(handedQuery).length > 0) gameQuery.handed = handedQuery;
			}
		} catch (e) {
			console.error("Error parsing handed filter:", e);
		}
	}

	if (dateRange) {
		try {
			const dateRangeObj = typeof dateRange === "string" ? JSON.parse(dateRange) : dateRange;
			if (dateRangeObj && typeof dateRangeObj === "object") {
				const dateQuery = {};
				if (dateRangeObj.startDate) {
					const startDate = new Date(dateRangeObj.startDate);
					startDate.setUTCHours(0, 0, 0, 0);
					dateQuery.$gte = startDate;
				}
				if (dateRangeObj.endDate) {
					const endDate = new Date(dateRangeObj.endDate);
					endDate.setUTCHours(23, 59, 59, 999);
					dateQuery.$lte = endDate;
				}
				if (Object.keys(dateQuery).length > 0) gameQuery.game_date = dateQuery;
			}
		} catch (e) {
			console.error("Error parsing date range filter:", e);
		}
	}

	const games = await Game.find(gameQuery)
		.populate("host_id", "username")
		.sort({ game_date: 1 });

	return games.map((game) => {
		const gameObj = game.toObject();
		const playerInfo = playerStatusMap[gameObj._id.toString()] || {
			status: "unknown",
			rejectionReason: null,
		};
		return {
			...gameObj,
			playerStatus: playerInfo.status,
			rejectionReason: playerInfo.rejectionReason,
		};
	});
};

module.exports = {
	sendInvitations,
    cancelInvitation,
    acceptInvitation,
    declineInvitation,
    removePlayer,
    requestToJoinGame,
    getGameJoinRequests,
    rejectJoinRequest,
    getWaitlistPosition,
    getRejectedRequests,
    getRequestedGames,
};
