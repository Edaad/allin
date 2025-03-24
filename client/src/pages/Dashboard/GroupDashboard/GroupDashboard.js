// src/pages/Dashboard/GroupDashboard/GroupDashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './GroupDashboard.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Input from '../../../components/Input/Input';
import Profile from '../../../components/Profile/Profile';
import RejectModal from '../../../components/RejectModal/RejectModal';

export function GroupDashboard() {
    const [user, setUser] = useState(null);
    const { userId, groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [editing, setEditing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
        profile_image: '',
        banner_image: '',
        isPublic: false
    });
    const [members, setMembers] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequesterId, setSelectedRequesterId] = useState(null);
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [requestSent, setRequestSent] = useState(false);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedUser = JSON.parse(localStorage.getItem('user'));
                if (loggedUser && loggedUser._id === userId) {
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`);
                    setUser(res.data);
                    setFriends(res.data.friends || []);
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

    // Fetch group members
    const fetchMembers = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/group-members/${groupId}`);
            setMembers(res.data);

            // Check if the current user is a member
            const isUserMember = res.data.some(
                (member) => member.user_id._id === userId && member.membership_status === 'accepted'
            );
            setIsMember(isUserMember);
        } catch (error) {
            console.error('Error fetching group members:', error);
        }
    }, [groupId, userId]);

    // Fetch join requests
    const fetchJoinRequests = useCallback(async () => {
        if (!group || !user || !isAdmin) return;

        try {
            setIsLoadingRequests(true);
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/group-members/requests/${groupId}`,
                { params: { adminId: user._id } }
            );
            setJoinRequests(res.data);
            setIsLoadingRequests(false);
        } catch (error) {
            console.error('Error fetching join requests:', error);
            setIsLoadingRequests(false);
        }
    }, [groupId, group, user, isAdmin]);

    // Fetch group data
    const fetchGroup = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/groups/${groupId}`);
            const groupData = res.data;
            setGroup(groupData);

            setGroupForm({
                name: groupData.group_name,
                description: groupData.description || '',
                profile_image: groupData.profile_image || '',
                banner_image: groupData.banner_image || '',
                isPublic: groupData.is_public
            });

            // Fetch members after fetching the group details
            fetchMembers();
        } catch (error) {
            console.error('Error fetching group:', error);
        }
    }, [groupId, fetchMembers]);

    // Initial data load
    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    // Check if user is admin
    useEffect(() => {
        if (user && group) {
            setIsAdmin(user._id === group.admin_id._id);
        }
    }, [user, group]);

    // Fetch join requests when needed
    useEffect(() => {
        if (isAdmin && group && group.is_public) {
            fetchJoinRequests();
        }
    }, [isAdmin, group, fetchJoinRequests]);

    // Form input handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGroupForm({ ...groupForm, [name]: value });
    };

    const handlePrivacyChange = (isPublic) => {
        setGroupForm({ ...groupForm, isPublic });
    };

    // Handle friend selection for invites
    const handleCheckboxChange = (e, friend) => {
        if (e.target.checked) {
            setSelectedFriends([...selectedFriends, friend]);
        } else {
            setSelectedFriends(selectedFriends.filter(f => f._id !== friend._id));
        }
    };

    // Send invitations to friends
    const handleSendInvites = async () => {
        try {
            const inviteeIds = selectedFriends.map(friend => friend._id);
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/send-invitations`, {
                groupId,
                adminId: user._id,
                inviteeIds
            });
            setSelectedFriends([]);
            fetchMembers();
        } catch (error) {
            console.error('Error sending invitations:', error);
        }
    };

    // Handle updating group details
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updatedGroup = {
                group_name: groupForm.name,
                description: groupForm.description,
                profile_image: groupForm.profile_image,
                banner_image: groupForm.banner_image,
                is_public: groupForm.isPublic
            };

            await axios.put(`${process.env.REACT_APP_API_URL}/groups/${groupId}`, updatedGroup);
            setEditing(false);
            fetchGroup();
        } catch (error) {
            console.error('Error updating group:', error);
        }
    };

    // Handle deleting group
    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this group?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/groups/${groupId}`, {
                data: { userId: user._id } // Send userId in the request body
            });
            navigate(`/dashboard/${userId}/community`);
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    // Handle edit mode toggle
    const handleEdit = () => {
        if (isAdmin) {
            setEditing(true);
        } else {
            alert("Only the admin can edit this group.");
        }
    };

    // Handle removing a member
    const handleRemoveMember = async (memberId) => {
        const confirmRemove = window.confirm("Are you sure you want to remove this member?");
        if (!confirmRemove) return;

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/remove-member`, {
                groupId: groupId,
                adminId: user._id,
                memberId: memberId,
            });
            fetchMembers();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    // Handle leave group
    const handleLeaveGroup = async () => {
        const confirmLeave = window.confirm("Are you sure you want to leave this group?");
        if (!confirmLeave) return;

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/remove-member`, {
                groupId: groupId,
                adminId: user._id, // In this context, adminId is the user making the request
                memberId: user._id,
            });
            navigate(`/dashboard/${userId}/community`);
        } catch (error) {
            console.error('Error leaving group:', error);
        }
    };

    // Handle accepting join request
    const handleAcceptRequest = async (requesterId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/accept-invitation`, {
                userId: user._id,  // Admin ID
                groupId: groupId,
                requesterId: requesterId
            });
            fetchJoinRequests();
            fetchMembers();
        } catch (error) {
            console.error('Error accepting join request:', error);
        }
    };

    // Open reject modal for a join request
    const openRejectModal = (requesterId) => {
        setSelectedRequesterId(requesterId);
        setRejectModalOpen(true);
    };

    // Handle rejecting join request
    const handleRejectRequest = async () => {
        if (!rejectReason.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/reject-request`, {
                adminId: user._id,
                groupId: groupId,
                requesterId: selectedRequesterId,
                reason: rejectReason,
            });
            setRejectModalOpen(false);
            setRejectReason('');
            fetchJoinRequests();
        } catch (error) {
            console.error('Error rejecting join request:', error);
        }
    };

    // Handle canceling invitation
    const handleCancelInvite = async (inviteeId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/cancel-invitation`, {
                groupId: groupId,
                adminId: user._id,
                inviteeId: inviteeId,
            });
            fetchMembers();
        } catch (error) {
            console.error('Error canceling invitation:', error);
        }
    };

    // Handle request to join public group
    // Update the handleRequestToJoin function in GroupDashboard.js
    const handleRequestToJoin = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/group-members/request-to-join`, {
                userId: user._id,
                groupId: groupId
            });

            // Instead of fetching the group again, manually update the state
            setGroup(prevGroup => ({
                ...prevGroup,
                membershipStatus: 'requested'
            }));

            // Disable the request button by updating a local state variable
            setRequestSent(true);

        } catch (error) {
            console.error('Error requesting to join group:', error);
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

    if (!group || !user) {
        return <div>Loading...</div>;
    }

    // Separate members by status
    const acceptedMembers = members.filter(member => member.membership_status === 'accepted');
    const pendingMembers = members.filter(member => member.membership_status === 'pending');

    // Filter available friends (those who aren't already members or invited)
    const memberIds = members.map(member => member.user_id._id);
    const availableFriends = friends.filter(friend => !memberIds.includes(friend._id));

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={() => { }} page="community" username={user.username} />
            <div className='logged-content-container group-dashboard'>
                <div className='dashboard-heading'>
                    <h1>
                        {group.group_name}
                        {group.is_public && <span className="group-type-tag public">Public</span>}
                        {!group.is_public && <span className="group-type-tag private">Private</span>}
                    </h1>
                    <div className='buttons'>
                        {editing ? (
                            <>
                                {isAdmin && <button className="save" onClick={handleUpdate}>Save</button>}
                                {isAdmin && <button className="cancel" onClick={() => setEditing(false)}>Cancel</button>}
                            </>
                        ) : (
                            <>
                                {isAdmin && <button className="edit" onClick={handleEdit}>Edit Group</button>}
                                {isAdmin && <button className="delete" onClick={handleDelete}>Delete</button>}
                                {!isAdmin && isMember && (
                                    <button className="leave-group" onClick={handleLeaveGroup}>Leave Group</button>
                                )}
                                {!isAdmin && !isMember && group.is_public && (
                                    requestSent || group.membershipStatus === 'requested' ? (
                                        <span className="status-tag requested">Request Pending</span>
                                    ) : (
                                        <button className="request-button" onClick={handleRequestToJoin}>
                                            Request to Join
                                        </button>
                                    )
                                )}
                                <button className="back" onClick={() => navigate(-1)}>Back</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Group Banner Image */}
                {group.banner_image && (
                    <div className="group-banner">
                        <img src={group.banner_image} alt={`${group.group_name} banner`} />
                    </div>
                )}

                <div className='group-dashboard-container'>
                    <div className='group-info-section'>
                        <div className='summary-header'>
                            <h2>Group Information</h2>
                        </div>
                        {editing ? (
                            <form className='group-edit-form'>
                                <Input
                                    name='name'
                                    type='text'
                                    label='Group Name'
                                    placeholder='Enter group name'
                                    value={groupForm.name}
                                    onChange={handleInputChange}
                                />

                                <div className='textarea-container'>
                                    <label htmlFor='description' className='input-label'>Description</label>
                                    <textarea
                                        name='description'
                                        id='description'
                                        rows='4'
                                        value={groupForm.description}
                                        onChange={handleInputChange}
                                        placeholder='Enter group description...'
                                    />
                                </div>

                                <Input
                                    name='profile_image'
                                    type='text'
                                    label='Profile Image URL'
                                    placeholder='Enter profile image URL'
                                    value={groupForm.profile_image}
                                    onChange={handleInputChange}
                                />

                                <Input
                                    name='banner_image'
                                    type='text'
                                    label='Banner Image URL'
                                    placeholder='Enter banner image URL'
                                    value={groupForm.banner_image}
                                    onChange={handleInputChange}
                                />

                                <div className="group-privacy-option">
                                    <label className="input-label">Group Privacy</label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="isPublic"
                                                value="false"
                                                checked={!groupForm.isPublic}
                                                onChange={() => handlePrivacyChange(false)}
                                            />
                                            Private (invite only)
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="isPublic"
                                                value="true"
                                                checked={groupForm.isPublic}
                                                onChange={() => handlePrivacyChange(true)}
                                            />
                                            Public (open to join requests)
                                        </label>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className='group-details'>
                                <div className='group-profile'>
                                    {group.profile_image && (
                                        <img
                                            src={group.profile_image}
                                            alt={`${group.group_name} profile`}
                                            className="group-profile-image"
                                        />
                                    )}
                                </div>

                                <div className='detail-item'>
                                    <span className='detail-label'>Admin: </span>
                                    <span className='detail-value'>{group.admin_id.username}</span>
                                </div>

                                <div className='detail-item'>
                                    <span className='detail-label'>Group Type: </span>
                                    <span className='detail-value'>
                                        {group.is_public ? 'Public (open to join requests)' : 'Private (invite only)'}
                                    </span>
                                </div>

                                <div className='detail-item'>
                                    <span className='detail-label'>Description: </span>
                                    <div className='detail-value description-value'>
                                        {group.description || 'No description provided'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='members-section'>
                        <div className='summary-header'>
                            <h2>Members</h2>
                        </div>
                        {editing && isAdmin ? (
                            <div className="invite-friends-container">
                                <h3>Invite Friends</h3>
                                {availableFriends.length > 0 ? (
                                    <div className="invite-friends-list">
                                        {availableFriends.map(friend => (
                                            <div key={friend._id} className="invite-friend-item">
                                                <label htmlFor={friend._id} className="friend-label">
                                                    <input
                                                        type="checkbox"
                                                        id={friend._id}
                                                        onChange={(e) => handleCheckboxChange(e, friend)}
                                                        checked={selectedFriends.some(f => f._id === friend._id)}
                                                    />
                                                    <Profile data={friend} size="compact" />
                                                </label>
                                            </div>
                                        ))}
                                        <button
                                            className="invite-button"
                                            onClick={handleSendInvites}
                                            disabled={selectedFriends.length === 0}
                                        >
                                            Send Invitations
                                        </button>
                                    </div>
                                ) : (
                                    <div>No available friends to invite</div>
                                )}
                            </div>
                        ) : (
                            <div className='members-list'>
                                {acceptedMembers.length > 0 ? (
                                    <div className='all-profiles-container'>
                                        {acceptedMembers.map(member => (
                                            <Profile
                                                key={member._id}
                                                data={member.user_id}
                                                size={"compact"}
                                                action={isAdmin && member.user_id._id !== user._id ? "removeMember" : null}
                                                onAction={() => handleRemoveMember(member.user_id._id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div>No members in this group</div>
                                )}

                                {pendingMembers.length > 0 && isAdmin && (
                                    <>
                                        <h3>Pending Invitations</h3>
                                        <div className='all-profiles-container'>
                                            {pendingMembers.map(member => (
                                                <Profile
                                                    key={member._id}
                                                    data={member.user_id}
                                                    size={"compact"}
                                                    action="cancelInvitation"
                                                    onAction={() => handleCancelInvite(member.user_id._id)}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Join Requests Section for Public Groups */}
                                {isAdmin && group.is_public && (
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
                                                        </div>
                                                        <div className="join-request-actions">
                                                            <button
                                                                className="accept-button small"
                                                                onClick={() => handleAcceptRequest(request.user_id._id)}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="decline-button small"
                                                                onClick={() => openRejectModal(request.user_id._id)}
                                                            >
                                                                Decline
                                                            </button>
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
                </div>

                {/* Rejection Modal */}
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
    );
}

export default GroupDashboard;