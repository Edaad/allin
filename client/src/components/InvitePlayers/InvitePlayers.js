// InvitePlayers.js

import React, { useState } from 'react';
import axios from 'axios';
import './InvitePlayers.css';
import Profile from '../Profile/Profile';

export default function InvitePlayers({ user, gameId, players, fetchPlayers }) {
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [error, setError] = useState(null);

    // Extract the IDs of friends who have already been invited
    const invitedFriendIds = players.map(player => player.user_id._id);

    // Filter user's friends to get the list of friends available for invitation
    const availableFriends = user.friends.filter(friend => !invitedFriendIds.includes(friend._id));

    const handleCheckboxChange = (e, friend) => {
        if (e.target.checked) {
            setSelectedFriends([...selectedFriends, friend]);
        } else {
            setSelectedFriends(selectedFriends.filter(f => f._id !== friend._id));
        }
    };

    const handleSendInvites = async () => {
        try {
            const inviteeIds = selectedFriends.map(friend => friend._id);
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeIds: inviteeIds,
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/players/send-invitations`, data);
            setSelectedFriends([]);
            fetchPlayers();
        } catch (error) {
            console.error('Error sending invitations:', error);
            setError('Failed to send invitations.');
        }
    };

    const handleCancelInvite = async (inviteeId) => {
        try {
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeId: inviteeId,
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/players/cancel-invitation`, data);
            fetchPlayers();
        } catch (error) {
            console.error('Error canceling invitation:', error);
            setError('Failed to cancel invitation.');
        }
    };

    const handleRemovePlayer = async (inviteeId) => {
        try {
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeId: inviteeId,
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/players/remove-player`, data);
            fetchPlayers();
        } catch (error) {
            console.error('Error removing player:', error);
            setError('Failed to remove player.');
        }
    };

    return (
        <div className="invite-players-container">
            {error && <p className="error-message">{error}</p>}
            <div className="invite-players-list">
                {availableFriends.length > 0 ? (
                    availableFriends.map(friend => (
                        <div key={friend._id} className="invite-player-item">
                            <label htmlFor={friend._id} className="player-label">
                                <input
                                    type="checkbox"
                                    id={friend._id}
                                    onChange={(e) => handleCheckboxChange(e, friend)}
                                    checked={selectedFriends.some(f => f._id === friend._id)}
                                />
                                <Profile data={friend} size="compact" />
                            </label>
                        </div>
                    ))
                ) : (
                    <div>No available friends to invite</div>
                )}
            </div>
            <button
                className="invite-button"
                onClick={handleSendInvites}
                disabled={selectedFriends.length === 0}
            >
                Send Invitations
            </button>
            <h3>Pending Invitations</h3>
            <ul className="invitation-list">
                {players
                    .filter(player => player.invitation_status === 'pending')
                    .map(player => (
                        <li key={player._id} className="invitation-item">
                            <Profile
                                data={player.user_id}
                                size="compact"
                                action="cancelInvitation"
                                onAction={() => handleCancelInvite(player.user_id._id)}
                            />
                        </li>
                    ))}
            </ul>
            <h3>Accepted Players</h3>
            <ul className="accepted-list">
                {players
                    .filter(player => player.invitation_status === 'accepted')
                    .map(player => (
                        <li key={player._id} className="accepted-item">
                            <Profile
                                data={player.user_id}
                                size="compact"
                                action="removePlayer"
                                onAction={() => handleRemovePlayer(player.user_id._id)}
                            />
                        </li>
                    ))}
            </ul>
            <h3>Waitlist</h3>
            <ul className="waitlist-list">
                {players
                    .filter(player => player.invitation_status === 'waitlist')
                    .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt))
                    .map((player, index) => (
                        <li key={player._id} className="waitlist-item">
                            <div className="waitlist-player">
                                <span className="waitlist-position">#{index + 1}</span>
                                <Profile
                                    data={player.user_id}
                                    size="compact"
                                    action="removePlayer"
                                    onAction={() => handleRemovePlayer(player.user_id._id)}
                                />
                            </div>
                        </li>
                    ))}
                {players.filter(player => player.invitation_status === 'waitlist').length === 0 && (
                    <li className="no-waitlist-message">No players on waitlist</li>
                )}
            </ul>

        </div>
    );
}
