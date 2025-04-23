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
            const request = joinRequests.find(req => 
                (req.is_guest ? req.guest_id._id : req.user_id._id) === requesterId
            );
            
            await axios.post(`${process.env.REACT_APP_API_URL}/players/accept-invitation`, {
                userId: user._id,  // Host ID
                gameId: gameId,
                requesterId: requesterId,
                isGuest: request?.is_guest || false
            });
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
            const request = joinRequests.find(req => 
                (req.is_guest ? req.guest_id._id : req.user_id._id) === selectedRequesterId
            );

            await axios.post(`${process.env.REACT_APP_API_URL}/players/reject-request`, {
                hostId: user._id,
                gameId: gameId,
                requesterId: selectedRequesterId,
                reason: rejectReason,
                isGuest: request?.is_guest || false
            });
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
        if (user && game && game.host_id) {
            setIsHost(user._id === game.host_id._id);

            const isUserPlayer = players.some(
                (player) => player.user_id && player.user_id._id === user._id &&
                    ['accepted', 'requested', 'waitlist'].includes(player.invitation_status)
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
                        {editing ? (
                            <form className='host-form compact'>
                                <Input
                                    name='name'
                                    type='text'
                                    label='Name'
                                    placeholder={`Give your game a name e.g.${user.username}'s poker night`}
                                    value={gameForm.name}
                                    onChange={handleInputChange}
                                />
                                <div className='input-double'>
                                    <Select
                                        name="blinds"
                                        label="Blinds"
                                        placeholder="Select your game blinds"
                                        value={gameForm.blinds}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: '1/2', label: '$1/$2' },
                                            { value: '2/5', label: '$2/$5' },
                                            { value: '5/10', label: '$5/$10' },
                                        ]}
                                    />
                                    <Select
                                        name="handed"
                                        label="Handed"
                                        placeholder="Select the player max"
                                        value={gameForm.handed}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: '2', label: '2 max' },
                                            { value: '3', label: '3 max' },
                                            { value: '4', label: '4 max' },
                                            { value: '5', label: '5 max' },
                                            { value: '6', label: '6 max' },
                                            { value: '7', label: '7 max' },
                                            { value: '8', label: '8 max' },
                                            { value: '9', label: '9 max' },
                                            { value: '10', label: '10 max' },
                                        ]}
                                    />
                                </div>
                                <div className="game-privacy-option">
                                    <label className="input-label">Game Privacy</label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="isPublic"
                                                value="false"
                                                checked={!gameForm.isPublic}
                                                onChange={() => setGameForm({ ...gameForm, isPublic: false })}
                                            />
                                            Private (invite only)
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="isPublic"
                                                value="true"
                                                checked={gameForm.isPublic}
                                                onChange={() => setGameForm({ ...gameForm, isPublic: true })}
                                            />
                                            Public (open to join requests)
                                        </label>
                                    </div>
                                </div>
                                <Input
                                    name='location'
                                    type='text'
                                    label='Location'
                                    placeholder='Enter the address of your game'
                                    value={gameForm.location}
                                    onChange={handleInputChange}
                                />
                                <div className='input-double'>
                                    <Input
                                        name='date'
                                        type='date'
                                        label='Date'
                                        value={gameForm.date}
                                        onChange={handleInputChange}
                                    />
                                    <Input
                                        name='time'
                                        type='time'
                                        label='Time'
                                        value={gameForm.time}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className='textarea-container'>
                                    <label htmlFor='notes' className='input-label'>Notes</label>
                                    <textarea
                                        name='notes'
                                        id='notes'
                                        rows='5'
                                        value={gameForm.notes}
                                        onChange={handleInputChange}
                                        placeholder='Enter any additional notes about the game...'
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className='game-details'>
                                <div className='detail-item'>
                                    <span className='detail-label'>Game Type: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-gamepad"></i>
                                        </span>
                                        {game.is_public ? 'Public (open to join requests)' : 'Private (invite only)'}
                                    </span>
                                </div>
                                {isHost && (
                                    <div className='detail-item'>
                                        <span className='detail-label'>Handed: </span>
                                        <span className='detail-value'>
                                            <span className="icon-wrapper">
                                                <i className="fa-solid fa-users"></i>
                                            </span>
                                            {game.handed} max
                                        </span>
                                    </div>
                                )}
                                <div className='detail-item'>
                                    <span className='detail-label'>Blinds: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-dollar-sign"></i>
                                        </span>
                                        {game.blinds}
                                    </span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Location: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-location-dot"></i>
                                        </span>
                                        {game.location}
                                    </span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Date: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-calendar"></i>
                                        </span>
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Time: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-clock"></i>
                                        </span>
                                        {formattedTime}
                                    </span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Notes: </span>
                                    <span className='detail-value'>
                                        <span className="icon-wrapper">
                                            <i className="fa-solid fa-note-sticky"></i>
                                        </span>
                                        <span className='notes-value'>{game.notes || 'No notes provided'}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className='summary-item players-item'>
                        <div className='game-summary-header'>
                            <h2>Players</h2>
                        </div>
                        {editing ? (
                            isHost ? (
                                <InvitePlayers
                                    user={user}
                                    gameId={gameId}
                                    players={players}
                                    fetchPlayers={fetchPlayers}
                                />
                            ) : (
                                <div>You are not authorized to edit players.</div>
                            )
                        ) : (
                            <div className='players-list'>
                                {acceptedPlayers.length > 0 ? (
                                    <div className='all-profiles-container'>
                                        {acceptedPlayers.map(player => (
                                            <Profile 
                                                key={player._id} 
                                                data={player.is_guest ? player.guest_id : player.user_id} 
                                                size={"compact"} 
                                                currentUser={user}
                                                isGuest={player.is_guest}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div>No accepted players</div>
                                )}
                                {pendingPlayers.length > 0 && (
                                    <>
                                        <h3>Pending Invitations</h3>
                                        <div className='all-profiles-container'>
                                            {pendingPlayers.map(player => (
                                                <Profile 
                                                    key={player._id} 
                                                    data={player.is_guest ? player.guest_id : player.user_id} 
                                                    size={"compact"} 
                                                    currentUser={user}
                                                    isGuest={player.is_guest}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                                {waitlistedPlayers.length > 0 && (
                                    <>
                                        <h3>Waitlist</h3>
                                        <div className="all-profiles-container">
                                            {waitlistedPlayers.map((player, index) => (
                                                <div key={player._id} className="waitlist-player">
                                                    <span className="waitlist-position">#{index + 1}</span>
                                                    <Profile 
                                                        data={player.is_guest ? player.guest_id : player.user_id} 
                                                        size="compact" 
                                                        currentUser={user}
                                                        isGuest={player.is_guest}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {isHost && game.is_public && (
                                    <div className="join-requests-section">
                                        <h3>Join Requests {isLoadingRequests && <span className="loading-indicator">Loading...</span>}</h3>
                                        {joinRequests.length > 0 ? (
                                            <ul className="join-requests-list">
                                                {joinRequests.map(request => {
                                                    const isGuestRequest = request.is_guest;
                                                    const profileData = isGuestRequest ? request.guest_id : request.user_id;
                                                    const requesterId = isGuestRequest ? request.guest_id._id : request.user_id._id;
                                                    
                                                    return (
                                                        <li key={request._id} className="join-request-item">
                                                            <div className="join-request-profile">
                                                                {profileData && (
                                                                    <Profile
                                                                        data={profileData}
                                                                        size="compact"
                                                                        currentUser={user}
                                                                    />
                                                                )}
                                                                <div className="join-request-actions">
                                                                    <button
                                                                        className="accept-button small"
                                                                        onClick={() => handleAcceptRequest(requesterId)}
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <button 
                                                                        className="decline-button small" 
                                                                        onClick={() => openRejectModal(requesterId)}
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="no-requests-message">No pending join requests</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
