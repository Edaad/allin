import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Dashboard.css";
import "./Games.css";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Filter from "../../../components/Filter/Filter";
import GameCard from "../../../components/GameCard/GameCard";

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Update the formatFiltersForAPI function to handle undefined filters

// Add this utility function for formatting filters
const formatFiltersForAPI = (filters) => {
	// Check if filters is undefined or null
	if (!filters) return {};

	const formattedFilters = { ...filters };

	// Format date range if it exists
	if (
		filters.dateRange &&
		(filters.dateRange.startDate || filters.dateRange.endDate)
	) {
		formattedFilters.dateRange = JSON.stringify(filters.dateRange);
	}

	// Format handed range if it exists
	if (
		filters.handed &&
		(filters.handed.min !== undefined || filters.handed.max !== undefined)
	) {
		formattedFilters.handed = JSON.stringify(filters.handed);
	}

	return formattedFilters;
};

export function Games() {
	const [user, setUser] = useState(null);
	const { userId } = useParams();
	const navigate = useNavigate();
	const [page, setPage] = useState("games");
	const [tab, setTab] = useState("Public Games");
	const [games, setGames] = useState([]);
	const [requestedGames, setRequestedGames] = useState([]);
	const [invitations, setInvitations] = useState([]);
	const [filterParams, setFilterParams] = useState({});
	const [waitlistPositions, setWaitlistPositions] = useState({});

	// Add this new state to store filters per tab
	const [tabFilters, setTabFilters] = useState({
		"Public Games": {
			blinds: [],
			handed: { min: 2, max: 10 },
			dateRange: { startDate: getCurrentDate(), endDate: "" },
			timeRange: { startTime: "", endTime: "" },
		},
		"Requested Games": {
			blinds: [],
			handed: { min: 2, max: 10 },
			dateRange: { startDate: getCurrentDate(), endDate: "" },
			timeRange: { startTime: "", endTime: "" },
		},
		"Upcoming Games": {
			blinds: [],
			handed: { min: 2, max: 10 },
			dateRange: { startDate: "", endDate: "" },
			timeRange: { startTime: "", endTime: "" },
		},
		"Past Games": {
			blinds: [],
			handed: { min: 2, max: 10 },
			dateRange: { startDate: "", endDate: "" },
			timeRange: { startTime: "", endTime: "" },
		},
	});

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const loggedUser = JSON.parse(localStorage.getItem("user"));
				if (loggedUser && loggedUser._id === userId) {
					const res = await axios.get(
						`${process.env.REACT_APP_API_URL}/users/${userId}`
					);
					setUser(res.data);

					// Only apply default filters if tabFilters[tab] exists
					if (tabFilters && tabFilters[tab]) {
						const currentTabFilters = tabFilters[tab];
						setFilterParams(formatFiltersForAPI(currentTabFilters));
					}
				} else {
					navigate("/signin");
				}
			} catch (error) {
				console.error("Error fetching user:", error);
				navigate("/signin");
			}
		};
		fetchUser();
	}, [userId, navigate, tab, tabFilters]);

	// Add this to your useEffect at the beginning of the component:

	useEffect(() => {
		// Check for tab parameter in URL
		const params = new URLSearchParams(window.location.search);
		const tabParam = params.get("tab");
		if (
			tabParam &&
			[
				"Public Games",
				"Requested Games",
				"Invitations",
				"Upcoming Games",
				"Past Games",
			].includes(tabParam)
		) {
			setTab(tabParam);
		}
	}, []);

	// Define fetchWaitlistPosition with useCallback
	const fetchWaitlistPosition = useCallback(
		async (gameId) => {
			// Add a check to ensure user exists before accessing user._id
			if (!user) return;

			try {
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/players/waitlist/${gameId}/${user._id}`
				);
				setWaitlistPositions((prev) => ({
					...prev,
					[gameId]: res.data.position,
				}));
			} catch (error) {
				console.error("Error fetching waitlist position:", error);
			}
		},
		[user]
	); // Changed dependency from user._id to user itself

	// Update fetchGames to include fetchWaitlistPosition in its dependency array
	const fetchGames = useCallback(async () => {
		if (!user) return;
		try {
			if (tab === "Upcoming Games" || tab === "Past Games") {
				const status =
					tab === "Upcoming Games" ? "upcoming" : "completed";
				// Apply filters to upcoming and past games
				const params = {
					status,
					...filterParams,
				};
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/games/player/${user._id}`,
					{
						params,
					}
				);
				setGames(res.data);
			} else if (tab === "Public Games") {
				const params = {
					status: "upcoming",
					is_public: true,
					userId: user._id,
					...filterParams,
				};
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/games`,
					{ params }
				);

				// For each game, fetch player count and waitlist position if needed
				const gamesWithPlayerCount = await Promise.all(
					res.data.map(async (game) => {
						try {
							const playersRes = await axios.get(
								`${process.env.REACT_APP_API_URL}/players/game/${game._id}`
							);
							const acceptedPlayers = playersRes.data.filter(
								(p) => p.invitation_status === "accepted"
							);

							// If player is on waitlist, fetch their position
							if (game.playerStatus === "waitlist") {
								await fetchWaitlistPosition(game._id);
							}

							return {
								...game,
								acceptedPlayersCount: acceptedPlayers.length,
							};
						} catch (err) {
							console.error(
								`Error fetching players for game ${game._id}:`,
								err
							);
							return game;
						}
					})
				);
				setGames(gamesWithPlayerCount);
			} else if (tab === "Invitations") {
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/players/invitations/${user._id}`
				);
				setInvitations(res.data);
			} else if (tab === "Requested Games") {
				// Apply filters to requested games
				const params = {
					...filterParams,
				};
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/requested/${user._id}`,
					{ params }
				);
				setRequestedGames(res.data);
			}
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	}, [tab, user, filterParams, fetchWaitlistPosition]);

	// Apply filters when they change in any tab that needs filtering
	useEffect(() => {
		if (
			[
				"Public Games",
				"Requested Games",
				"Upcoming Games",
				"Past Games",
			].includes(tab)
		) {
			fetchGames();
		}
	}, [filterParams, tab, fetchGames]);

	useEffect(() => {
		if (user) {
			// Apply the initial filters for the current tab
			setFilterParams(tabFilters[tab]);
			fetchGames();
		}
	}, [user, fetchGames, tab, tabFilters]);

	// Handle tab change and restore tab-specific filters
	const handleTabChange = (newTab) => {
		setTab(newTab);
		// Apply the stored filters for this tab (including default dates if applicable)
		setFilterParams(tabFilters[newTab]);
	};

	// Then update the handleApplyFilters function
	const handleApplyFilters = (filters) => {
		// Store filters for the current tab
		setTabFilters((prev) => ({
			...prev,
			[tab]: filters,
		}));

		// Apply the formatted filters
		setFilterParams(formatFiltersForAPI(filters));
	};

	// Keep these functions for the Invitations tab
	const handleAcceptInvitation = async (gameId) => {
		try {
			const response = await axios.post(
				`${process.env.REACT_APP_API_URL}/players/accept-invitation`,
				{
					userId: user._id,
					gameId: gameId,
				}
			);

			// Check if the response indicates waitlist status
			if (response.data.status === "waitlist" && response.data.position) {
				setWaitlistPositions((prev) => ({
					...prev,
					[gameId]: response.data.position,
				}));
			}

			fetchGames(); // Refresh all game data
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};

	const handleDeclineInvitation = async (gameId) => {
		const confirmDecline = window.confirm(
			"Are you sure you want to decline this invitation?"
		);
		if (!confirmDecline) return;

		try {
			await axios.post(
				`${process.env.REACT_APP_API_URL}/players/decline-invitation`,
				{
					userId: user._id,
					gameId: gameId,
				}
			);
			fetchGames(); // Refresh all game data
		} catch (error) {
			console.error("Error declining invitation:", error);
		}
	};

	const menus = [
		{ title: "Overview", page: "overview" },
		{ title: "Games", page: "games" },
		{ title: "Host", page: "host" },
		{ title: "Community", page: "community" },
		{ title: "Bankroll", page: "bankroll" },
		{ title: "Notifications", page: "notifications" }, // Added from main branch
	];

	if (!user) {
		return (
			<div className="dashboard">
				<Sidebar
					menus={menus}
					setPage={setPage}
					page={page}
					username="Loading..."
				/>
				<div className="logged-content-container">
					<div className="dashboard-heading">
						<h1>Games</h1>
					</div>
					<div className="tab-container">
						{[
							"Public Games",
							"Requested Games",
							"Invitations",
							"Upcoming Games",
							"Past Games",
						].map((tabName) => (
							<button
								key={tabName}
								className={`tab${
									tab === tabName ? "-selected" : ""
								}`}
								disabled
							>
								{tabName}
							</button>
						))}
					</div>
					<div className="loading-container">
						<p>Loading your games...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard">
			<Sidebar
				menus={menus}
				setPage={setPage}
				page={page}
				username={user.username}
			/>
			<div className="logged-content-container">
				<div className="dashboard-heading">
					<h1>Games</h1>
				</div>
				<div className="tab-container">
					<button
						className={`tab${
							tab === "Public Games" ? "-selected" : ""
						}`}
						onClick={() => handleTabChange("Public Games")}
					>
						Public Games
					</button>
					<button
						className={`tab${
							tab === "Requested Games" ? "-selected" : ""
						}`}
						onClick={() => handleTabChange("Requested Games")}
					>
						Requested Games
					</button>
					<button
						className={`tab${
							tab === "Invitations" ? "-selected" : ""
						}`}
						onClick={() => handleTabChange("Invitations")}
					>
						Invitations
					</button>
					<button
						className={`tab${
							tab === "Upcoming Games" ? "-selected" : ""
						}`}
						onClick={() => handleTabChange("Upcoming Games")}
					>
						Upcoming Games
					</button>
					<button
						className={`tab${
							tab === "Past Games" ? "-selected" : ""
						}`}
						onClick={() => handleTabChange("Past Games")}
					>
						Past Games
					</button>
				</div>

				{tab === "Public Games" ? (
					<div
						className="public-games-container"
						style={{ display: "flex" }}
					>
						<Filter
							tab={tab}
							onApply={handleApplyFilters}
							initialFilters={tabFilters[tab]}
						/>
						<div className="games-container" style={{ flex: 1 }}>
							{games.length > 0 ? (
								<div className="game-cards-grid">
									{games.map((game) => (
										<GameCard
											key={game._id}
											game={{
												...game,
												waitlistPosition:
													game.playerStatus ===
													"waitlist"
														? waitlistPositions[
																game._id
														  ]
														: undefined,
											}}
											user={user}
										/>
									))}
								</div>
							) : (
								<div className="no-games-message">
									There are no public games available.
								</div>
							)}
						</div>
					</div>
				) : tab === "Invitations" ? (
					<div className="public-games-container">
						<div className="games-container" style={{ flex: 1 }}>
							{invitations.length > 0 ? (
								<div className="game-cards-grid">
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
												customActions={
													<div className="card-actions">
														<button
															className="accept-button"
															onClick={(e) => {
																e.stopPropagation();
																handleAcceptInvitation(
																	invitation._id
																);
															}}
														>
															Accept
														</button>
														<button
															className="decline-button"
															onClick={(e) => {
																e.stopPropagation();
																handleDeclineInvitation(
																	invitation._id
																);
															}}
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
									You currently have no game invitations.
								</div>
							)}
						</div>
					</div>
				) : tab === "Requested Games" ? (
					// Requested Games tab (already using GameCard)
					<div
						className="public-games-container"
						style={{ display: "flex" }}
					>
						<Filter
							tab={tab}
							onApply={handleApplyFilters}
							initialFilters={tabFilters[tab]}
						/>
						<div className="games-container" style={{ flex: 1 }}>
							{requestedGames.length > 0 ? (
								<div className="game-cards-grid">
									{requestedGames.map((game) => (
										<GameCard
											key={game._id}
											game={{
												...game,
												waitlistPosition:
													game.playerStatus ===
													"waitlist"
														? waitlistPositions[
																game._id
														  ]
														: undefined,
											}}
											user={user}
										/>
									))}
								</div>
							) : (
								<div className="no-games-message">
									You haven't requested to join any games yet.
								</div>
							)}
						</div>
					</div>
				) : (
					// Upcoming and Past Games tabs with GameCard component
					<div
						className="public-games-container"
						style={{ display: "flex" }}
					>
						<Filter
							tab={tab}
							onApply={handleApplyFilters}
							initialFilters={tabFilters[tab]}
						/>
						<div className="games-container" style={{ flex: 1 }}>
							{games.length > 0 ? (
								<div className="game-cards-grid">
									{games.map((game) => (
										<GameCard
											key={game._id}
											game={{
												...game,
												waitlistPosition:
													game.playerStatus ===
													"waitlist"
														? waitlistPositions[
																game._id
														  ]
														: undefined,
											}}
											user={user}
										/>
									))}
								</div>
							) : (
								<div className="no-games-message">
									You currently have no {tab.toLowerCase()}.
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default Games;
