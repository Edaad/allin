import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Sidebar.css";
import Logo from "../Logo/Logo";
import axios from "axios";
import { DASHBOARD_MENU_ITEMS } from "../../constants/menuConfig";
// Remove minidenticon import
// import { minidenticon } from "minidenticons";
// Add our new component
import PokerChipAvatar from "../PokerChipAvatar/PokerChipAvatar";

const Sidebar = ({ page, username }) => {
	const navigate = useNavigate();
	const { userId } = useParams();
	const [unreadCount, setUnreadCount] = useState(0);
	const [userData, setUserData] = useState(null);

	// Fetch user data to get first and last name for avatar
	useEffect(() => {
		const fetchUserData = async () => {
			if (!userId) return;

			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/users/${userId}`
				);
				setUserData(response.data);
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchUserData();
	}, [userId]);

	// Fetch unread notification count
	useEffect(() => {
		const fetchUnreadCount = async () => {
			if (!userId) return;

			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/notifications/unread/${userId}`
				);
				setUnreadCount(response.data.count);
			} catch (error) {
				console.error(
					"Error fetching unread notifications count:",
					error
				);
			}
		};

		fetchUnreadCount();
		const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
		return () => clearInterval(interval);
	}, [userId]);

	const signOut = () => {
		localStorage.removeItem("user");
		navigate("/signin");
	};

	// Remove the MinidenticonImg component

	return (
		<div className="sidebar-container">
			<div className="sidebar-logo">
				<Logo />
			</div>
			<ul className="menu">
				{DASHBOARD_MENU_ITEMS.map((menuItem, index) => (
					<li
						key={index}
						className={`menu-item ${page === menuItem.page ? "bg-highlight" : ""
							}`}
						onClick={() =>
							navigate(`/dashboard/${userId}/${menuItem.page}`)
						}
					>
						<span className="title">{menuItem.title}</span>
						{menuItem.page === "notifications" && unreadCount > 0 && (
							<span className="notification-badge">
								{unreadCount}
							</span>
						)}
					</li>
				))}
			</ul>
			<div className="sidebar-footer">
				<div
					className="menu-item"
					onClick={() => navigate(`/dashboard/${userId}/account`)}
				>
					{/* Replace minidenticon with PokerChipAvatar */}
					<PokerChipAvatar
						className="profile-pic"
						username={username}
						firstName={userData?.names?.firstName || ''}
						lastName={userData?.names?.lastName || ''}
					/>
					<span
						className={`account-username ${page === "account" ? "bg-highlight" : ""
							}`}
					>
						{username}
					</span>
				</div>
				<button className="signout-button" onClick={signOut}>
					Sign Out
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
