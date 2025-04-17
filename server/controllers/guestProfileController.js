// controllers/guestProfileController.js
const guestProfileService = require('../services/guestProfileService');

const createGuestProfileAndJoinGame = async (req, res) => {
  try {
    const result = await guestProfileService.createGuestProfileAndJoinGame(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createGuestProfileAndJoinGame:", error);
    res.status(400).json({ message: error.message });
  }
};

const acceptGuestJoinRequest = async (req, res) => {
  try {
    const { gameId, guestId } = req.body;
    const hostId = req.user._id;
    await guestProfileService.acceptGuestJoinRequest({ gameId, guestId, hostId });
    res.json({ message: "Guest join request accepted" });
  } catch (error) {
    console.error("Error in acceptGuestJoinRequest:", error);
    res.status(400).json({ message: error.message });
  }
};

const rejectGuestJoinRequest = async (req, res) => {
  try {
    const { gameId, guestId, reason } = req.body;
    const hostId = req.user._id;
    await guestProfileService.rejectGuestJoinRequest({ gameId, guestId, hostId, reason });
    res.json({ message: "Guest join request rejected" });
  } catch (error) {
    console.error("Error in rejectGuestJoinRequest:", error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createGuestProfileAndJoinGame,
  acceptGuestJoinRequest,
  rejectGuestJoinRequest
};
