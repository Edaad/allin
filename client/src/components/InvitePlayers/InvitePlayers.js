// InvitePlayers.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./InvitePlayers.css";
import Profile from "../Profile/Profile";

export default function InvitePlayers({ user, gameId, players, fetchPlayers }) {
	const [selectedFriends, setSelectedFriends] = useState([]);
	const [groupMembers, setGroupMembers] = useState([]);
	const [error, setError] = useState(null);
	const [game, setGame] = useState(null);
	const [loading, setLoading] = useState(true);

	// Fetch game details to check if it belongs to a group
	useEffect(() => {
		const fetchGame = async () => {
			try {
				setLoading(true);
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/games/${gameId}`
				);
				setGame(response.data);

				// If game belongs to a group, fetch group members
				if (response.data.group_id) {
					fetchGroupMembers(response.data.group_id);
				}
				setLoading(false);
			} catch (error) {
				console.error("Error fetching game details:", error);
				setError("Failed to load game details.");
				setLoading(false);
			}
		};

		fetchGame();
	}, [gameId]);

	// Fetch group members if the game belongs to a group
	const fetchGroupMembers = async (groupId) => {
		try {
			// Ensure groupId is just the ID string, not the full object
			const groupIdValue =
				typeof groupId === "object" ? groupId._id : groupId;

			const response = await axios.get(
				`${process.env.REACT_APP_API_URL}/group-members/${groupIdValue}`
			);

			// Extract members with accepted status
			const acceptedMembers = response.data.filter(
				(member) => member.membership_status === "accepted"
			);

			setGroupMembers(acceptedMembers);
		} catch (error) {
			console.error("Error fetching group members:", error);
			setError("Failed to load group members.");
		}
	};

	// Extract the IDs of people who have already been invited
	const invitedPersonIds = players
		.map((player) => {
			// Handle both cases - when user_id is populated and when it's just an ID
			if (player.user_id) {
				return typeof player.user_id === "object"
					? player.user_id._id
					: player.user_id;
			}
			return null;
		})
		.filter((id) => id !== null); // Remove any null entries

	// Get available people to invite (either group members or friends)
	const getAvailablePeople = () => {
		if (game?.group_id) {
			// For group games, show group members who haven't been invited
			return groupMembers
				.filter((member) => {
					// Make sure we have a valid user_id object
					if (!member.user_id || !member.user_id._id) {
						console.error("Invalid group member data:", member);
						return false;
					}

					// Check if this member is already invited (using string comparison)
					const isAlreadyInvited = invitedPersonIds.some(
						(id) => id.toString() === member.user_id._id.toString()
					);

					// Check if this member is the current user
					const isCurrentUser =
						user._id === member.user_id._id.toString() ||
						user._id.toString() === member.user_id._id.toString();

					// Return true if the member is not invited and not the current user
					return !isAlreadyInvited && !isCurrentUser;
				})
				.map((member) => member.user_id);
		} else {
			// For non-group games, show friends who haven't been invited
			return user.friends.filter(
				(friend) =>
					!invitedPersonIds.some(
						(id) => id.toString() === friend._id.toString()
					)
			);
		}
	};

	const availablePeople = getAvailablePeople();

	const handleCheckboxChange = (e, person) => {
		if (e.target.checked) {
			setSelectedFriends([...selectedFriends, person]);
		} else {
			setSelectedFriends(
				selectedFriends.filter((f) => f._id !== person._id)
			);
		}
	};

	const handleSendInvites = async () => {
		try {
			const inviteeIds = selectedFriends.map((person) => person._id);
			const data = {
				gameId: gameId,
				inviterId: user._id,
				inviteeIds: inviteeIds,
			};
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/send-invitations`,
				data
			);
			setSelectedFriends([]);
			fetchPlayers();
		} catch (error) {
			console.error("Error sending invitations:", error);
			setError("Failed to send invitations.");
		}
	};

	const handleInviteAll = async () => {
		try {
			// Make sure we have the user IDs in the correct format
			const allAvailableIds = availablePeople.map((person) => person._id);

			if (allAvailableIds.length === 0) {
				console.log("No available people to invite");
				setError("No group members available to invite");
				return;
			}

			console.log("Inviting all users:", allAvailableIds);
			console.log("Available people objects:", availablePeople);

			const data = {
				gameId: gameId,
				inviterId: user._id,
				inviteeIds: allAvailableIds,
			};

			console.log("Sending invitation request with data:", data);
			setError("Sending invitations...");

			const response = await axios.post(
				`${process.env.REACT_APP_API_URL}/players/send-invitations`,
				data
			);

			console.log("Invitation response:", response.data);

			// Check for message property in the response
			if (
				response.data &&
				response.data.message === "Invitations sent successfully."
			) {
				console.log("Successfully invited all group members");

				// Clear selected friends
				setSelectedFriends([]);

				// Add a success message
				setError("All group members have been invited successfully!");

				// Add a slight delay before refreshing the players list
				// This gives the server time to process all invitations
				setTimeout(async () => {
					await fetchPlayers();
					console.log("Player list refreshed after invitations sent");

					// Refresh group members to update available list
					if (game?.group_id) {
						await fetchGroupMembers(game.group_id);
						console.log(
							"Group members refreshed after invitations sent"
						);
					}
				}, 500);
			} else {
				console.log("Unexpected server response:", response.data);
				setError(
					"Server responded but invitations may not have been sent properly"
				);
			}
		} catch (error) {
			console.error("Error sending invitations to all members:", error);
			console.error(
				"Error details:",
				error.response?.data || "No response data"
			);
			setError(
				`Failed to send invitations: ${error.message || "Unknown error"
				}`
			);
		}
	};

	const handleCancelInvite = async (inviteeId) => {
		try {
			const data = {
				gameId: gameId,
				inviterId: user._id,
				inviteeId: inviteeId,
			};
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/cancel-invitation`,
				data
			);
			fetchPlayers();
		} catch (error) {
			console.error("Error canceling invitation:", error);
			setError("Failed to cancel invitation.");
		}
	};

	const handleRemovePlayer = async (inviteeId) => {
		try {
			const data = {
				gameId: gameId,
				inviterId: user._id,
				inviteeId: inviteeId,
			};
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/remove-player`,
				data
			);
			fetchPlayers();
		} catch (error) {
			console.error("Error removing player:", error);
			setError("Failed to remove player.");
		}
	};

	if (loading) {
		return <div className="loading-message">Loading...</div>;
	}

	return (
		<div className="invite-players-container">
			{error && <p className="error-message">{error}</p>}
			<div className="invite-players-list">
				<h3>
					{game?.group_id ? "Invite Group Members" : "Invite Friends"}
				</h3>

				{availablePeople.length > 0 ? (
					<>
						{game?.group_id && (
							<button
								className="invite-all-button"
								onClick={handleInviteAll}
								disabled={availablePeople.length === 0}
							>
								Invite All Group Members
							</button>
						)}

						<div className="invite-people-list">
							{availablePeople.map((person) => (
								<div
									key={person._id}
									className="invite-player-item"
								>
									<label
										htmlFor={person._id}
										className="player-label"
									>
										<input
											type="checkbox"
											id={person._id}
											onChange={(e) =>
												handleCheckboxChange(e, person)
											}
											checked={selectedFriends.some(
												(f) => f._id === person._id
											)}
										/>
										<Profile
											data={person}
											size="compact"
											currentUser={user}
											hideFriendActions={true}
											disableProfileClick={true}
										/>
									</label>
								</div>
							))}
						</div>

						<button
							className="invite-button"
							onClick={handleSendInvites}
							disabled={selectedFriends.length === 0}
						>
							Send Invitations
						</button>
					</>
				) : (
					<div>
						{game?.group_id
							? "All group members have been invited"
							: "No available friends to invite"}
					</div>
				)}
			</div>

			<h3>Pending Invitations</h3>
			<ul className="invitation-list">
				{players
					.filter((player) => player.invitation_status === "pending")
					.map((player) => (
						<li key={player._id} className="invitation-item">
							<Profile
								data={player.user_id}
								size="compact"
								currentUser={user}
								action="cancelInvitation"
								onAction={() =>
									handleCancelInvite(player.user_id._id)
								}
								hideFriendActions={true}
								disableProfileClick={true}
							/>
						</li>
					))}
				{players.filter(
					(player) => player.invitation_status === "pending"
				).length === 0 && (
						<li className="no-invitations-message">
							No pending invitations
						</li>
					)}
			</ul>

			<h3>Accepted Players</h3>
			<ul className="accepted-list">
				{players
					.filter((player) => player.invitation_status === "accepted")
					.map((player) => (
						<li key={player._id} className="accepted-item">
							<Profile
								data={player.user_id}
								size="compact"
								currentUser={user}
								action="removePlayer"
								onAction={() =>
									handleRemovePlayer(player.user_id._id)
								}
								hideFriendActions={true}
								disableProfileClick={true}
							/>
						</li>
					))}
				{players.filter(
					(player) => player.invitation_status === "accepted"
				).length === 0 && (
						<li className="no-players-message">No accepted players</li>
					)}
			</ul>

			<h3>Waitlist</h3>
			<ul className="waitlist-list">
				{players
					.filter((player) => player.invitation_status === "waitlist")
					.sort(
						(a, b) =>
							new Date(a.created_at || a.createdAt) -
							new Date(b.created_at || b.createdAt)
					)
					.map((player, index) => (
						<li key={player._id} className="waitlist-item">
							<div className="waitlist-player">
								<span className="waitlist-position">
									#{index + 1}
								</span>
								<Profile
									data={player.user_id}
									size="compact"
									currentUser={user}
									action="removePlayer"
									onAction={() =>
										handleRemovePlayer(player.user_id._id)
									}
									hideFriendActions={true}
									disableProfileClick={true}
								/>
							</div>
						</li>
					))}
				{players.filter(
					(player) => player.invitation_status === "waitlist"
				).length === 0 && (
						<li className="no-waitlist-message">
							No players on waitlist
						</li>
					)}
			</ul>
		</div>
	);
}
