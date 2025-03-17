import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './GameDashboard.css';
import '../Host/Host.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import InvitePlayers from '../../../components/InvitePlayers/InvitePlayers';
import Profile from '../../../components/Profile/Profile';
import RejectModal from '../../../components/RejectModal/RejectModal';

export function GameDashboard() {
    const [user, setUser] = useState(null);
    const { userId, gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [editing, setEditing] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [isPlayer, setIsPlayer] = useState(false);
    const [gameForm, setGameForm] = useState({
        name: '',
        blinds: '',
        location: '',
        date: '',
        time: '',
        handed: '',
        notes: ''
    });
    const [players, setPlayers] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

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
            console.error('Error fetching join requests:', error);
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
            await axios.post(`${process.env.REACT_APP_API_URL}/players/accept-invitation`, {
                userId: user._id,  // Host ID
                gameId: gameId,
                requesterId: requesterId
            });
            fetchJoinRequests();
            fetchPlayers();
        } catch (error) {
            console.error('Error accepting join request:', error);
        }
    };

    const handleRejectRequest = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/players/reject-request`, {
                hostId: user._id,
                gameId: gameId,
                requesterId: selectedRequesterId,
                reason: rejectReason,  // Send reason to backend
            });
            setRejectModalOpen(false);
            setRejectReason('');
            fetchJoinRequests();
        } catch (error) {
            console.error('Error rejecting join request:', error);
        }
    };

    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequesterId, setSelectedRequesterId] = useState(null);

    const openRejectModal = (requesterId) => {
        setSelectedRequesterId(requesterId);
        setRejectModalOpen(true);
    };

    // Fetch the user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedUser = JSON.parse(localStorage.getItem('user'));
                if (loggedUser && loggedUser._id === userId) {
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`);
                    setUser(res.data);
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                navigate('/signin');
            }
        };
        fetchUser();
    }, [userId, navigate]);

    // Wrap fetchPlayers in useCallback so its dependencies are explicit.
    const fetchPlayers = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/players/game/${gameId}`);
            setPlayers(res.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }, [gameId]);

    // Wrap fetchGame in useCallback. It depends on gameId and fetchPlayers.
    const fetchGame = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/games/${gameId}`);
            const gameData = res.data;
            setGame(gameData);

            // Parse the game_date into a Date object
            const gameDate = new Date(gameData.game_date);

            // Extract date components
            const year = gameDate.getFullYear();
            const month = String(gameDate.getMonth() + 1).padStart(2, '0');
            const day = String(gameDate.getDate()).padStart(2, '0');

            // Extract time components
            const hours = String(gameDate.getHours()).padStart(2, '0');
            const minutes = String(gameDate.getMinutes()).padStart(2, '0');

            // Format date and time
            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hours}:${minutes}`;

            setGameForm({
                name: gameData.game_name,
                blinds: gameData.blinds,
                location: gameData.location,
                date: formattedDate,
                time: formattedTime,
                notes: gameData.notes || '',
                handed: gameData.handed,
                isPublic: gameData.is_public // This is the key change
            });
            // Fetch players after fetching the game details
            fetchPlayers();
        } catch (error) {
            console.error('Error fetching game:', error);
        }
    }, [gameId, fetchPlayers]);


    // Fetch game details when gameId changes
    useEffect(() => {
        fetchGame();
    }, [fetchGame]);

    // Update host/player status when user, game, or players change
    useEffect(() => {
        if (user && game) {
            setIsHost(user._id === game.host_id._id);
            const isUserPlayer = players.some(
                (player) =>
                    player.user_id._id === user._id &&
                    player.invitation_status === 'accepted'
            );
            setIsPlayer(isUserPlayer);
        }
    }, [user, game, players]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGameForm({ ...gameForm, [name]: value });
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
                handed: gameForm.handed
            };

            await axios.put(`${process.env.REACT_APP_API_URL}/games/${gameId}`, updatedGame);
            setEditing(false);
            fetchGame();
        } catch (error) {
            console.error('Error updating game:', error);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this game?");
        if (!confirmDelete) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/games/${gameId}`);
            navigate(`/dashboard/${userId}/host`);
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    const handleEdit = () => {
        if (isHost) {
            setEditing(true);
        } else {
            alert("Only the host can edit this game.");
        }
    };

    const handleLeaveGame = async () => {
        const confirmLeave = window.confirm("Are you sure you want to leave this game?");
        if (!confirmLeave) return;

        try {
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeId: user._id,
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/players/remove-player`, data);
            navigate(`/dashboard/${userId}/games`);
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    if (!game || !user) {
        return <div>Loading...</div>;
    }

    const gameDate = new Date(game.game_date);
    const formattedDate = gameDate.toLocaleDateString();
    const formattedTime = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Separate players into accepted and pending
    const acceptedPlayers = players.filter(player => player.invitation_status === 'accepted');
    const pendingPlayers = players.filter(player => player.invitation_status === 'pending');

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={() => { }} page="host" username={user.username} />
            <div className='logged-content-container game-dashboard'>
                <div className='dashboard-heading'>
                    <h1>
                        {game.game_name}
                        {game.is_public && <span className="game-type-tag public">Public</span>}
                        {!game.is_public && <span className="game-type-tag private">Private</span>}
                    </h1>
                    <div className='buttons'>
                        {editing ? (
                            <>
                                {isHost && <button className="save" onClick={handleUpdate}>Save</button>}
                                {isHost && <button className="cancel" onClick={() => setEditing(false)}>Cancel</button>}
                            </>
                        ) : (
                            <>
                                {isHost && <button className="edit" onClick={handleEdit}>Edit & Invite</button>}
                                {isHost && <button className="delete" onClick={handleDelete}>Delete</button>}
                                {!isHost && isPlayer && (
                                    <button className="leave-game" onClick={handleLeaveGame}>Leave Game</button>
                                )}
                                <button className="back" onClick={() => navigate(-1)}>Back</button>
                            </>
                        )}
                    </div>
                </div>
                <div className='game-dashboard-container'>
                    <div className='summary-item'>
                        <div className='summary-header'>
                            <h2>Details</h2>
                        </div>
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
                                        {game.is_public ? 'Public (open to join requests)' : 'Private (invite only)'}
                                    </span>
                                </div>
                                {isHost && (
                                    <div className='detail-item'>
                                        <span className='detail-label'>Handed: </span>
                                        <span className='detail-value'>{game.handed} max</span>
                                    </div>
                                )}
                                <div className='detail-item'>
                                    <span className='detail-label'>Blinds: </span>
                                    <span className='detail-value'>{game.blinds}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Location: </span>
                                    <span className='detail-value'>{game.location}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Date: </span>
                                    <span className='detail-value'>{formattedDate}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Time: </span>
                                    <span className='detail-value'>{formattedTime}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Notes: </span>
                                    <br /><br />
                                    <span className='detail-value notes-value'>{game.notes || 'No notes provided'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className='summary-item players-item'>
                        <div className='summary-header'>
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
                                            <Profile key={player._id} data={player.user_id} size={"compact"} />
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
                                                <Profile key={player._id} data={player.user_id} size={"compact"} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Join Requests Section for Public Games */}
                                {isHost && game.is_public && (
                                    <div className="join-requests-section">
                                        <h3>Join Requests {isLoadingRequests && <span className="loading-indicator">Loading...</span>}</h3>
                                        {joinRequests.length > 0 ? (
                                            <ul className="join-requests-list">
                                                {joinRequests.map(request => (
                                                    <li key={request._id} className="join-request-item">
                                                        <div className="join-request-profile">
                                                            <Profile
                                                                data={request.user_id}
                                                                size="compact"
                                                            />
                                                            <div className="join-request-actions">
                                                                <button
                                                                    className="accept-button small"
                                                                    onClick={() => handleAcceptRequest(request.user_id._id)}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button className="decline-button small" onClick={() => openRejectModal(request.user_id._id)}>
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="no-requests-message">No pending join requests</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {isRejectModalOpen && (
                        <RejectModal
                            open={isRejectModalOpen}
                            onClose={() => setRejectModalOpen(false)}
                            rejectReason={rejectReason}
                            setRejectReason={setRejectReason}
                            onSubmit={handleRejectRequest}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default GameDashboard;
