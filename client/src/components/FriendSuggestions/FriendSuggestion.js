// src/components/FriendSuggestions/FriendSuggestions.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FriendSuggestion.css';
import Profile from '../Profile/Profile';

function FriendSuggestions({ user, updateUserState }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user || !user._id) return;
            
            try {
                setLoading(true);
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/users/${user._id}/suggestions`
                );
                setSuggestions(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching friend suggestions:', err);
                setError('Could not load friend suggestions');
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user]);

    if (loading) {
        return <div className="friend-suggestions-loading">Loading suggestions...</div>;
    }

    if (error) {
        return <div className="friend-suggestions-error">{error}</div>;
    }

    if (suggestions.length === 0) {
        return <div className="friend-suggestions-empty">No friend suggestions available at this time.</div>;
    }

    return (
        <div className="friend-suggestions-container">
            <h3 className="friend-suggestions-title">People You May Know</h3>
            <div className="friend-suggestions-list">
                {suggestions.map(suggestion => (
                    <div key={suggestion._id} className="friend-suggestion-item">
                        <Profile 
                            data={suggestion} 
                            currentUser={user} 
                            updateUserState={updateUserState} 
                        />
                        <div className="mutual-friends-info">
                            <span className="mutual-count">{suggestion.mutualFriendsCount} mutual {suggestion.mutualFriendsCount === 1 ? 'friend' : 'friends'}</span>
                            {suggestion.mutualFriends && suggestion.mutualFriends.length > 0 && (
                                <div className="mutual-friends-preview">
                                    <span>via </span>
                                    {suggestion.mutualFriends.map((friend, index) => (
                                        <React.Fragment key={friend._id}>
                                            <span className="mutual-friend-name">{friend.username}</span>
                                            {index < suggestion.mutualFriends.length - 1 && ', '}
                                        </React.Fragment>
                                    ))}
                                    {suggestion.mutualFriendsCount > suggestion.mutualFriends.length && (
                                        <span> and {suggestion.mutualFriendsCount - suggestion.mutualFriends.length} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FriendSuggestions;