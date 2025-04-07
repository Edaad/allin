// controllers/gameController.js

const Game = require('../models/game');
const Player = require('../models/player');
// Add this import for notification service
const notificationService = require('../services/notificationService');

const getGames = async (req, res) => {
    try {
        const { status, host_id, is_public, blinds, userId, dateRange } =
            req.query;
        const query = {};

        // Filter by game_status if provided
        if (status) {
            query.game_status = status;
        }

        // Filter by host_id if provided
        if (host_id) {
            query.host_id = host_id;
        }

        // Filter by is_public if provided
        if (is_public !== undefined) {
            // Convert the string to a boolean
            query.is_public = is_public === "true";
        }

        // Filter by blinds if provided
        if (blinds) {
            if (Array.isArray(blinds)) {
                query.blinds = { $in: blinds };
            } else {
                query.blinds = { $in: blinds.split(",") };
            }
        }

        // Filter by handed range if provided
        // Check for both direct handed parameter and handed[min]/handed[max] format
        const handedMin =
            req.query["handed[min]"] ||
            (req.query.handed && req.query.handed.min);
        const handedMax =
            req.query["handed[max]"] ||
            (req.query.handed && req.query.handed.max);

        if (handedMin !== undefined || handedMax !== undefined) {
            const handedQuery = {};
            if (handedMin !== undefined) {
                handedQuery.$gte = Number(handedMin);
            }
            if (handedMax !== undefined) {
                handedQuery.$lte = Number(handedMax);
            }
            if (Object.keys(handedQuery).length > 0) {
                query.handed = handedQuery;
            }
        } else if (req.query.handed) {
            try {
                // Handle the case where handed is a JSON string
                const handedObj =
                    typeof req.query.handed === "string"
                        ? JSON.parse(req.query.handed)
                        : req.query.handed;

                if (handedObj && typeof handedObj === "object") {
                    const handedQuery = {};
                    if (handedObj.min !== undefined) {
                        handedQuery.$gte = Number(handedObj.min);
                    }
                    if (handedObj.max !== undefined) {
                        handedQuery.$lte = Number(handedObj.max);
                    }
                    if (Object.keys(handedQuery).length > 0) {
                        query.handed = handedQuery;
                    }
                }
            } catch (e) {
                console.error("Error parsing handed filter:", e);
            }
        }

        // Filter by date range if provided
        if (dateRange) {
            try {
                const dateRangeObj =
                    typeof dateRange === "string"
                        ? JSON.parse(dateRange)
                        : dateRange;

                if (dateRangeObj && typeof dateRangeObj === "object") {
                    const dateQuery = {};

                    // Dynamically determine the timezone offset for each date

                    if (dateRangeObj.startDate) {
                        const startDate = new Date(dateRangeObj.startDate);

                        const startDateOffset = startDate.getTimezoneOffset();
                        const startOffsetHours = Math.abs(startDateOffset) / 60;
                        startDate.setUTCHours(startOffsetHours, 0, 0, 0);

                        console.log(
                            `Start date ${dateRangeObj.startDate} has offset of ${startOffsetHours} hours`
                        );
                        console.log(
                            `Adjusted start date: ${startDate.toISOString()}`
                        );

                        dateQuery.$gte = startDate;
                    }

                    if (dateRangeObj.endDate) {
                        // Create date at end of day local time
                        const endDate = new Date(dateRangeObj.endDate);
                        const endDateOffset = endDate.getTimezoneOffset();
                        const endOffsetHours = Math.abs(endDateOffset) / 60;

                        endDate.setUTCHours(24 + endOffsetHours, 59, 59, 999);

                        console.log(
                            `End date ${dateRangeObj.endDate} has offset of ${endOffsetHours} hours`
                        );
                        console.log(
                            `Adjusted end date: ${endDate.toISOString()}`
                        );

                        dateQuery.$lte = endDate;
                    }

                    if (Object.keys(dateQuery).length > 0) {
                        query.game_date = dateQuery;
                        console.log(
                            "Final date query:",
                            JSON.stringify(dateQuery)
                        );
                    }
                }
            } catch (e) {
                console.error("Error parsing date range filter:", e);
            }
        }

        // If userId is provided, filter out games hosted by the user and add player status
        if (userId) {
            // First filter out games hosted by the user
            query.host_id = { $ne: userId };

            // Find all player records for this user
            const playerRecords = await Player.find({
                user_id: userId,
            }).select("game_id invitation_status");

            // Create a map of game IDs to player status
            const playerStatusMap = {};
            playerRecords.forEach((record) => {
                playerStatusMap[record.game_id.toString()] =
                    record.invitation_status;
            });

            // Get games with the filtered query, sorted by game date
            const games = await Game.find(query)
                .populate("host_id", "username")
                .sort({ game_date: 1 }); // Sort by date, ascending order

            // Add player status to each game and filter out games the user has already interacted with
            const filteredGames = games
                .map((game) => {
                    const gameObject = game.toObject();
                    const gameId = game._id.toString();
                    gameObject.playerStatus =
                        playerStatusMap[gameId] || "none";
                    return gameObject;
                })
                .filter((game) => {
                    // Only include games with 'none' or 'waitlist' status when is_public is true
                    if (is_public) {
                        return (
                            !game.playerStatus ||
                            ["none", "waitlist"].includes(game.playerStatus)
                        );
                    }
                    return true;
                });

            res.json(filteredGames);
        } else {
            // If no userId provided, just return all games that match the query
            const games = await Game.find(query)
                .populate("host_id", "username")
                .sort({ game_date: 1 }) // Sort by date, ascending order
                .distinct('_id'); // Add distinct to ensure unique games
            
            // Fetch complete game documents for the unique IDs
            const uniqueGames = await Game.find({ _id: { $in: games } })
                .populate("host_id", "username")
                .sort({ game_date: 1 });
                
            res.json(uniqueGames);
        }
    } catch (err) {
        console.error("Error fetching games:", err);
        res.status(500).send(err);
    }
};

const getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate(
            "host_id",
            "username"
        );
        if (!game) {
            return res.status(404).send({ message: "Game not found" });
        }
        res.json(game);
    } catch (err) {
        console.error("Error fetching game:", err);
        res.status(500).send(err);
    }
};

const createGame = async (req, res) => {
    try {
        // Create a new object with explicit boolean conversion for is_public
        const gameData = {
            ...req.body,
            is_public: req.body.is_public === true
        };

        console.log("Creating game with data:", gameData);

        const newGame = new Game(gameData);
        await newGame.save();

        // Add notification for game creation
        try {
            await notificationService.notifyGameCreated(gameData.host_id, newGame._id);
            console.log("Game creation notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

        console.log("Game created:", newGame);
        res.status(201).send(newGame);
    } catch (err) {
        console.error('Error creating game:', err);
        res.status(400).send(err);
    }
};

const updateGame = async (req, res) => {
    try {
        // Ensure boolean conversion for is_public field
        const updateData = {
            ...req.body
        };

        if (updateData.is_public !== undefined) {
            updateData.is_public = updateData.is_public === true;
        }

        const updatedGame = await Game.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedGame) {
            return res.status(404).send({ message: 'Game not found' });
        }

        // Add notification for game update
        try {
            // This will notify both players and the host
            await notificationService.notifyGameEdited(updatedGame._id);
            console.log("Game update notifications sent");
        } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue execution even if notification fails
        }

        res.json(updatedGame);
    } catch (err) {
        console.error('Error updating game:', err);
        res.status(400).send(err);
    }
};

const deleteGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).send({ message: 'Game not found' });
        }

        const players = await Player.find({ game_id: game._id, invitation_status: 'accepted' });
        const playerIds = players.map(player => player.user_id);
        const gameName = game.game_name;
        const hostId = game.host_id;

        // Delete associated players
        await Player.deleteMany({ game_id: game._id });

        // Delete the game
        await Game.findByIdAndDelete(game._id);

        // Send notifications to all players and the host
        try {
            await notificationService.notifyGameDeleted(game._id, gameName, playerIds, hostId);
            console.log("Game deletion notifications sent");
        } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue execution even if notification fails
        }

        res.json({ message: 'Game and associated players deleted successfully' });
    } catch (err) {
        console.error('Error deleting game:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Get games for a player with optional status filter
const getGamesForPlayer = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, blinds, dateRange, handed } = req.query;

        // Find all games where the user is a player and invitation_status is 'accepted'
        const playerGames = await Player.find({
            user_id: userId,
            invitation_status: "accepted",
        }).select("game_id");

        const acceptedGameIds = playerGames.map((pg) => pg.game_id);

        // Updated query to only show games the user has joined (accepted invitations)
        const query = {
            _id: { $in: acceptedGameIds },
        };

        if (status) {
            query.game_status = status;
        }

        // Apply filter for blinds if provided
        if (blinds) {
            if (Array.isArray(blinds)) {
                query.blinds = { $in: blinds };
            } else {
                query.blinds = { $in: blinds.split(",") };
            }
        }

        // Apply filter for handed range if provided
        if (handed) {
            try {
                const handedObj =
                    typeof handed === "string" ? JSON.parse(handed) : handed;
                if (handedObj && typeof handedObj === "object") {
                    const handedQuery = {};
                    if (handedObj.min !== undefined) {
                        handedQuery.$gte = Number(handedObj.min);
                    }
                    if (handedObj.max !== undefined) {
                        handedQuery.$lte = Number(handedObj.max);
                    }
                    if (Object.keys(handedQuery).length > 0) {
                        query.handed = handedQuery;
                    }
                }
            } catch (e) {
                console.error("Error parsing handed filter:", e);
            }
        }

        // Apply filter for date range if provided
        if (dateRange) {
            try {
                const dateRangeObj =
                    typeof dateRange === "string"
                        ? JSON.parse(dateRange)
                        : dateRange;

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
                        query.game_date = dateQuery;
                    }
                }
            } catch (e) {
                console.error("Error parsing date range filter:", e);
            }
        }

        // Get all matching games, sorted by date
        const games = await Game.find(query)
            .populate("host_id", "username")
            .sort({ game_date: 1 }); // Sort by date, ascending order

        // Add player status to each game (all should be 'accepted' in this case)
        const gamesWithStatus = games.map((game) => {
            const gameObject = game.toObject();
            gameObject.playerStatus = "accepted";
            return gameObject;
        });

        res.status(200).json(gamesWithStatus);
    } catch (err) {
        console.error("Error fetching games for player:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Add to Waitlist
const addToWaitlist = async (req, res) => {
    const { gameId } = req.params;
    const { userId } = req.body;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Check if the user is already on the waitlist
        if (game.waitlist.includes(userId)) {
            return res
                .status(400)
                .json({ error: "User is already on the waitlist" });
        }

        // Add the user to the waitlist
        game.waitlist.push(userId);
        await game.save();

        res.status(200).json({
            message: "Added to waitlist",
            position: game.waitlist.length,
        });
    } catch (error) {
        console.error("Error adding to waitlist:", error);
        res.status(500).json({ error: "Failed to add to waitlist" });
    }
};

// Remove from Waitlist
const removeFromWaitlist = async (req, res) => {
    const { gameId, userId } = req.params;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Remove the user from the waitlist
        game.waitlist = game.waitlist.filter((id) => id.toString() !== userId);
        await game.save();

        res.status(200).json({ message: "Removed from waitlist" });
    } catch (error) {
        console.error("Error removing from waitlist:", error);
        res.status(500).json({ error: "Failed to remove from waitlist" });
    }
};

const getWaitlist = async (req, res) => {
    const { gameId } = req.params;

    try {
        const game = await Game.findById(gameId).populate(
            "waitlist",
            "username email"
        );
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        res.status(200).json({ waitlist: game.waitlist });
    } catch (error) {
        console.error("Error fetching waitlist:", error);
        res.status(500).json({ error: "Failed to fetch waitlist" });
    }
};

module.exports = {
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    getGamesForPlayer,
    addToWaitlist,
    removeFromWaitlist,
    getWaitlist,
};