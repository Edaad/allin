// Overview.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Dashboard.css";
import "./Overview.css";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Profile from "../../../components/Profile/Profile";
import GameCard from "../../../components/GameCard/GameCard";

export function Overview() {
	const [user, setUser] = useState(null);
	const { userId, menuItem } = useParams();
	const navigate = useNavigate();
	const [page, setPage] = useState(menuItem || "overview");
	const [friends, setFriends] = useState([]);
	const [userGames, setUserGames] = useState({ upcoming: null, past: null });
	const [isLoading, setIsLoading] = useState(true);
	const [invitations, setInvitations] = useState([]); // Add this state for invitations
	const [friendRequests, setFriendRequests] = useState([]);
	const [suggestedFriends, setSuggestedFriends] = useState([]);

	useEffect(() => {
		const loggedUser = JSON.parse(localStorage.getItem("user"));
		if (loggedUser && loggedUser._id === userId) {
			setUser(loggedUser);
		} else {
			navigate("/signin"); // Redirect to sign-in if no user data found or user ID does not match
		}
	}, [userId, navigate]);

	useEffect(() => {
		setPage(menuItem || "overview");
	}, [menuItem]);

	// Fetch user data including friends
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/users/${userId}`
				);
				const fetchedUser = res.data;
				setUser(fetchedUser);
				setFriends(fetchedUser.friends); // Set friends from fetched data
			} catch (error) {
				console.error("Error fetching user data:", error);
				navigate("/signin"); // Redirect if fetching user data fails
			}
		};

		fetchUserData();
	}, [userId, navigate]);

	// Modify the useEffect for fetching user's games
	useEffect(() => {
		const fetchUserGames = async () => {
			if (!user) return;

			setIsLoading(true);
			try {
				// Fetch upcoming games (status = upcoming)
				const upcomingRes = await axios.get(
					`${process.env.REACT_APP_API_URL}/games/player/${userId}`,
					{ params: { status: "upcoming" } }
				);

				// Sort by date (earliest first) and get the soonest game
				const upcomingGames = upcomingRes.data.sort(
					(a, b) => new Date(a.game_date) - new Date(b.game_date)
				);
				const soonestGame =
					upcomingGames.length > 0 ? upcomingGames[0] : null;

				// Fetch completed games (status = completed)
				const completedRes = await axios.get(
					`${process.env.REACT_APP_API_URL}/games/player/${userId}`,
					{ params: { status: "completed" } }
				);

				// Sort by date (most recent first) and get the latest game
				const pastGames = completedRes.data.sort(
					(a, b) => new Date(b.game_date) - new Date(a.game_date)
				);
				const recentGame = pastGames.length > 0 ? pastGames[0] : null;

				setUserGames({
					upcoming: soonestGame,
					past: recentGame,
				});
			} catch (error) {
				console.error("Error fetching user games:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserGames();
	}, [userId, user]);

	// Add this useEffect to fetch invitations
	useEffect(() => {
		const fetchInvitations = async () => {
			if (!user) return;

			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/players/invitations/${userId}`
				);
				setInvitations(response.data);
			} catch (error) {
				console.error("Error fetching invitations:", error);
			}
		};

		fetchInvitations();
	}, [userId, user]);

	// Add this useEffect to fetch friend requests and suggestions
	useEffect(() => {
		const fetchFriendData = async () => {
			if (!user) return;

			try {
				// Get users with mutual friends (for "You Might Know")
				const suggestionsResponse = await axios.get(
					`${process.env.REACT_APP_API_URL}/users`,
					{ params: { userId: user._id, tab: "All" } }
				);

				// Filter only users with at least 1 mutual friend who are not already friends
				// and sort by number of mutual friends (descending)
				const suggestions = suggestionsResponse.data
					.filter(
						(u) =>
							u.mutualFriendsCount >= 1 &&
							!user.friends.some((f) => f._id === u._id) &&
							!user.friendRequests.some((f) => f._id === u._id) &&
							!user.pendingRequests.some((f) => f._id === u._id)
					)
					.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount)
					.slice(0, 3); // Get top 3

				setSuggestedFriends(suggestions);

				// Friend requests are already available in the user object
				setFriendRequests(user.friendRequests || []);
			} catch (error) {
				console.error("Error fetching friend data:", error);
			}
		};

		fetchFriendData();
	}, [user]);

	// Add these handler functions to handle accepting and declining invitations
	const handleAcceptInvitation = async (gameId, e) => {
		if (e) e.stopPropagation();

		try {
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/accept-invitation`,
				{
					userId: user._id,
					gameId: gameId,
				}
			);

			// Refresh invitations and games data
			const newInvitations = invitations.filter(
				(inv) => inv._id !== gameId
			);
			setInvitations(newInvitations);

			// Refetch games data
			const fetchUserGames = async () => {
				// Your existing fetchUserGames implementation
			};
			fetchUserGames();
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};

	const handleDeclineInvitation = async (gameId, e) => {
		if (e) e.stopPropagation();

		try {
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/decline-invitation`,
				{
					userId: user._id,
					gameId: gameId,
				}
			);

			// Update invitations list
			const newInvitations = invitations.filter(
				(inv) => inv._id !== gameId
			);
			setInvitations(newInvitations);
		} catch (error) {
			console.error("Error declining invitation:", error);
		}
	};

	return (
		<div className="dashboard">
			{user && (
				<Sidebar
					page={page}
					username={user.username}
				/>
			)}
			<div className="logged-content-container">
				{user ? (
					<div className="dashboard-heading">
						<h1>
							Hi <span>{user.names.firstName}</span>!
						</h1>
					</div>
				) : (
					<h1>Loading...</h1>
				)}
				<div className="overview-container">
					<div className="summary-item">
						<div className="games-overview">
							<div className="game-section">
								<div className="summary-header">
									<h2>Upcoming Game</h2>
									<div className="summary-header-divider"></div>
									<div
										className="summary-link"
										onClick={() =>
											navigate(
												`/dashboard/${userId}/games?tab=Upcoming Games`
											)
										}
									>
										View All
									</div>
								</div>
								{isLoading ? (
									<div className="loading-games">
										Loading...
									</div>
								) : (
									<>
										{userGames.upcoming ? (
											<GameCard
												key={userGames.upcoming._id}
												game={userGames.upcoming}
												user={user}
												showBorder={false}
											/>
										) : (
											<p className="no-games-message">
												No upcoming games
											</p>
										)}
									</>
								)}
							</div>
							<div className="game-section">
								<div className="summary-header">
									<h2>Past Game</h2>
									<div className="summary-header-divider"></div>
									<div
										className="summary-link"
										onClick={() =>
											navigate(
												`/dashboard/${userId}/games?tab=Past Games`
											)
										}
									>
										View All
									</div>
								</div>
								{isLoading ? (
									<div className="loading-games">
										Loading...
									</div>
								) : (
									<>
										{userGames.past ? (
											<GameCard
												key={userGames.past._id}
												game={userGames.past}
												user={user}
												showBorder={false}
											/>
										) : (
											<p className="no-games-message">
												No past games
											</p>
										)}
									</>
								)}
							</div>
						</div>
					</div>
					<div className="summary-secondary">
						<div className="summary-item">
							<div className="summary-header">
								<h2>Game Invitations</h2>
								<div className="summary-header-divider"></div>
								<div
									className="summary-link"
									onClick={() =>
										navigate(
											`/dashboard/${userId}/games?tab=Invitations`
										)
									}
								>
									View All
								</div>
							</div>
							<div className="invitations-container">
								{invitations.length > 0 ? (
									<div className="game-cards-container">
										{invitations
											.filter(
												(inv) =>
													inv != null &&
													inv.host_id != null
											)
											.slice(0, 2) // Show only the first 2 invitations
											.map((invitation) => (
												<GameCard
													key={invitation._id}
													game={invitation}
													user={user}
													showBorder={false}
													customActions={
														<div className="card-actions">
															<button
																className="accept-button"
																onClick={(e) =>
																	handleAcceptInvitation(
																		invitation._id,
																		e
																	)
																}
															>
																Accept
															</button>
															<button
																className="decline-button"
																onClick={(e) =>
																	handleDeclineInvitation(
																		invitation._id,
																		e
																	)
																}
															>
																Decline
															</button>
														</div>
													}
												/>
											))}
									</div>
								) : (
									<p>You have no game invitations.</p>
								)}
							</div>
						</div>
						<div className="summary-item">
							<div className="summary-header">
								<h2>Friends</h2>
								<div className="summary-header-divider"></div>
								<div
									className="summary-link"
									onClick={() =>
										navigate(
											`/dashboard/${userId}/community`
										)
									}
								>
									Community
								</div>
							</div>

							{/* Friend Requests Section */}
							{friendRequests.length > 0 && (
								<div className="friend-section">
									<h3>Friend Requests</h3>
									<div className="all-profiles-container">
										{friendRequests.map((friend) => (
											<Profile
												key={friend._id}
												data={friend}
												size="compact"
												currentUser={user}
												refreshData={() => {
													const fetchUserData =
														async () => {
															const res =
																await axios.get(
																	`${process.env.REACT_APP_API_URL}/users/${userId}`
																);
															setUser(res.data);
															setFriends(
																res.data.friends
															);
															setFriendRequests(
																res.data
																	.friendRequests ||
																[]
															);
														};
													fetchUserData();
												}}
											/>
										))}
									</div>
								</div>
							)}

							{/* You Might Know Section */}
							{suggestedFriends.length > 0 && (
								<div className="friend-section">
									<h3>You Might Know</h3>
									<div className="all-profiles-container">
										{suggestedFriends.map((friend) => (
											<Profile
												key={friend._id}
												data={friend}
												size="compact"
												currentUser={user}
												refreshData={() => {
													const fetchUserData = async () => {
														const res = await axios.get(
															`${process.env.REACT_APP_API_URL}/users/${userId}`
														);
														setUser(res.data);
														setFriends(res.data.friends);

														// Refetch suggestions
														const suggestionsResponse = axios.get(
															`${process.env.REACT_APP_API_URL}/users`,
															{
																params: {
																	userId: user._id,
																	tab: "All",
																},
															}
														);
														suggestionsResponse.then(
															(response) => {
																const newSuggestions = response.data
																	.filter(
																		(u) =>
																			u.mutualFriendsCount >= 1 &&
																			!res.data.friends.some(
																				(f) => f._id === u._id
																			) &&
																			!res.data.friendRequests.some(
																				(f) => f._id === u._id
																			) &&
																			!res.data.pendingRequests.some(
																				(f) => f._id === u._id
																			)
																	)
																	.sort(
																		(a, b) =>
																			b.mutualFriendsCount -
																			a.mutualFriendsCount
																	)
																	.slice(0, 5);

																setSuggestedFriends(newSuggestions);
															}
														);
													};
													fetchUserData();
												}}
											/>
										))}
									</div>
								</div>
							)}

							{/* Show message if no friends and no requests */}
							{friends.length === 0 &&
								friendRequests.length === 0 &&
								suggestedFriends.length === 0 && (
									<p>You have no friends yet.</p>
								)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Overview;
