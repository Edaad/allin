// Profile.js

import React, { useMemo } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = ({
	data,
	size,
	currentUser,
	refreshData,
	updateUserState,
	action,
	onAction,
	hideFriendActions,
}) => {
	const navigate = useNavigate();
	if (!data || !data.username) {
		return null;
	}

	// Custom function to create a more realistic poker chip avatar with user's initials
	const createPokerChipAvatar = (username, firstName, lastName) => {
		// Hash function remains the same
		const hashCode = (str) => {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				hash = ((hash << 5) - hash) + str.charCodeAt(i);
				hash = hash & hash; // Convert to 32bit integer
			}
			return Math.abs(hash);
		};

		const hash = hashCode(username);

		// Updated color palettes with more variety and modern colors
		const chipColors = [
			{ main: '#E74C3C', accent: '#FFFFFF' }, // Red with white
			{ main: '#3498DB', accent: '#FFFFFF' }, // Blue with white
			{ main: '#2ECC71', accent: '#FFFFFF' }, // Green with white
			{ main: '#F39C12', accent: '#FFFFFF' }, // Orange with white
			{ main: '#9B59B6', accent: '#FFFFFF' }, // Purple with white
			{ main: '#1ABC9C', accent: '#FFFFFF' }, // Teal with white
			{ main: '#34495E', accent: '#FFFFFF' }, // Navy with white
			{ main: '#7F8C8D', accent: '#FFFFFF' }, // Gray with white
			{ main: '#FFFFFF', accent: '#E74C3C' }, // White with red
			{ main: '#FFFFFF', accent: '#3498DB' }, // White with blue
			{ main: '#FFFFFF', accent: '#2ECC71' }, // White with green
			{ main: '#FFFFFF', accent: '#F39C12' }, // White with orange
			{ main: '#D81B60', accent: '#FFFFFF' }, // Pink with white
			{ main: '#8E24AA', accent: '#FFFFFF' }, // Deep purple with white
			{ main: '#5E35B1', accent: '#FFFFFF' }, // Indigo with white
			{ main: '#1E88E5', accent: '#FFFFFF' }, // Light blue with white
			{ main: '#00897B', accent: '#FFFFFF' }, // Turquoise with white
			{ main: '#43A047', accent: '#FFFFFF' }, // Light green with white
			{ main: '#C0CA33', accent: '#FFFFFF' }, // Lime with white
			{ main: '#FFB300', accent: '#FFFFFF' }, // Amber with white
			{ main: '#FB8C00', accent: '#FFFFFF' }, // Dark orange with white
			{ main: '#F4511E', accent: '#FFFFFF' }, // Deep orange with white
			{ main: '#6D4C41', accent: '#FFFFFF' }, // Brown with white
			{ main: '#757575', accent: '#FFFFFF' }, // Medium gray with white
			{ main: '#546E7A', accent: '#FFFFFF' }, // Blue gray with white
			{ main: '#FFFFFF', accent: '#D81B60' }, // White with pink
			{ main: '#FFFFFF', accent: '#8E24AA' }, // White with deep purple
			{ main: '#FFFFFF', accent: '#5E35B1' }, // White with indigo
			{ main: '#FFFFFF', accent: '#1E88E5' }, // White with light blue
			{ main: '#FFFFFF', accent: '#00897B' }, // White with turquoise
			{ main: '#FFFFFF', accent: '#43A047' }, // White with light green
			{ main: '#FFFFFF', accent: '#C0CA33' }, // White with lime
			{ main: '#FFFFFF', accent: '#FFB300' }, // White with amber
			{ main: '#FFFFFF', accent: '#FB8C00' }, // White with dark orange
			{ main: '#FFFFFF', accent: '#F4511E' }, // White with deep orange
			{ main: '#FFFFFF', accent: '#6D4C41' }, // White with brown
		];

		const colorIndex = hash % chipColors.length;
		const chipColor = chipColors[colorIndex].main;
		const accentColor = chipColors[colorIndex].accent;

		const initials = (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');

		// Create SVG
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("viewBox", "0 0 100 100");
		svg.setAttribute("width", "100%");
		svg.setAttribute("height", "100%");
		svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

		// 1. Shadow for depth
		const shadow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		shadow.setAttribute("cx", "50");
		shadow.setAttribute("cy", "52");
		shadow.setAttribute("r", "46");
		shadow.setAttribute("fill", "rgba(0,0,0,0.2)");
		svg.appendChild(shadow);

		// 2. Base of the chip
		const baseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		baseCircle.setAttribute("cx", "50");
		baseCircle.setAttribute("cy", "50");
		baseCircle.setAttribute("r", "46");
		baseCircle.setAttribute("fill", chipColor);
		baseCircle.setAttribute("stroke", "#000000");
		baseCircle.setAttribute("stroke-width", "0.5");
		svg.appendChild(baseCircle);

		// 3. Edge ring - thicker for more realism
		const edgeRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		edgeRing.setAttribute("cx", "50");
		edgeRing.setAttribute("cy", "50");
		edgeRing.setAttribute("r", "0");
		edgeRing.setAttribute("fill", "none");
		edgeRing.setAttribute("stroke", "#000000");
		edgeRing.setAttribute("stroke-width", "4");
		edgeRing.setAttribute("stroke-opacity", "0.3");
		svg.appendChild(edgeRing);

		// 4. Inner circle - ensure it always matches the main chip color with proper contrast
		const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		innerCircle.setAttribute("cx", "50");
		innerCircle.setAttribute("cy", "50");
		innerCircle.setAttribute("r", "39");

		// Determine if the main color is white or very light
		const isLightColor = chipColor === '#FFFFFF' || chipColor.toLowerCase() === '#fff';

		// If the main color is white, use the accent color for the inner circle instead
		innerCircle.setAttribute("fill", isLightColor ? accentColor : chipColor);
		innerCircle.setAttribute("stroke", "#000000");
		innerCircle.setAttribute("stroke-width", "0.5");
		svg.appendChild(innerCircle);

		// 5. More checkered pattern - adjust the inner radius to match
		const segmentCount = 16;
		const segmentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

		for (let i = 0; i < segmentCount; i++) {
			const startAngle = (i * 360 / segmentCount) % 360;
			const endAngle = ((i + 1) * 360 / segmentCount) % 360;

			if (i % 2 === 0) {
				const startRadians = (startAngle * Math.PI) / 180;
				const endRadians = (endAngle * Math.PI) / 180;

				// Keep consistent with innerCircle radius (39)
				const outerStartX = 50 + 46 * Math.cos(startRadians);
				const outerStartY = 50 + 46 * Math.sin(startRadians);
				const outerEndX = 50 + 46 * Math.cos(endRadians);
				const outerEndY = 50 + 46 * Math.sin(endRadians);
				const innerStartX = 50 + 39 * Math.cos(endRadians); // Changed to 39
				const innerStartY = 50 + 39 * Math.sin(endRadians); // Changed to 39
				const innerEndX = 50 + 39 * Math.cos(startRadians); // Changed to 39
				const innerEndY = 50 + 39 * Math.sin(startRadians); // Changed to 39

				const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
				path.setAttribute("d", `
					M ${outerStartX} ${outerStartY}
					A 46 46 0 0 1 ${outerEndX} ${outerEndY}
					L ${innerStartX} ${innerStartY}
					A 39 39 0 0 0 ${innerEndX} ${innerEndY} 
					Z
				`); // Changed to A 39 39
				path.setAttribute("fill", accentColor);
				path.setAttribute("stroke", "#000000");
				path.setAttribute("stroke-width", "0.2");
				path.setAttribute("stroke-opacity", "0.3");
				segmentGroup.appendChild(path);
			}
		}
		svg.appendChild(segmentGroup);

		// 6. Center circle - make it larger
		const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		centerCircle.setAttribute("cx", "50");
		centerCircle.setAttribute("cy", "50");
		centerCircle.setAttribute("r", "30");
		centerCircle.setAttribute("fill", "#FFFFFF");
		centerCircle.setAttribute("stroke", "#000000");
		centerCircle.setAttribute("stroke-width", "0.5");
		svg.appendChild(centerCircle);

		// 7. Highlight/glare effect for realism
		const highlight = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		highlight.setAttribute("cx", "35");
		highlight.setAttribute("cy", "35");
		highlight.setAttribute("rx", "15");
		highlight.setAttribute("ry", "10");
		highlight.setAttribute("fill", "rgba(255, 255, 255, 0.2)");
		highlight.setAttribute("transform", "rotate(-30, 35, 35)");
		svg.appendChild(highlight);

		// 8. Add user's initials in the center with proper font loading for Outfit font
		if (initials) {
			const initialsText = document.createElementNS("http://www.w3.org/2000/svg", "text");
			initialsText.setAttribute("x", "50");
			initialsText.setAttribute("y", "52");
			initialsText.setAttribute("text-anchor", "middle");
			initialsText.setAttribute("dominant-baseline", "middle");
			initialsText.setAttribute("font-size", "22");
			initialsText.setAttribute("font-weight", "600");
			initialsText.setAttribute("fill", "#000000");

			// Create a style element to import the Outfit font
			const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
			styleElement.textContent = `
				@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600&display=swap');
				text { font-family: 'Outfit', sans-serif; }
			`;
			svg.appendChild(styleElement);

			// Set the font family and ensure it's properly applied
			initialsText.setAttribute("font-family", "Outfit, sans-serif");

			// Add the text content
			initialsText.textContent = initials;
			svg.appendChild(initialsText);
		}

		// Convert to string
		const serializer = new XMLSerializer();
		return serializer.serializeToString(svg);
	};

	// Custom component for the poker chip avatar
	const PokerChipAvatar = ({ username, firstName, lastName, ...props }) => {
		const svgURI = useMemo(
			() =>
				"data:image/svg+xml;utf8," +
				encodeURIComponent(
					createPokerChipAvatar(username, firstName, lastName)
				),
			[username, firstName, lastName]
		);
		return <img src={svgURI} alt={username} {...props} />;
	};

	const updateLocalStorage = async () => {
		try {
			const response = await axios.get(
				`${process.env.REACT_APP_API_URL}/users/${currentUser._id}`
			);
			const updatedUser = response.data;
			updateUserState(updatedUser);
		} catch (error) {
			console.error("Error updating local storage:", error);
		}
	};

	const handleFriendRequest = async (actionType) => {
		try {
			let endpoint = "";
			if (actionType === "remove") {
				endpoint = "remove-friend";
			} else {
				endpoint = `${actionType}-friend-request`;
			}
			await axios.post(`${process.env.REACT_APP_API_URL}/${endpoint}`, {
				userId: currentUser._id,
				friendId: data._id,
			});
			await updateLocalStorage();
			if (refreshData) refreshData();
		} catch (error) {
			console.error(`Error ${actionType} friend request:`, error);
		}
	};

	const handleProfileClick = () => {
		// Don't navigate to profile view if clicking on your own profile
		if (currentUser._id === data._id) {
			navigate(`/dashboard/${currentUser._id}/profile`);
		} else {
			// Navigate to the profile view page for other users
			navigate(`/dashboard/${currentUser._id}/profiles/${data._id}`);
		}
	};

	const getButton = () => {
		// Check if friend actions should be hidden
		if (hideFriendActions) {
			return null; // Don't display any friend action buttons
		}

		// Handle 'cancelInvitation' and 'removePlayer' actions
		if (action === "cancelInvitation" || action === "removePlayer") {
			return (
				<button
					onClick={onAction}
					className={`profile-button${size === "compact" ? "-compact" : ""
						}`}
				>
					{action === "cancelInvitation" ? "Cancel" : "Remove"}
				</button>
			);
		}

		// Proceed with friend request buttons only if 'currentUser' is provided
		if (
			!currentUser ||
			!Array.isArray(currentUser.friends) ||
			!Array.isArray(currentUser.pendingRequests) ||
			!Array.isArray(currentUser.friendRequests)
		) {
			console.log("User data missing or malformed:", currentUser);
			return null; // Avoid errors if properties are undefined
		}

		const isPendingRequest = currentUser.pendingRequests.some(
			(req) => req._id === data._id
		);
		const isFriendRequest = currentUser.friendRequests.some(
			(req) => req._id === data._id
		);
		const isFriend = currentUser.friends.some(
			(friend) => friend._id === data._id
		);

		if (isFriend) {
			return (
				<button
					onClick={() => handleFriendRequest("remove")}
					className={`profile-button${size === "compact" ? "-compact" : ""
						}`}
				>
					- Remove Friend
				</button>
			);
		}
		if (isPendingRequest) {
			return (
				<button
					onClick={() => handleFriendRequest("cancel")}
					className={`profile-button${size === "compact" ? "-compact" : ""
						}`}
				>
					Cancel Request
				</button>
			);
		}
		if (isFriendRequest) {
			return (
				<div className="request-button-container">
					<button
						onClick={() => handleFriendRequest("accept")}
						className={`profile-button${size === "compact" ? "-compact" : ""
							}`}
					>
						Accept
					</button>
					<button
						onClick={() => handleFriendRequest("reject")}
						className={`profile-button${size === "compact" ? "-compact" : ""
							}`}
					>
						Reject
					</button>
				</div>
			);
		}
		return (
			<button
				onClick={() => handleFriendRequest("send")}
				className={`profile-button${size === "compact" ? "-compact" : ""
					}`}
			>
				+ Add Friend
			</button>
		);
	};

	const mutualFriendsCount = data.mutualFriendsCount || 0;

	return (
		<div
			className={`profile-container${size === "compact" ? "-compact" : ""
				}`}
			onClick={handleProfileClick}
			style={{ cursor: "pointer" }}
		>
			<PokerChipAvatar
				className={`profile-picture${size === "compact" ? "-compact" : ""
					}`}
				username={data.username}
				firstName={data.names?.firstName}
				lastName={data.names?.lastName}
			/>
			<div
				className={`profile-details-wrapper${size === "compact" ? "-compact" : ""
					}`}
			>
				<div
					className={`profile-details-container${size === "compact" ? "-compact" : ""
						}`}
				>
					<span
						className={`profile-username${size === "compact" ? "-compact" : ""
							}`}
					>
						{data.username}
					</span>
					<span
						className={`profile-name${size === "compact" ? "-compact" : ""
							}`}
					>
						{data.names.firstName} {data.names.lastName}
					</span>
					<span
						className={`profile-mutual-friends${size === "compact" ? "-compact" : ""
							}`}
					>
						{mutualFriendsCount} Mutual Friend
						{mutualFriendsCount !== 1 ? "s" : ""}
					</span>
				</div>
				<div onClick={(e) => e.stopPropagation()}>{getButton()}</div>
			</div>
		</div>
	);
};

export default Profile;
