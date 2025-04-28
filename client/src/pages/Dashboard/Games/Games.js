import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Dashboard.css";
import "./Games.css";
import Sidebar from "../../../components/Sidebar/Sidebar";
import Filter from "../../../components/Filter/Filter";
import TabNav from "../../../components/TabNav/TabNav";
import GamesList from "../../../components/GamesList/GamesList";
import { useGameData } from "../../../hooks/useGameData";

export function Games() {
	const [user, setUser] = useState(null);
	const { userId } = useParams();
	const navigate = useNavigate();
	const page = "games"; // Constant page identifier
	const [searchTerm, setSearchTerm] = useState("");
	const [activeFilters, setActiveFilters] = useState([]);

	// Load user data
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const loggedUser = JSON.parse(localStorage.getItem("user"));
				if (loggedUser && loggedUser._id === userId) {
					const res = await axios.get(
						`${process.env.REACT_APP_API_URL}/users/${userId}`
					);
					setUser(res.data);
				} else {
					navigate("/signin");
				}
			} catch (error) {
				console.error("Error fetching user:", error);
				navigate("/signin");
			}
		};

		fetchUser();
	}, [userId, navigate]);

	// Use our custom hook for games data after user is loaded
	const {
		tab,
		games,
		loading,
		waitlistPositions,
		tabFilters,
		handleTabChange,
		handleApplyFilters,
		handleAcceptInvitation,
		handleDeclineInvitation,
	} = useGameData(user);

	// Define tab configuration
	const tabs = [
		{ id: "Public Games", label: "Public Games" },
		{ id: "Requested Games", label: "Requested Games" },
		{ id: "Invitations", label: "Invitations" },
		{ id: "Upcoming Games", label: "Upcoming Games" },
		{ id: "Past Games", label: "Past Games" },
	];

	// Filtered games based on search term
	const filteredGames = games.filter((game) => {
		if (!game) return false;

		// Search through game name, location, blinds
		const searchString = `${game.game_name || ""} ${game.location || ""} ${game.blinds || ""
			} ${game.host_id?.username || ""}`.toLowerCase();
		return searchString.includes(searchTerm.toLowerCase());
	});

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
	};

	// Apply filters and update active filter tags
	const applyFilters = (filters) => {
		// Update the active filter tags
		const newActiveFilters = [];

		// Blinds filter
		if (filters.blinds && filters.blinds.length > 0) {
			newActiveFilters.push({
				id: "blinds",
				label: filters.blinds.join(", "),
			});
		}

		// Players filter (handed)
		if (
			filters.handed &&
			(filters.handed.min !== 2 || filters.handed.max !== 10)
		) {
			newActiveFilters.push({
				id: "players",
				label: `${filters.handed.min}-${filters.handed.max} Players`,
			});
		}

		setActiveFilters(newActiveFilters);
		handleApplyFilters(filters);
	};

	// Remove a filter tag
	const removeFilterTag = (filterId) => {
		const updatedFilters = { ...tabFilters[tab] };

		if (filterId === "blinds") {
			updatedFilters.blinds = [];
		} else if (filterId === "players") {
			updatedFilters.handed = { min: 2, max: 10 };
		}

		setActiveFilters(
			activeFilters.filter((filter) => filter.id !== filterId)
		);
		handleApplyFilters(updatedFilters);
	};

	// Generate custom actions for invitation cards
	const renderInvitationActions = (game) => (
		<div className="card-actions">
			<button
				className="accept-button"
				onClick={(e) => {
					e.stopPropagation();
					handleAcceptInvitation(game._id);
				}}
			>
				Accept
			</button>
			<button
				className="decline-button"
				onClick={(e) => {
					e.stopPropagation();
					handleDeclineInvitation(game._id);
				}}
			>
				Decline
			</button>
		</div>
	);

	// Get the appropriate empty message based on the current tab
	const getEmptyMessage = () => {
		if (searchTerm) {
			return "No games match your search criteria.";
		}

		switch (tab) {
			case "Public Games":
				return "There are no public games available.";
			case "Requested Games":
				return "You haven't requested to join any games yet.";
			case "Invitations":
				return "You currently have no game invitations.";
			case "Upcoming Games":
				return "You currently have no upcoming games.";
			case "Past Games":
				return "You currently have no past games.";
			default:
				return "No games found.";
		}
	};

	// Render loading state if user is not loaded yet
	if (!user) {
		return (
			<div className="dashboard">
				<Sidebar page={page} username="Loading..." />
				<div className="logged-content-container">
					<div className="dashboard-heading">
						<h1>Games</h1>
					</div>
					<div className="loading-container">
						<p>Loading your profile...</p>
					</div>
				</div>
			</div>
		);
	}

	// Main render
	return (
		<div className="dashboard">
			<Sidebar page={page} username={user.username} />
			<div className="logged-content-container">
				<div className="dashboard-heading">
					<h1>Games</h1>
				</div>

				{/* Updated TabNav component */}
				<TabNav
					activeTab={tab}
					onTabChange={handleTabChange}
					tabs={tabs}
				/>

				<div className="games-content">
					{/* Filter panel (don't show for Invitations tab) */}
					{tab !== "Invitations" && (
						<div className="games-filter">
							{/* Search bar */}
							<div className="search-container">
								<input
									type="text"
									className="search-input"
									placeholder="Search"
									value={searchTerm}
									onChange={handleSearchChange}
								/>
								<i className="fa-solid fa-magnifying-glass search-icon"></i>
							</div>

							{/* Active filter tags */}
							{activeFilters.length > 0 && (
								<div className="active-filters">
									{activeFilters.map((filter) => (
										<div
											key={filter.id}
											className="filter-tag"
										>
											{filter.label}
											<button
												className="remove-filter"
												onClick={() =>
													removeFilterTag(filter.id)
												}
											>
												×
											</button>
										</div>
									))}
								</div>
							)}

							<Filter
								tab={tab}
								onApply={applyFilters}
								initialFilters={tabFilters[tab]}
							/>
						</div>
					)}

					{/* Games list content */}
					<div className="games-list-wrapper">
						{tab === "Invitations" ? (
							<GamesList
								games={filteredGames.filter(
									(game) => game && game.host_id
								)}
								user={user}
								waitlistPositions={waitlistPositions}
								renderCustomActions={renderInvitationActions}
								emptyMessage={getEmptyMessage()}
								loading={loading}
							/>
						) : (
							<GamesList
								games={filteredGames}
								user={user}
								waitlistPositions={waitlistPositions}
								emptyMessage={getEmptyMessage()}
								loading={loading}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Games;
