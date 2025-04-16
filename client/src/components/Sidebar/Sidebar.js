import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Sidebar.css";
import { minidenticon } from "minidenticons";
import Logo from "../Logo/Logo";
import axios from "axios";
import { DASHBOARD_MENU_ITEMS } from "../../constants/menuConfig";

const Sidebar = ({ page, username }) => {
	const navigate = useNavigate();
	const { userId } = useParams();
	const [unreadCount, setUnreadCount] = useState(0);

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

		// Set up interval to periodically check for new notifications
		const interval = setInterval(fetchUnreadCount, 60000); // Check every minute

		return () => clearInterval(interval);
	}, [userId]);

	const signOut = () => {
		localStorage.removeItem("user");
		navigate("/signin");
	};

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
					<MinidenticonImg
						className="profile-pic"
						username={username}
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
