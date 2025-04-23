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
	const [userGames, setUserGames] = useState({ upcoming: null });
	const [isLoading, setIsLoading] = useState(true);
	const [invitations, setInvitations] = useState([]);
	const [friendRequests, setFriendRequests] = useState([]);
	const [suggestedFriends, setSuggestedFriends] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

	useEffect(() => {
		const loggedUser = JSON.parse(localStorage.getItem("user"));
		if (loggedUser && loggedUser._id === userId) {
			setUser(loggedUser);
		} else {
			navigate("/signin");
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
				setFriends(fetchedUser.friends);
			} catch (error) {
				console.error("Error fetching user data:", error);
				navigate("/signin");
			}
		};

		fetchUserData();
	}, [userId, navigate]);

	// Fetch upcoming games
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

				setUserGames({
					upcoming: soonestGame,
				});
			} catch (error) {
				console.error("Error fetching user games:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserGames();
	}, [userId, user]);

	// Fetch game invitations
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

	// Fetch friend requests and suggestions
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

	// Fetch notifications
	useEffect(() => {
		const fetchNotifications = async () => {
			if (!user) return;

			setIsLoadingNotifications(true);
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/notifications/${userId}`,
					{ params: { limit: 3 } } // Fetch only 3 recent notifications
				);
				// The correct path to the notifications array from the response
				setNotifications(response.data.notifications || []);
			} catch (error) {
				console.error("Error fetching notifications:", error);
			} finally {
				setIsLoadingNotifications(false);
			}
		};

		fetchNotifications();
	}, [userId, user]);

	// Handle invitations
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

			// Refetch the updated upcoming games
			const fetchUpcomingGames = async () => {
				const upcomingRes = await axios.get(
					`${process.env.REACT_APP_API_URL}/games/player/${userId}`,
					{ params: { status: "upcoming" } }
				);

				const upcomingGames = upcomingRes.data.sort(
					(a, b) => new Date(a.game_date) - new Date(b.game_date)
				);
				const soonestGame =
					upcomingGames.length > 0 ? upcomingGames[0] : null;

				setUserGames({
					upcoming: soonestGame,
				});
			};

			fetchUpcomingGames();
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

	// Format notification timestamps
	const formatNotificationTime = (timestamp) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 60) {
			return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
		} else if (diffHrs < 24) {
			return `${diffHrs} ${diffHrs === 1 ? "hour" : "hours"} ago`;
		} else {
			return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
		}
	};

	return (
		<div className="dashboard">
			{user && <Sidebar page={page} username={user.username} />}
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

				<div className="overview-layout">
					{/* Left Section (70%) - Games */}
					<div className="overview-main">
						<div className="summary-item">
							<div className="summary-header">
								<h2>Next Game</h2>
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
								<div className="loading-games">Loading...</div>
							) : (
								<>
									{userGames.upcoming ? (
										<GameCard
											key={userGames.upcoming._id}
											game={userGames.upcoming}
											user={user}
											showBorder={true}
										/>
									) : (
										<div className="no-games-message">
											<p>
												You have no upcoming games
												scheduled
											</p>
											<button
												className="browse-games-button"
												onClick={() =>
													navigate(
														`/dashboard/${userId}/games`
													)
												}
											>
												Browse Games
											</button>
										</div>
									)}
								</>
							)}
						</div>

						<div className="summary-item">
							<div className="summary-header">
								<h2>Game Invitations</h2>
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
											.map((invitation) => (
												<GameCard
													key={invitation._id}
													game={invitation}
													user={user}
													showBorder={true}
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
									<div className="no-games-message">
										<p>You have no game invitations</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Section (30%) - Notifications & Friends */}
					<div className="overview-sidebar">
						{/* Notifications */}
						<div className="summary-item">
							<div className="summary-header">
								<h2>Notifications</h2>
								<div
									className="summary-link"
									onClick={() =>
										navigate(
											`/dashboard/${userId}/notifications`
										)
									}
								>
									View All
								</div>
							</div>

							<div className="notifications-container">
								{isLoadingNotifications ? (
									<div className="loading-notifications">
										Loading...
									</div>
								) : (
									<>
										{notifications.length > 0 ? (
											<div className="overview-notifications-list">
												{notifications.map(
													(notification) => (
														<div
															key={
																notification._id
															}
															className="notification-item"
														>
															<div className="notification-content">
																<p
																	dangerouslySetInnerHTML={{
																		__html: notification.message,
																	}}
																></p>
																<span className="notification-time">
																	{formatNotificationTime(
																		notification.created_at
																	)}
																</span>
															</div>
														</div>
													)
												)}
											</div>
										) : (
											<p>You have no notifications</p>
										)}
									</>
								)}
							</div>
						</div>

						{/* Friends Section */}
						<div className="summary-item">
							<div className="summary-header">
								<h2>Friends</h2>
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

															// Refetch suggestions
															const suggestionsResponse =
																axios.get(
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
																	const newSuggestions =
																		response.data
																			.filter(
																				(
																					u
																				) =>
																					u.mutualFriendsCount >=
																						1 &&
																					!res.data.friends.some(
																						(
																							f
																						) =>
																							f._id ===
																							u._id
																					) &&
																					!res.data.friendRequests.some(
																						(
																							f
																						) =>
																							f._id ===
																							u._id
																					) &&
																					!res.data.pendingRequests.some(
																						(
																							f
																						) =>
																							f._id ===
																							u._id
																					)
																			)
																			.sort(
																				(
																					a,
																					b
																				) =>
																					b.mutualFriendsCount -
																					a.mutualFriendsCount
																			)
																			.slice(
																				0,
																				3
																			);

																	setSuggestedFriends(
																		newSuggestions
																	);
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
