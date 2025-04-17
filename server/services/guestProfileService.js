// services/guestProfileService.js
const GuestProfile = require("../models/guestProfile");
const Game = require("../models/game");
const Player = require("../models/player");
const notificationService = require("../services/notificationService");

const createGuestProfileAndJoinGame = async ({ name, email, phone, gameId }) => {
  if (!name || !phone || !gameId) throw new Error("Name, phone, and gameId are required");

  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.is_public) throw new Error("This game is private. You cannot join as a guest.");

  const acceptedPlayers = await Player.countDocuments({
    game_id: gameId,
    invitation_status: "accepted"
  });

  let guestProfile = await GuestProfile.findOne({ phone });
  if (!guestProfile) {
    guestProfile = new GuestProfile({ name, email: email || undefined, phone });
    await guestProfile.save();
  }

  const existingPlayer = await Player.findOne({
    game_id: gameId,
    is_guest: true,
    guest_id: guestProfile._id
  });
  if (existingPlayer) {
    throw new Error(`You have already ${existingPlayer.invitation_status === 'requested' ? 'requested to join' : 'been invited to'} this game.`);
  }

  const invitationStatus = acceptedPlayers >= game.handed ? 'waitlist' : 'requested';

  guestProfile.games_joined.push({ game_id: gameId, status: invitationStatus });
  await guestProfile.save();

  const newPlayer = new Player({
    game_id: gameId,
    invitation_status: invitationStatus,
    is_guest: true,
    guest_id: guestProfile._id
  });
  await newPlayer.save();

  if (invitationStatus === 'requested') {
    await notificationService.notifyGameJoinRequest(game.host_id, guestProfile._id, gameId);
  }

  return {
    message: invitationStatus === 'waitlist'
      ? 'Added to waitlist. You will be notified when a spot becomes available.'
      : 'Join request sent successfully.',
    status: invitationStatus,
    position: invitationStatus === 'waitlist'
      ? await Player.countDocuments({ game_id: gameId, invitation_status: 'waitlist' })
      : null,
    guestProfile
  };
};

const acceptGuestJoinRequest = async ({ gameId, guestId, hostId }) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.host_id.toString() !== hostId) throw new Error("Not authorized to accept join requests");

  const guestProfile = await GuestProfile.findById(guestId);
  if (!guestProfile) throw new Error("Guest profile not found");

  const gameJoin = guestProfile.games_joined.find(g => g.game_id.toString() === gameId);
  if (gameJoin) {
    gameJoin.status = "accepted";
    await guestProfile.save();
  }

  const player = await Player.findOne({ game_id: gameId, is_guest: true, guest_id: guestId });
  if (player) {
    player.invitation_status = "accepted";
    await player.save();
  }

  await notificationService.notifyGameJoinAccepted(guestId, hostId, gameId);
};

const rejectGuestJoinRequest = async ({ gameId, guestId, hostId, reason }) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.host_id.toString() !== hostId) throw new Error("Not authorized to reject join requests");

  const guestProfile = await GuestProfile.findById(guestId);
  if (!guestProfile) throw new Error("Guest profile not found");

  const gameJoin = guestProfile.games_joined.find(g => g.game_id.toString() === gameId);
  if (gameJoin) {
    gameJoin.status = "rejected";
    await guestProfile.save();
  }

  await Player.deleteOne({ game_id: gameId, is_guest: true, guest_id: guestId });
};

module.exports = {
  createGuestProfileAndJoinGame,
  acceptGuestJoinRequest,
  rejectGuestJoinRequest
};
