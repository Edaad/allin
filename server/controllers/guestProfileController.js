const GuestProfile = require("../models/guestProfile");
const Game = require("../models/game");
const Player = require("../models/player");
const notificationService = require("../services/notificationService");

// Create a new guest profile and join a game
const createGuestProfileAndJoinGame = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const { name, email, phone, gameId } = req.body;

        // Validate required fields
        if (!name || !phone || !gameId) {
            console.log("Missing required fields:", { name, phone, gameId });
            return res.status(400).json({ message: "Name, phone, and gameId are required" });
        }

        // Check if game exists and is not full
        const game = await Game.findById(gameId);
        if (!game) {
            console.log("Game not found with ID:", gameId);
            return res.status(404).json({ message: "Game not found" });
        }

        if (!game.is_public) {
            console.log("Attempted to join private game:", gameId);
            return res.status(403).json({ message: "This game is private. You cannot join as a guest." });
        }

        // Check if game is full
        const acceptedPlayers = await Player.countDocuments({
            game_id: gameId,
            invitation_status: "accepted"
        });
        console.log("Current accepted players count:", acceptedPlayers);

        // Check if guest profile already exists with this phone number
        let guestProfile = await GuestProfile.findOne({ phone });
        console.log("Existing guest profile with phone:", guestProfile);

        if (!guestProfile) {
            // Create new guest profile
            guestProfile = new GuestProfile({
                name,
                email: email || undefined, // Only set email if it's provided
                phone
            });
            console.log("Creating new guest profile:", guestProfile);
            await guestProfile.save();
        }

        // Check if the guest is already a player or has requested to join
        const existingPlayer = await Player.findOne({ 
            game_id: gameId,
            is_guest: true,
            guest_id: guestProfile._id
        });
        console.log("Existing player record:", existingPlayer);

        if (existingPlayer) {
            return res.status(400).json({
                message: `You have already ${existingPlayer.invitation_status === 'requested' ? 'requested to join' : 'been invited to'} this game.`
            });
        }

        // Determine if the guest should be added to waitlist or as a requested player
        const invitationStatus = acceptedPlayers >= game.handed ? 'waitlist' : 'requested';
        console.log("Determined invitation status:", invitationStatus);

        // Add game to guest's games_joined array
        guestProfile.games_joined.push({
            game_id: gameId,
            status: invitationStatus
        });
        await guestProfile.save();

        // Create a new player record for the guest
        const newPlayer = new Player({
            game_id: gameId,
            invitation_status: invitationStatus,
            is_guest: true,
            guest_id: guestProfile._id,
            // DO NOT set user_id at all for guest players
        });
        console.log("Creating new player record:", newPlayer);
        await newPlayer.save();

        // If the guest is requesting to join (not waitlisted), notify the host
        if (invitationStatus === 'requested') {
            try {
                await notificationService.notifyGameJoinRequest(game.host_id, guestProfile._id, gameId);
                console.log("Game join request notification sent for guest");
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
            status: invitationStatus,
            position: acceptedPlayers >= game.handed ? await Player.countDocuments({
                game_id: gameId,
                invitation_status: 'waitlist'
            }) : null,
            guestProfile
        });
    } catch (error) {
        console.error("Error in createGuestProfileAndJoinGame:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ message: "Error creating guest profile and joining game" });
    }
};

// Accept a guest's join request
const acceptGuestJoinRequest = async (req, res) => {
    try {
        const { gameId, guestId } = req.body;
        const hostId = req.user._id; // Assuming you have user info in req.user

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: "Not authorized to accept join requests" });
        }

        // Update guest's game status
        const guestProfile = await GuestProfile.findById(guestId);
        if (!guestProfile) {
            return res.status(404).json({ message: "Guest profile not found" });
        }

        const gameJoin = guestProfile.games_joined.find(g => g.game_id.toString() === gameId);
        if (gameJoin) {
            gameJoin.status = "accepted";
            await guestProfile.save();
        }

        // Update game's player status
        const player = await Player.findOne({ 
            game_id: gameId,
            is_guest: true,
            guest_id: guestId
        });
        
        if (player) {
            player.invitation_status = "accepted";
            await player.save();
        }

        // Notify guest about acceptance
        await notificationService.notifyGameJoinAccepted(guestId, hostId, gameId);

        res.json({ message: "Guest join request accepted" });
    } catch (error) {
        console.error("Error in acceptGuestJoinRequest:", error);
        res.status(500).json({ message: "Error accepting guest join request" });
    }
};

// Reject a guest's join request
const rejectGuestJoinRequest = async (req, res) => {
    try {
        const { gameId, guestId, reason } = req.body;
        const hostId = req.user._id;

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        if (game.host_id.toString() !== hostId) {
            return res.status(403).json({ message: "Not authorized to reject join requests" });
        }

        // Update guest's game status
        const guestProfile = await GuestProfile.findById(guestId);
        if (!guestProfile) {
            return res.status(404).json({ message: "Guest profile not found" });
        }

        const gameJoin = guestProfile.games_joined.find(g => g.game_id.toString() === gameId);
        if (gameJoin) {
            gameJoin.status = "rejected";
            await guestProfile.save();
        }

        // Remove guest from game's players array
        await Player.deleteOne({ 
            game_id: gameId,
            is_guest: true,
            guest_id: guestId
        });

        res.json({ message: "Guest join request rejected" });
    } catch (error) {
        console.error("Error in rejectGuestJoinRequest:", error);
        res.status(500).json({ message: "Error rejecting guest join request" });
    }
};

module.exports = {
    createGuestProfileAndJoinGame,
    acceptGuestJoinRequest,
    rejectGuestJoinRequest
};