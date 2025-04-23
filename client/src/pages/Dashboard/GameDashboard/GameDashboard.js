import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../Dashboard.css";
import "./GameDashboard.css";
import { minidenticon } from "minidenticons";
import Sidebar from "../../../components/Sidebar/Sidebar";
import RejectModal from "../../../components/RejectModal/RejectModal";
import ReviewButton from "../../../components/ReviewButton/ReviewButton";
import ReviewModal from "../../../components/ReviewModal/ReviewModal";
import GameDetails from "../../../components/GameDetails/GameDetails";
import HostInfo from "../../../components/HostInfo/HostInfo";
import PlayersList from "../../../components/PlayersList/PlayersList";

export function GameDashboard() {
    const [user, setUser] = useState(null);
    const { userId, gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [editing, setEditing] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [isPlayer, setIsPlayer] = useState(false);
    const [gameForm, setGameForm] = useState({
        name: "",
        blinds: "",
        location: "",
        date: "",
        time: "",
        handed: "",
        notes: "",
    });
    const [players, setPlayers] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [userGroups, setUserGroups] = useState([]);

    // State for host information
    const [hostProfile, setHostProfile] = useState(null);
    const [hostStats, setHostStats] = useState({
        memberSince: "",
        gamesHosted: 0,
        gamesPlayed: 0,
    });
    const [hostReviews, setHostReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    // Function to fetch host information
    const fetchHostInfo = useCallback(async () => {
        if (!game || !game.host_id) return;

        try {
            // Get the host ID - handle both populated and unpopulated host_id
            const hostId =
                typeof game.host_id === "object"
                    ? game.host_id._id
                    : game.host_id;

            // Fetch host profile
            const profileResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/users/${hostId}`
            );
            setHostProfile(profileResponse.data);

            // Set member since date
            if (profileResponse.data.created_at || profileResponse.data.createdAt) {
                const memberDate = new Date(profileResponse.data.created_at || profileResponse.data.createdAt);
                setHostStats((prev) => ({
                    ...prev,
                    memberSince: memberDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                    }),
                }));
            }

            // Fetch host stats
            const hostedGamesResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/games`,
                {
                    params: { host_id: hostId },
                }
            );

            if (hostedGamesResponse.data) {
                setHostStats((prev) => ({
                    ...prev,
                    gamesHosted: hostedGamesResponse.data.length,
                }));
            }

            // Fetch host's played games
            const playedGamesResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/games/player/${hostId}`
            );
            if (playedGamesResponse.data) {
                setHostStats((prev) => ({
                    ...prev,
                    gamesPlayed: playedGamesResponse.data.length,
                }));
            }

            // Fetch host reviews
            const reviewsResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/reviews/host/${hostId}`
            );
            if (reviewsResponse.data) {
                setHostReviews(reviewsResponse.data.reviews || []);
                setAverageRating(reviewsResponse.data.averageRating || 0);
            }
        } catch (error) {
            console.error("Error fetching host information:", error);
        }
    }, [game]);

    // Generate minidenticon for host
    const generateAvatar = useMemo(() => {
        return (username) => {
            if (!username) return "";
            return (
                "data:image/svg+xml;utf8," +
                encodeURIComponent(minidenticon(username))
            );
        };
    }, []);

    // Format date for reviews
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const fetchJoinRequests = useCallback(async () => {
        if (!game || !user || !isHost) return;

        try {
            setIsLoadingRequests(true);
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/players/requests/${gameId}`,
                { params: { hostId: user._id } }
            );
            setJoinRequests(res.data);
            setIsLoadingRequests(false);
        } catch (error) {
            console.error("Error fetching join requests:", error);
            setIsLoadingRequests(false);
        }
    }, [gameId, game, user, isHost]);

    useEffect(() => {
        if (isHost && game && game.is_public) {
            fetchJoinRequests();
        }
    }, [isHost, game, fetchJoinRequests]);

    const handleAcceptRequest = async (requesterId) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/players/accept-invitation`,
                {
                    userId: user._id, // Host ID
                    gameId: gameId,
                    requesterId: requesterId,
                }
            );
            fetchJoinRequests();
            fetchPlayers();
        } catch (error) {
            console.error("Error accepting join request:", error);
        }
    };

    const handleRejectRequest = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/players/reject-request`,
                {
                    hostId: user._id,
                    gameId: gameId,
                    requesterId: selectedRequesterId,
                    reason: rejectReason, // Send reason to backend
                }
            );
            setRejectModalOpen(false);
            setRejectReason("");
            fetchJoinRequests();
        } catch (error) {
            console.error("Error rejecting join request:", error);
        }
    };

    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedRequesterId, setSelectedRequesterId] = useState(null);

    const openRejectModal = (requesterId) => {
        setSelectedRequesterId(requesterId);
        setRejectModalOpen(true);
    };

    const handleRequestToJoin = async () => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/players/request-to-join`,
                {
                    userId: user._id,
                    gameId: gameId,
                }
            );

            if (response.data.status === "waitlist") {
                alert(
                    `The game is currently full. You've been added to the waitlist at position #${response.data.position || ""
                    }.`
                );
            } else {
                alert(
                    "Your request to join the game has been sent successfully."
                );
            }

            fetchGame();
        } catch (error) {
            console.error("Error requesting to join game:", error);
            alert("Failed to request to join game. Please try again.");
        }
    };

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

    const fetchPlayers = useCallback(async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/players/game/${gameId}`
            );

            console.log("Fetched players:", res.data);

            // Make sure the data is properly populated
            const populatedData = res.data.map((player) => {
                // If user_id is just an ID (not populated), provide a default object
                if (player.user_id && typeof player.user_id !== "object") {
                    return {
                        ...player,
                        user_id: { _id: player.user_id },
                    };
                }
                return player;
            });

            setPlayers(populatedData);
        } catch (error) {
            console.error("Error fetching players:", error);
        }
    }, [gameId]);

    const fetchGame = useCallback(async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/games/${gameId}`
            );
            const gameData = res.data;
            setGame(gameData);

            const gameDate = new Date(gameData.game_date);

            const year = gameDate.getFullYear();
            const month = String(gameDate.getMonth() + 1).padStart(2, "0");
            const day = String(gameDate.getDate()).padStart(2, "0");

            const hours = String(gameDate.getHours()).padStart(2, "0");
            const minutes = String(gameDate.getMinutes()).padStart(2, "0");

            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hours}:${minutes}`;

            setGameForm({
                name: gameData.game_name,
                blinds: gameData.blinds,
                location: gameData.location,
                date: formattedDate,
                time: formattedTime,
                notes: gameData.notes || "",
                handed: gameData.handed,
                isPublic: gameData.is_public,
            });
            fetchPlayers();
        } catch (error) {
            console.error("Error fetching game:", error);
        }
    }, [gameId, fetchPlayers]);

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

    useEffect(() => {
        if (user) {
            fetchUserGroups();
        }
    }, [user, fetchUserGroups]);

    useEffect(() => {
        fetchGame();
    }, [fetchGame]);

    useEffect(() => {
        if (user && game) {
            setIsHost(user._id === game.host_id._id);

            const isUserPlayer = players.some(
                (player) =>
                    player.user_id?._id === user._id &&
                    ["accepted", "requested", "waitlist"].includes(
                        player.invitation_status
                    )
            );
            setIsPlayer(isUserPlayer);
        }
    }, [user, game, players]);

    useEffect(() => {
        if (game && game.group_id) {
            setSelectedGroup(game.group_id);
        } else {
            setSelectedGroup(null);
        }
    }, [game]);

    useEffect(() => {
        if (game && !isHost) {
            fetchHostInfo();
        }
    }, [game, isHost, fetchHostInfo]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "group_id") {
            // Group selection logic
            if (value) {
                const selectedGroup = userGroups.find(
                    (group) => group._id === value
                );
                if (selectedGroup) {
                    setSelectedGroup(selectedGroup);
                    setGameForm((prev) => ({
                        ...prev,
                        group_id: value,
                        isPublic: selectedGroup.is_public,
                    }));
                }
            } else {
                setSelectedGroup(null);
                setGameForm((prev) => ({
                    ...prev,
                    group_id: value,
                }));
            }
        } else {
            // For other fields, standard update
            setGameForm({ ...gameForm, [name]: value });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const gameDateTimeString = `${gameForm.date}T${gameForm.time}:00`;
            const gameDateTime = new Date(gameDateTimeString);

            const updatedGame = {
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: gameDateTime,
                blinds: gameForm.blinds,
                notes: gameForm.notes,
                handed: gameForm.handed,
                is_public: gameForm.isPublic,
            };

            await axios.put(
                `${process.env.REACT_APP_API_URL}/games/${gameId}`,
                updatedGame
            );
            setEditing(false);
            fetchGame();
        } catch (error) {
            console.error("Error updating game:", error);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this game?"
        );
        if (!confirmDelete) return;
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/games/${gameId}`
            );
            navigate(`/dashboard/${userId}/host`);
        } catch (error) {
            console.error("Error deleting game:", error);
        }
    };

    const handleEdit = () => {
        setEditing(true);
        const gameDate = new Date(game.game_date);

        setGameForm({
            name: game.game_name,
            blinds: game.blinds,
            location: game.location,
            date: gameDate.toISOString().split("T")[0],
            time: gameDate.toTimeString().slice(0, 5),
            handed: game.handed.toString(),
            notes: game.notes || "",
            isPublic: game.is_public,
        });
    };

    const handleLeaveGame = async () => {
        const confirmLeave = window.confirm(
            "Are you sure you want to leave this game?"
        );
        if (!confirmLeave) return;

        try {
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeId: user._id,
            };
            await axios.post(
                `${process.env.REACT_APP_API_URL}/players/remove-player`,
                data
            );
            navigate(`/dashboard/${userId}/games`);
        } catch (error) {
            console.error("Error leaving game:", error);
        }
    };

    const handleReviewClick = () => {
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = () => {
        fetchGame();
    };

    const handleShareLink = () => {
        const guestLink = `${window.location.origin}/guest/join/${gameId}`;
        navigator.clipboard.writeText(guestLink);
        setShowShareModal(true);
        setTimeout(() => setShowShareModal(false), 3000); // Hide after 3 seconds
    };

    if (!game || !user) {
        return <div>Loading...</div>;
    }

    const gameDate = new Date(game.game_date);
    const formattedDate = gameDate.toLocaleDateString();
    const formattedTime = gameDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const acceptedPlayers = players.filter(
        (player) => player.invitation_status === "accepted"
    );

    return (
        <div className="dashboard">
            <Sidebar
                page="host"
                username={user.username}
            />
            <div className="logged-content-container game-dashboard">
                <div className="dashboard-heading">
                    <h1>
                        {game.game_name}
                        {game.is_public && (
                            <span className="game-type-tag public">Public</span>
                        )}
                        {!game.is_public && (
                            <span className="game-type-tag private">
                                Private
                            </span>
                        )}
                    </h1>
                    <div className="buttons">
                        {editing ? (
                            <>
                                {isHost && (
                                    <button
                                        className="save"
                                        onClick={handleUpdate}
                                    >
                                        Save
                                    </button>
                                )}
                                {isHost && (
                                    <button
                                        className="cancel"
                                        onClick={() => setEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {isHost && (
                                    <button
                                        className="edit"
                                        onClick={handleEdit}
                                    >
                                        Edit & Invite
                                    </button>
                                )}
                                {isHost && (
                                    <button
                                        className="delete"
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </button>
                                )}
                                {!isHost && isPlayer && (
                                    <button
                                        className="leave-game"
                                        onClick={handleLeaveGame}
                                    >
                                        Leave Game
                                    </button>
                                )}
                                {!isHost && !isPlayer && game.is_public && (
                                    <button
                                        className="request-button"
                                        onClick={handleRequestToJoin}
                                    >
                                        {acceptedPlayers.length >= game.handed
                                            ? "Join Waitlist"
                                            : "Request to Join"}
                                    </button>
                                )}
                                {!isHost &&
                                    isPlayer &&
                                    game.game_status === "completed" && (
                                        <ReviewButton
                                            gameId={gameId}
                                            gameStatus={game.game_status}
                                            isHost={isHost}
                                            onReviewClick={handleReviewClick}
                                        />
                                    )}
                                <button
                                    className="back"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="game-dashboard-container">
                    <div className="summary-item">
                        {/* Host Information Section - Only show when not editing and not the host */}
                        {!editing && !isHost && hostProfile && (
                            <HostInfo
                                hostProfile={hostProfile}
                                hostStats={hostStats}
                                hostReviews={hostReviews}
                                averageRating={averageRating}
                                generateAvatar={generateAvatar}
                                formatDate={formatDate}
                            />
                        )}

                        {/* Game Details Section */}
                        <GameDetails
                            game={game}
                            gameForm={gameForm}
                            handleInputChange={handleInputChange}
                            editing={editing}
                            isHost={isHost}
                            selectedGroup={selectedGroup}
                            setGameForm={setGameForm}
                            handleShareLink={handleShareLink}
                            showShareModal={showShareModal}
                            formattedDate={formattedDate}
                            formattedTime={formattedTime}
                        />
                    </div>
                    <div className="summary-item players-item">
                        {/* Players List Section */}
                        <PlayersList
                            players={players}
                            editing={editing}
                            isHost={isHost}
                            user={user}
                            gameId={gameId}
                            fetchPlayers={fetchPlayers}
                            game={game}
                            joinRequests={joinRequests}
                            handleAcceptRequest={handleAcceptRequest}
                            openRejectModal={openRejectModal}
                            isLoadingRequests={isLoadingRequests}
                        />
                    </div>

                    {/* Modals */}
                    {isRejectModalOpen && (
                        <RejectModal
                            open={isRejectModalOpen}
                            onClose={() => setRejectModalOpen(false)}
                            rejectReason={rejectReason}
                            setRejectReason={setRejectReason}
                            onSubmit={handleRejectRequest}
                        />
                    )}
                    {showReviewModal && (
                        <ReviewModal
                            gameId={gameId}
                            isOpen={showReviewModal}
                            onClose={() => setShowReviewModal(false)}
                            onReviewSubmitted={handleReviewSubmitted}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameDashboard;
