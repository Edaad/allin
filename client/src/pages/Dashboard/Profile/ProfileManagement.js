// src/pages/Dashboard/Profile/ProfileManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { minidenticon } from 'minidenticons';
import './ProfileManagement.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import { Accordion, AccordionItem } from '../../../components/Accordion/Accordion';

export function ProfileManagement() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editing, setEditing] = useState(false);
    const [page, setPage] = useState('account');

    // Form states
    const [form, setForm] = useState({
        bio: '',
        social_links: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
        },
        poker_preferences: {
            preferred_blinds: [],
            availability: {
                weekdays: false,
                weeknights: false,
                weekends: false
            }
        }
    });

    const { userId } = useParams();
    const navigate = useNavigate();

    // Get actual user from localStorage
    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/profiles/user/${userId}`);
                setProfile(response.data);
                
                // Initialize form with profile data
                setForm({
                    bio: response.data.bio || '',
                    social_links: {
                        facebook: response.data.social_links?.facebook || '',
                        twitter: response.data.social_links?.twitter || '',
                        instagram: response.data.social_links?.instagram || '',
                        linkedin: response.data.social_links?.linkedin || ''
                    },
                    poker_preferences: {
                        preferred_blinds: response.data.poker_preferences?.preferred_blinds || [],
                        availability: {
                            weekdays: response.data.poker_preferences?.availability?.weekdays || false,
                            weeknights: response.data.poker_preferences?.availability?.weeknights || false,
                            weekends: response.data.poker_preferences?.availability?.weekends || false
                        }
                    }
                });
                setLoading(false);
            } catch (err) {
                console.error('Error fetching profile:', err);
                
                // If profile doesn't exist, we'll create one
                if (err.response && err.response.status === 404) {
                    try {
                        const newProfile = await axios.post(`${process.env.REACT_APP_API_URL}/profiles`, {
                            user_id: userId
                        });
                        setProfile(newProfile.data);
                        setLoading(false);
                    } catch (createErr) {
                        console.error('Error creating profile:', createErr);
                        setError('Failed to create profile. Please try refreshing the page.');
                        setLoading(false);
                    }
                } else {
                    setError('Failed to load profile data. Please try refreshing the page.');
                    setLoading(false);
                }
            }
        };

        fetchProfile();
    }, [user, userId]);

    // Generate identicon for avatar placeholder
    const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
        const svgURI = useMemo(
            () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
            [username, saturation, lightness]
        );
        return (<img src={svgURI} alt={username} {...props} />);
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setForm(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle checkbox changes for availability
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        const [parent, grandparent, child] = name.split('.');
        
        setForm(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [grandparent]: {
                    ...prev[parent][grandparent],
                    [child]: checked
                }
            }
        }));
    };

    // Handle blinds selection
    const handleBlindsChange = (e) => {
        const { value, checked } = e.target;
        
        setForm(prev => {
            const currentBlinds = [...prev.poker_preferences.preferred_blinds];
            
            if (checked) {
                return {
                    ...prev,
                    poker_preferences: {
                        ...prev.poker_preferences,
                        preferred_blinds: [...currentBlinds, value]
                    }
                };
            } else {
                return {
                    ...prev,
                    poker_preferences: {
                        ...prev.poker_preferences,
                        preferred_blinds: currentBlinds.filter(blind => blind !== value)
                    }
                };
            }
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/profiles/${userId}`, {
                ...form,
                userId: userId // For security check in backend
            });
            
            setProfile(response.data);
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setLoading(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
            setLoading(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (type, imageUrl) => {
        try {
            setLoading(true);
            const response = await axios.patch(`${process.env.REACT_APP_API_URL}/profiles/${userId}/image`, {
                imageUrl,
                type, // 'profile' or 'banner'
                userId
            });
            
            setProfile(response.data.profile);
            setSuccess(`${type === 'profile' ? 'Profile' : 'Banner'} image updated successfully!`);
            setLoading(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            console.error(`Error updating ${type} image:`, err);
            setError(`Failed to update ${type} image. Please try again.`);
            setLoading(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        // Reset form to current profile data
        setForm({
            bio: profile.bio || '',
            social_links: {
                facebook: profile.social_links?.facebook || '',
                twitter: profile.social_links?.twitter || '',
                instagram: profile.social_links?.instagram || '',
                linkedin: profile.social_links?.linkedin || ''
            },
            poker_preferences: {
                preferred_blinds: profile.poker_preferences?.preferred_blinds || [],
                availability: {
                    weekdays: profile.poker_preferences?.availability?.weekdays || false,
                    weeknights: profile.poker_preferences?.availability?.weeknights || false,
                    weekends: profile.poker_preferences?.availability?.weekends || false
                }
            }
        });
        setEditing(false);
        setError(null);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' },
        { title: 'Notifications', page: 'notifications' }
    ];

    const BLINDS_OPTIONS = [
        "0.05/0.1",
        "0.1/0.2",
        "0.5/1",
        "1/2",
        "1/3",
        "2/5",
        "5/10",
    ];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className="logged-content-container">
                <div className="dashboard-heading">
                    <h1>Profile Management</h1>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="profile-management-container">
                        {success && <div className="success-message">{success}</div>}

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
                                        <button 
                                            className="upload-banner-button"
                                            onClick={() => {
                                                const url = window.prompt('Enter image URL for banner:');
                                                if (url) handleImageUpload('banner', url);
                                            }}
                                        >
                                            Upload Banner Image
                                        </button>
                                    </div>
                                )}
                                {profile?.banner_image && (
                                    <button 
                                        className="change-banner-button"
                                        onClick={() => {
                                            const url = window.prompt('Enter new image URL for banner:');
                                            if (url) handleImageUpload('banner', url);
                                        }}
                                    >
                                        Change Banner
                                    </button>
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
                                        username={user?.username || 'user'} 
                                        className="profile-avatar identicon" 
                                    />
                                )}
                                <button 
                                    className="change-avatar-button"
                                    onClick={() => {
                                        const url = window.prompt('Enter image URL for profile:');
                                        if (url) handleImageUpload('profile', url);
                                    }}
                                >
                                    {profile?.profile_image ? 'Change' : 'Upload'} Avatar
                                </button>
                            </div>

                            <div className="profile-name-container">
                                <h2>{user?.names?.firstName} {user?.names?.lastName}</h2>
                                <p className="username">@{user?.username}</p>
                            </div>

                            {!editing && (
                                <button 
                                    className="edit-profile-button"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-section">
                                    <h3>Bio</h3>
                                    <textarea
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                        rows="4"
                                        className="bio-textarea"
                                    />
                                </div>

                                <div className="form-section">
                                    <h3>Social Links</h3>
                                    <Input
                                        name="social_links.facebook"
                                        type="text"
                                        label="Facebook"
                                        placeholder="Your Facebook profile URL"
                                        value={form.social_links.facebook}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        name="social_links.twitter"
                                        type="text"
                                        label="Twitter"
                                        placeholder="Your Twitter profile URL"
                                        value={form.social_links.twitter}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        name="social_links.instagram"
                                        type="text"
                                        label="Instagram"
                                        placeholder="Your Instagram profile URL"
                                        value={form.social_links.instagram}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        name="social_links.linkedin"
                                        type="text"
                                        label="LinkedIn"
                                        placeholder="Your LinkedIn profile URL"
                                        value={form.social_links.linkedin}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-section">
                                    <h3>Poker Preferences</h3>
                                    
                                    <div className="blinds-selection">
                                        <label className="input-label">Preferred Blinds</label>
                                        <div className="blinds-options">
                                            {BLINDS_OPTIONS.map(blind => (
                                                <label key={blind} className="blinds-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        name={`blind-${blind}`}
                                                        value={blind}
                                                        checked={form.poker_preferences.preferred_blinds.includes(blind)}
                                                        onChange={handleBlindsChange}
                                                    />
                                                    {blind}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="availability-selection">
                                        <label className="input-label">Availability</label>
                                        <div className="availability-options">
                                            <label className="availability-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    name="poker_preferences.availability.weekdays"
                                                    checked={form.poker_preferences.availability.weekdays}
                                                    onChange={handleCheckboxChange}
                                                />
                                                Weekdays
                                            </label>
                                            <label className="availability-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    name="poker_preferences.availability.weeknights"
                                                    checked={form.poker_preferences.availability.weeknights}
                                                    onChange={handleCheckboxChange}
                                                />
                                                Weeknights
                                            </label>
                                            <label className="availability-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    name="poker_preferences.availability.weekends"
                                                    checked={form.poker_preferences.availability.weekends}
                                                    onChange={handleCheckboxChange}
                                                />
                                                Weekends
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-button" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" className="cancel-button" onClick={handleCancel}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details">
                                <div className="details-section">
                                    <h3>Bio</h3>
                                    <p className="bio-text">{profile?.bio || 'No bio added yet.'}</p>
                                </div>

                                <div className="details-section">
                                    <h3>Social Links</h3>
                                    <div className="social-links">
                                        {profile?.social_links?.facebook && (
                                            <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Facebook
                                            </a>
                                        )}
                                        {profile?.social_links?.twitter && (
                                            <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Twitter
                                            </a>
                                        )}
                                        {profile?.social_links?.instagram && (
                                            <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                                                Instagram
                                            </a>
                                        )}
                                        {profile?.social_links?.linkedin && (
                                            <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                                                LinkedIn
                                            </a>
                                        )}
                                        {!profile?.social_links?.facebook && 
                                         !profile?.social_links?.twitter && 
                                         !profile?.social_links?.instagram && 
                                         !profile?.social_links?.linkedin && (
                                            <p className="no-data">No social links added yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h3>Poker Preferences</h3>
                                    
                                    <div className="preference-item">
                                        <h4>Preferred Blinds</h4>
                                        <div className="blinds-tags">
                                            {profile?.poker_preferences?.preferred_blinds?.length > 0 ? (
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
                                            {profile?.poker_preferences?.availability?.weekdays && (
                                                <span className="availability-tag">Weekdays</span>
                                            )}
                                            {profile?.poker_preferences?.availability?.weeknights && (
                                                <span className="availability-tag">Weeknights</span>
                                            )}
                                            {profile?.poker_preferences?.availability?.weekends && (
                                                <span className="availability-tag">Weekends</span>
                                            )}
                                            {!profile?.poker_preferences?.availability?.weekdays && 
                                             !profile?.poker_preferences?.availability?.weeknights && 
                                             !profile?.poker_preferences?.availability?.weekends && (
                                                <p className="no-data">No availability set.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

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
                                                            <td>{new Date(game.game_date).toLocaleDateString()}</td>
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
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileManagement;