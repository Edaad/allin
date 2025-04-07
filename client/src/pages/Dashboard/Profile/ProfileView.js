// src/pages/Dashboard/Profile/ProfileView.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { minidenticon } from 'minidenticons';
import './ProfileView.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import HostReviews from '../../../components/HostReviews/HostReviews';

export function ProfileView() {
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState('community');

    const { userId, profileId } = useParams();
    const navigate = useNavigate();

    // Get current user from localStorage
    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setCurrentUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser || !profileId) return;

            try {
                setLoading(true);

                // First, get the user data
                const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/users/${profileId}`);
                setProfileUser(userResponse.data);

                // Then, get the profile data
                const profileResponse = await axios.get(`${process.env.REACT_APP_API_URL}/profiles/user/${profileId}`);
                setProfile(profileResponse.data);
                setLoading(false);
            } catch (profileErr) {
                // If profile doesn't exist, create one
                if (profileErr.response && profileErr.response.status === 404) {
                    console.log('Profile not found, creating default profile');
                    try {
                        // Create a default profile for the user
                        const newProfile = await axios.post(`${process.env.REACT_APP_API_URL}/profiles`, {
                            user_id: profileId,
                        });
                        setProfile(newProfile.data);
                        setLoading(false);
                    } catch (createErr) {
                        console.error('Error creating profile:', createErr);
                        setError('Failed to create profile for this user.');
                        setLoading(false);
                    }
                } else {
                    throw profileErr; // Re-throw if it's not a 404
                }
            }
        };

        fetchProfile();
    }, [currentUser, profileId]);

    // Generate identicon for avatar placeholder
    const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
        const svgURI = useMemo(
            () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
            [username, saturation, lightness]
        );
        return (<img src={svgURI} alt={username} {...props} />);
    };

    // Determine friendship status
    const getFriendshipStatus = () => {
        if (!currentUser || !profileUser) return 'none';

        // Convert ObjectIds to strings for comparison
        const friendIds = currentUser.friends.map(friend =>
            typeof friend === 'string' ? friend : friend._id
        );
        const pendingIds = currentUser.pendingRequests.map(req =>
            typeof req === 'string' ? req : req._id
        );
        const requestIds = currentUser.friendRequests.map(req =>
            typeof req === 'string' ? req : req._id
        );

        if (friendIds.includes(profileId)) return 'friends';
        if (pendingIds.includes(profileId)) return 'pending';
        if (requestIds.includes(profileId)) return 'request';
        return 'none';
    };

    // Handle friend request actions
    const handleFriendAction = async (action) => {
        try {
            setLoading(true);
            let endpoint = '';

            if (action === 'add') {
                endpoint = 'send-friend-request';
            } else if (action === 'remove') {
                endpoint = 'remove-friend';
            } else if (action === 'accept') {
                endpoint = 'accept-friend-request';
            } else if (action === 'reject') {
                endpoint = 'reject-friend-request';
            } else if (action === 'cancel') {
                endpoint = 'cancel-friend-request';
            }

            await axios.post(`${process.env.REACT_APP_API_URL}/${endpoint}`, {
                userId: currentUser._id,
                friendId: profileId
            });

            // Update current user in local storage
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/${currentUser._id}`);
            const updatedUser = response.data;
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setLoading(false);
        } catch (err) {
            console.error(`Error handling friend action (${action}):`, err);
            setError('Failed to process your request. Please try again.');
            setLoading(false);
        }
    };

    // Render friendship status button/controls
    const renderFriendshipControls = () => {
        const status = getFriendshipStatus();

        if (status === 'friends') {
            return (
                <button
                    className="friendship-button unfriend-button"
                    onClick={() => handleFriendAction('remove')}
                >
                    Remove Friend
                </button>
            );
        } else if (status === 'pending') {
            return (
                <button
                    className="friendship-button cancel-button"
                    onClick={() => handleFriendAction('cancel')}
                >
                    Cancel Friend Request
                </button>
            );
        } else if (status === 'request') {
            return (
                <div className="friendship-action-buttons">
                    <button
                        className="friendship-button accept-button"
                        onClick={() => handleFriendAction('accept')}
                    >
                        Accept Friend Request
                    </button>
                    <button
                        className="friendship-button reject-button"
                        onClick={() => handleFriendAction('reject')}
                    >
                        Reject Request
                    </button>
                </div>
            );
        } else {
            return (
                <button
                    className="friendship-button add-button"
                    onClick={() => handleFriendAction('add')}
                >
                    Add Friend
                </button>
            );
        }
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' },
        { title: 'Notifications', page: 'notifications' }
    ];

    // Format date function
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="dashboard">
            {currentUser && <Sidebar menus={menus} setPage={setPage} page={page} username={currentUser.username} />}
            <div className="logged-content-container">
                <div className="dashboard-heading">
                    <h1>User Profile</h1>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="profile-view-container">
                        <div className="profile-header">
                            <div className="profile-banner">
                                {profile?.banner_image ? (
                                    <img
                                        src={profile.banner_image}
                                        alt="Profile banner"
                                        className="banner-image"
                                    />
                                ) : (
                                    <div className="banner-placeholder">
                                        No banner image
                                    </div>
                                )}
                            </div>

                            <div className="profile-avatar-container">
                                {profile?.profile_image ? (
                                    <img
                                        src={profile.profile_image}
                                        alt="Profile avatar"
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <MinidenticonImg
                                        username={profileUser?.username || 'user'}
                                        className="profile-avatar identicon"
                                    />
                                )}
                            </div>

                            <div className="profile-name-container">
                                <h2>{profileUser?.names?.firstName} {profileUser?.names?.lastName}</h2>
                                <p className="username">@{profileUser?.username}</p>
                            </div>

                            {currentUser._id !== profileId && renderFriendshipControls()}
                        </div>

                        <div className="profile-details">
                            <div className="details-section">
                                <h3>Bio</h3>
                                <p className="bio-text">{profile?.bio || 'No bio added yet.'}</p>
                            </div>

                            {profile?.social_links && (
                                <div className="details-section">
                                    <h3>Social Links</h3>
                                    <div className="social-links">
                                        {profile.social_links.facebook && (
                                            <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Facebook
                                            </a>
                                        )}
                                        {profile.social_links.twitter && (
                                            <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Twitter
                                            </a>
                                        )}
                                        {profile.social_links.instagram && (
                                            <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Instagram
                                            </a>
                                        )}
                                        {profile.social_links.linkedin && (
                                            <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                                                LinkedIn
                                            </a>
                                        )}
                                        {!profile.social_links.facebook &&
                                            !profile.social_links.twitter &&
                                            !profile.social_links.instagram &&
                                            !profile.social_links.linkedin && (
                                                <p className="no-data">No social links added yet.</p>
                                            )}
                                    </div>
                                </div>
                            )}

                            {profile?.poker_preferences && (
                                <div className="details-section">
                                    <h3>Poker Preferences</h3>

                                    <div className="preference-item">
                                        <h4>Preferred Blinds</h4>
                                        <div className="blinds-tags">
                                            {profile.poker_preferences.preferred_blinds?.length > 0 ? (
                                                profile.poker_preferences.preferred_blinds.map(blind => (
                                                    <span key={blind} className="blinds-tag">
                                                        {blind}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="no-data">No preferred blinds selected.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="preference-item">
                                        <h4>Availability</h4>
                                        <div className="availability-tags">
                                            {profile.poker_preferences.availability?.weekdays && (
                                                <span className="availability-tag">Weekdays</span>
                                            )}
                                            {profile.poker_preferences.availability?.weeknights && (
                                                <span className="availability-tag">Weeknights</span>
                                            )}
                                            {profile.poker_preferences.availability?.weekends && (
                                                <span className="availability-tag">Weekends</span>
                                            )}
                                            {!profile.poker_preferences.availability?.weekdays &&
                                                !profile.poker_preferences.availability?.weeknights &&
                                                !profile.poker_preferences.availability?.weekends && (
                                                    <p className="no-data">No availability set.</p>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profile?.hostedGames?.length > 0 && (
                                <div className="details-section">
                                    <h3>Hosted Games</h3>
                                    <div className="hosted-games">
                                        <table className="games-table">
                                            <thead>
                                                <tr>
                                                    <th>Game</th>
                                                    <th>Date</th>
                                                    <th>Location</th>
                                                    <th>Blinds</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {profile.hostedGames.map(game => (
                                                    <tr key={game._id} onClick={() => navigate(`/dashboard/${userId}/games/game/${game._id}`)}>
                                                        <td>{game.game_name}</td>
                                                        <td>{formatDate(game.game_date)}</td>
                                                        <td>{game.location}</td>
                                                        <td>{game.blinds}</td>
                                                        <td>
                                                            <span className={`status-tag ${game.game_status}`}>
                                                                {game.game_status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Host Reviews Section */}
                            {profileUser && profileUser._id && (
                                <HostReviews hostId={profileId} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileView;