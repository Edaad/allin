import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Dashboard.css";
import "./Host.css";
import Sidebar from "../../../components/Sidebar/Sidebar";
import GameCard from "../../../components/GameCard/GameCard";
import Input from "../../../components/Input/Input";
import Select from "../../../components/Select/Select";

export function Host() {
	const [user, setUser] = useState(null);
	const { userId } = useParams();
	const navigate = useNavigate();
	const page = "host"; // Replace with a constant value
	const [hosting, setHosting] = useState(false);
	const [tab, setTab] = useState("Upcoming games");
	const [games, setGames] = useState([]);
	const [userGroups, setUserGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [statsData, setStatsData] = useState({
		totalGames: 0,
		upcomingGames: 0,
		completedGames: 0
	});

	const initialGameFormState = {
		name: "",
		blinds: "",
		location: "",
		date: "",
		time: "",
		handed: "",
		isPublic: false,
		group_id: "",
	};
	const [gameForm, setGameForm] = useState(initialGameFormState);

	useEffect(() => {
		const loggedUser = JSON.parse(localStorage.getItem("user"));
		if (loggedUser && loggedUser._id === userId) {
			setUser(loggedUser);
		} else {
			navigate("/signin");
		}
	}, [userId, navigate]);

	// Fetch user's groups
	const fetchUserGroups = useCallback(async () => {
		if (!user) return;
		try {
			const response = await axios.get(
				`${process.env.REACT_APP_API_URL}/groups/user/${user._id}`,
				{ params: { membership_status: "accepted" } }
			);
			setUserGroups(response.data);
		} catch (error) {
			console.error("Error fetching user groups:", error);
		}
	}, [user]);

	// Calculate stats for the dashboard
	const calculateStats = useCallback(async () => {
		if (!user) return;
		try {
			// Get all games for stats calculation
			const upcomingResponse = await axios.get(
				`${process.env.REACT_APP_API_URL}/games`,
				{ params: { host_id: user._id, status: "upcoming" } }
			);
			
			const completedResponse = await axios.get(
				`${process.env.REACT_APP_API_URL}/games`,
				{ params: { host_id: user._id, status: "completed" } }
			);
			
			setStatsData({
				totalGames: upcomingResponse.data.length + completedResponse.data.length,
				upcomingGames: upcomingResponse.data.length,
				completedGames: completedResponse.data.length
			});
		} catch (error) {
			console.error("Error calculating stats:", error);
		}
	}, [user]);

	// Wrap fetchGames with useCallback so its dependencies are explicit
	const fetchGames = useCallback(async () => {
		if (!user) return;
		try {
			const status = tab === "Upcoming games" ? "upcoming" : "completed";
			const res = await axios.get(
				`${process.env.REACT_APP_API_URL}/games`,
				{
					params: { status, host_id: user._id },
				}
			);
			setGames(res.data);

			// Update stats after fetching games
			calculateStats();
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	}, [tab, user, calculateStats]);

	// Call fetchGames whenever the user or tab changes
	useEffect(() => {
		if (user) {
			fetchGames();
			fetchUserGroups(); // Fetch groups when user is loaded
		}
	}, [user, fetchGames, fetchUserGroups]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		if (name === "group_id") {
			// If group is selected, find the group and set privacy based on group privacy
			if (value) {
				const selectedGroup = userGroups.find(
					(group) => group._id === value
				);
				if (selectedGroup) {
					setSelectedGroup(selectedGroup);
					setGameForm((prev) => ({
						...prev,
						group_id: value,
						isPublic: selectedGroup.is_public, // Set privacy to match group
					}));
				}
			} else {
				// If no group selected, allow manual privacy setting
				setSelectedGroup(null);
				setGameForm((prev) => ({
					...prev,
					group_id: value,
				}));
			}
		} else {
			// For other fields, just update normally
			setGameForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const gameDateTimeString = `${gameForm.date}T${gameForm.time}:00`;
			const gameDateTime = new Date(gameDateTimeString);

			const newGame = {
				host_id: user._id,
				game_name: gameForm.name,
				location: gameForm.location,
				game_date: gameDateTime,
				game_status: "upcoming",
				blinds: gameForm.blinds,
				handed: gameForm.handed,
				is_public: gameForm.isPublic,
				group_id: gameForm.group_id || null, // Include group_id if selected
			};

			console.log("Submitting game with data:", newGame);

			await axios.post(`${process.env.REACT_APP_API_URL}/games`, newGame);
			setHosting(false);
			setGameForm(initialGameFormState);
			setSelectedGroup(null);
			fetchGames();
		} catch (error) {
			console.error("Error creating game:", error);
		}
	};

	const handleCancel = () => {
		setHosting(false);
		setGameForm(initialGameFormState);
		setSelectedGroup(null);
	};

	const handleGameClick = (gameId) => {
		navigate(`/dashboard/${user._id}/games/game/${gameId}`);
	};

	if (!user) {
		return <div>Loading...</div>;
	}

	// Create group options for dropdown
	const groupOptions = [
		{ value: "", label: "No group (personal game)" },
		...userGroups.map((group) => ({
			value: group._id,
			label:
				group.group_name +
				(group.is_public ? " (Public)" : " (Private)"),
		})),
	];

	return (
		<div className="dashboard">
			<Sidebar
				page={page}
				username={user.username}
			/>
			<div className="logged-content-container">
				<div className="dashboard-heading">
					<h1>Host Dashboard</h1>
					{!hosting && (
						<button
							className="host-button"
							onClick={() => setHosting(true)}
						>
							+ Host a new game
						</button>
					)}
				</div>

				{/* Stats Cards */}
				<div className="stats-container">
					<div className="stat-card">
						<div className="stat-icon">
							<i className="fas fa-dice"></i>
						</div>
						<div className="stat-info">
							<h3>{statsData.totalGames}</h3>
							<p>Total Games</p>
						</div>
					</div>
					
					<div className="stat-card">
						<div className="stat-icon upcoming">
							<i className="fas fa-calendar-alt"></i>
						</div>
						<div className="stat-info">
							<h3>{statsData.upcomingGames}</h3>
							<p>Upcoming Games</p>
						</div>
					</div>
					
					<div className="stat-card">
						<div className="stat-icon completed">
							<i className="fas fa-check-circle"></i>
						</div>
						<div className="stat-info">
							<h3>{statsData.completedGames}</h3>
							<p>Completed Games</p>
						</div>
					</div>
				</div>

				{/* Game Form */}
				{hosting && (
					<div className="host-form-container">
						<div className="form-header">
							<h2>Create a New Game</h2>
						</div>
						<form className="host-form" onSubmit={handleSubmit}>
							<Input
								name="name"
								type="text"
								label="Name"
								placeholder={`Give your game a name e.g.${user.username}'s poker night`}
								value={gameForm.name}
								onChange={handleInputChange}
							/>
							<div className="input-double">
								<Select
									name="blinds"
									label="Blinds"
									placeholder="Select your game blinds"
									value={gameForm.blinds}
									onChange={handleInputChange}
									options={[
										{ value: "1/2", label: "$1/$2" },
										{ value: "2/5", label: "$2/$5" },
										{ value: "5/10", label: "$5/$10" },
									]}
								/>
								<Select
									name="handed"
									label="Handed"
									placeholder="Select the player max"
									value={gameForm.handed}
									onChange={handleInputChange}
									options={[
										{ value: "2", label: "2 max" },
										{ value: "3", label: "3 max" },
										{ value: "4", label: "4 max" },
										{ value: "5", label: "5 max" },
										{ value: "6", label: "6 max" },
										{ value: "7", label: "7 max" },
										{ value: "8", label: "8 max" },
										{ value: "9", label: "9 max" },
										{ value: "10", label: "10 max" },
									]}
								/>
							</div>

							{/* Group selection dropdown - place before privacy options */}
							<Select
								name="group_id"
								label="Group (Optional)"
								placeholder="Select a group for this game"
								value={gameForm.group_id}
								onChange={handleInputChange}
								options={groupOptions}
							/>

							<div className="game-privacy-option">
								<label className="input-label">
									Game Privacy
									{selectedGroup && (
										<span className="privacy-locked-note">
											(Locked to match group privacy)
										</span>
									)}
								</label>
								<div className="radio-group">
									<label
										className={`radio-label ${selectedGroup ? "disabled" : ""}`}
									>
										<input
											type="radio"
											name="isPublic"
											checked={!gameForm.isPublic}
											onChange={() => {
												if (!selectedGroup) {
													setGameForm({
														...gameForm,
														isPublic: false,
													});
												}
											}}
											disabled={selectedGroup !== null}
										/>
										Private (invite only)
									</label>
									<label
										className={`radio-label ${selectedGroup ? "disabled" : ""}`}
									>
										<input
											type="radio"
											name="isPublic"
											checked={gameForm.isPublic}
											onChange={() => {
												if (!selectedGroup) {
													setGameForm({
														...gameForm,
														isPublic: true,
													});
												}
											}}
											disabled={selectedGroup !== null}
										/>
										Public (open to join requests)
									</label>
								</div>
							</div>

							<Input
								name="location"
								type="text"
								label="Location"
								placeholder="Enter the address of your game"
								value={gameForm.location}
								onChange={handleInputChange}
							/>
							<div className="input-double">
								<Input
									name="date"
									type="date"
									label="Date"
									value={gameForm.date}
									onChange={handleInputChange}
								/>
								<Input
									name="time"
									type="time"
									label="Time"
									value={gameForm.time}
									onChange={handleInputChange}
								/>
							</div>
							<div className="buttons">
								<button className="submit-button" type="submit">
									Save Game
								</button>
								<button
									className="cancel-button"
									type="button"
									onClick={handleCancel}
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				)}

				{/* Games Tab Container */}
				<div className="games-section">
					<div className="tab-container">
						<button
							className={`tab${tab === "Upcoming games" ? "-selected" : ""}`}
							onClick={() => {
								setTab("Upcoming games");
							}}
						>
							Upcoming Games
						</button>
						<button
							className={`tab${tab === "Past games" ? "-selected" : ""}`}
							onClick={() => {
								setTab("Past games");
							}}
						>
							Past Games
						</button>
					</div>

					<div className="games-list">
						{games.length > 0 ? (
							games.map((game) => (
								<div key={game._id} className="game-card-container" onClick={() => handleGameClick(game._id)}>
									<GameCard
										game={game}
										user={user}
										showBorder={false}
									/>
								</div>
							))
						) : (
							<div className="no-games-message">
								<div className="empty-state">
									<i className="fas fa-calendar-xmark"></i>
									<p>You currently have no {tab.toLowerCase()}</p>
									{tab === "Upcoming games" && !hosting && (
										<button
											className="host-button small"
											onClick={() => setHosting(true)}
										>
											+ Host a new game
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Host;