// Profile.js

import React, { useMemo } from "react";
import "./Profile.css";
import { minidenticon } from "minidenticons";
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
}) => {
	const navigate = useNavigate();
	if (!data || !data.username) {
		return null;
	}

	const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
		const svgURI = useMemo(
			() =>
				"data:image/svg+xml;utf8," +
				encodeURIComponent(
					minidenticon(username, saturation, lightness)
				),
			[username, saturation, lightness]
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
		// Handle 'cancelInvitation' and 'removePlayer' actions
		if (action === "cancelInvitation" || action === "removePlayer") {
			return (
				<button
					onClick={onAction}
					className={`profile-button${
						size === "compact" ? "-compact" : ""
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
					className={`profile-button${
						size === "compact" ? "-compact" : ""
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
					className={`profile-button${
						size === "compact" ? "-compact" : ""
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
						className={`profile-button${
							size === "compact" ? "-compact" : ""
						}`}
					>
						Accept
					</button>
					<button
						onClick={() => handleFriendRequest("reject")}
						className={`profile-button${
							size === "compact" ? "-compact" : ""
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
				className={`profile-button${
					size === "compact" ? "-compact" : ""
				}`}
			>
				+ Add Friend
			</button>
		);
	};

	const mutualFriendsCount = data.mutualFriendsCount || 0;

	return (
		<div
			className={`profile-container${
				size === "compact" ? "-compact" : ""
			}`}
			onClick={handleProfileClick}
			style={{ cursor: "pointer" }}
		>
			<MinidenticonImg
				className={`profile-picture${
					size === "compact" ? "-compact" : ""
				}`}
				username={data.username}
			/>
			<div
				className={`profile-details-wrapper${
					size === "compact" ? "-compact" : ""
				}`}
			>
				<div
					className={`profile-details-container${
						size === "compact" ? "-compact" : ""
					}`}
				>
					<span
						className={`profile-username${
							size === "compact" ? "-compact" : ""
						}`}
					>
						{data.username}
					</span>
					<span
						className={`profile-name${
							size === "compact" ? "-compact" : ""
						}`}
					>
						{data.names.firstName} {data.names.lastName}
					</span>
					{/* Display the mutual friends count */}
					<span
						className={`profile-mutual-friends${
							size === "compact" ? "-compact" : ""
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
