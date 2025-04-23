import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./GameCard.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faGamepad, 
	faUsers, 
	faDollarSign, 
	faLocationDot, 
	faClock, 
	faCalendarDay 
} from '@fortawesome/free-solid-svg-icons';

function GameCard({ game, user, customActions, showBorder = true }) {
	const navigate = useNavigate();
	const [showReason, setShowReason] = useState(false);
	const [isRequesting, setIsRequesting] = useState(false);
	const [playerStatus, setPlayerStatus] = useState(
		game.playerStatus || "none"
	);

	// Format date to be more readable - without day of the week
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	// Format time to 12 hour format
	const formatTime = (timeString) => {
		const [hours, minutes] = timeString.split(':');
		const date = new Date();
		date.setHours(parseInt(hours));
		date.setMinutes(parseInt(minutes));
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	};

	const handleRequestToJoin = async (e) => {
		// Prevent the card click from triggering navigation
		e.stopPropagation();

		if (isRequesting) return;

		try {
			setIsRequesting(true);
			const response = await axios.post(
				`${process.env.REACT_APP_API_URL}/players/request-to-join`,
				{
					userId: user._id,
					gameId: game._id,
				}
			);

			// Update status based on response
			const newStatus = response.data.status || "requested";
			setPlayerStatus(newStatus);

			setIsRequesting(false);
		} catch (error) {
			console.error("Error requesting to join game:", error);
			setIsRequesting(false);
		}
	};

	const handleViewMore = (e) => {
		// Prevent default to avoid conflicts
		e.stopPropagation();
		navigate(`/dashboard/${user._id}/games/game/${game._id}`);
	};

	// Handle click on the entire card
	const handleCardClick = () => {
		navigate(`/dashboard/${user._id}/games/game/${game._id}`);
	};

	// Get waitlist position text if applicable
	const getWaitlistText = () => {
		if (playerStatus === "waitlist" && game.waitlistPosition) {
			return `Waitlist #${game.waitlistPosition}`;
		} else if (playerStatus === "waitlist") {
			return "On Waitlist";
		} else if (playerStatus === "waitlist_requested") {
			return "Waitlist Requested";
		}
		return null;
	};

	// Render the status badge or action button
	const renderActionOrStatus = () => {
		// If the user is the host, show "Host" status
		if (user._id === game.host_id?._id) {
			return <div className="status-badge host">Host</div>;
		}

		// If the user has a status other than "none", show the status badge
		if (playerStatus !== "none" && playerStatus) {
			// Handle rejection reason display
			if (playerStatus === "rejected") {
				return (
					<div className="status-badge-container">
						<div
							className="status-badge rejected"
							onMouseEnter={() => setShowReason(true)}
							onMouseLeave={() => setShowReason(false)}
						>
							<i className="fa-solid fa-circle-exclamation info-icon"></i>
							Declined
						</div>
						{showReason && game.rejection_reason && (
							<div className="rejection-reason-tooltip">
								{game.rejection_reason}
							</div>
						)}
					</div>
				);
			}

			// Handle waitlist display
			const waitlistText = getWaitlistText();
			if (waitlistText) {
				return (
					<div className="status-badge waitlist">{waitlistText}</div>
				);
			}

			// Other statuses display
			const statusLabels = {
				accepted: "Joined",
				pending: "Invited",
				requested: "Request Sent",
				completed: "Completed",
			};

			return (
				<div className={`status-badge ${playerStatus}`}>
					{statusLabels[playerStatus] || playerStatus}
				</div>
			);
		}

		// For completed games, show the View More button
		if (game.game_status === "completed") {
			return (
				<button onClick={handleViewMore} className="view-more-button">
					View More
				</button>
			);
		}

		// For public games where player hasn't joined yet, show the chip button
		return (
			<button
				className="chip-button"
				onClick={handleRequestToJoin}
				disabled={isRequesting}
			>
				<div className="chip-icon">
					<span className="request-text">Join</span>
				</div>
			</button>
		);
	};

	// New renderer for the card with chip on the right side
	return (
		<div className="game-card">
			<div className="game-card-header">
				<h3>{game.game_name || 'Poker Game'}</h3>
				<span className="host">Hosted by {game.host_id?.username}</span>
			</div>
			<div className="game-card-details">
				<div className="detail-item">
					<FontAwesomeIcon icon={faGamepad} className="detail-icon" />
					<span>{game.game_type}</span>
				</div>
				<div className="detail-item">
					<FontAwesomeIcon icon={faUsers} className="detail-icon" />
					<span>{game.handed}</span>
				</div>
				<div className="detail-item">
					<FontAwesomeIcon icon={faDollarSign} className="detail-icon" />
					<span>{game.blinds}</span>
				</div>
				<div className="detail-item">
					<FontAwesomeIcon icon={faLocationDot} className="detail-icon" />
					<span>{game.location}</span>
				</div>
				<div className="detail-item">
					<FontAwesomeIcon icon={faCalendarDay} className="detail-icon" />
					<span>{formatDate(game.game_date)}</span>
				</div>
				<div className="detail-item">
					<FontAwesomeIcon icon={faClock} className="detail-icon" />
					<span>{formatTime(game.game_date)}</span>
				</div>
			</div>
			<div className="game-card-footer">
				<Link to={`/guest/join/${game._id}`} className="join-button">
					Join as Guest
				</Link>
			</div>
		</div>
	);
}

export default GameCard;
