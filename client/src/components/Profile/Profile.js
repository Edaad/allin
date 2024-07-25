import React, { useMemo } from "react";
import './Profile.css';
import { minidenticon } from 'minidenticons';
import axios from 'axios';

const Profile = ({ data, size, currentUser, refreshData, updateUserState }) => {
    if (!data || !data.username) {
        return null;
    }

    const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
        const svgURI = useMemo(
            () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
            [username, saturation, lightness]
        );
        return (<img src={svgURI} alt={username} {...props} />);
    };

    const updateLocalStorage = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/users/${currentUser._id}`);
            const updatedUser = response.data;
            updateUserState(updatedUser);
        } catch (error) {
            console.error('Error updating local storage:', error);
        }
    };

    const handleFriendRequest = async (action) => {
        try {
            await axios.post(`http://localhost:3001/${action}-friend-request`, {
                userId: currentUser._id,
                friendId: data._id
            });
            await updateLocalStorage();
        } catch (error) {
            console.error(`Error ${action} friend request:`, error);
        }
    };

    const handleRemoveFriend = async () => {
        try {
            await axios.post(`http://localhost:3001/remove-friend`, {
                userId: currentUser._id,
                friendId: data._id
            });
            await updateLocalStorage();
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    const getButton = () => {
        if (!currentUser || !Array.isArray(currentUser.friends) || !Array.isArray(currentUser.pendingRequests) || !Array.isArray(currentUser.friendRequests)) {
            console.log('User data missing or malformed:', currentUser);
            return null;  // Avoid errors if properties are undefined
        }

        const isPendingRequest = currentUser.pendingRequests.some(req => req._id === data._id);
        const isFriendRequest = currentUser.friendRequests.some(req => req._id === data._id);
        const isFriend = currentUser.friends.some(friend => friend._id === data._id);

        if (isFriend) {
            return <button onClick={handleRemoveFriend} className={`profile-button${size === "compact" ? "-compact" : ""}`}>- Remove Friend</button>;
        }
        if (isPendingRequest) {
            return <button onClick={() => handleFriendRequest('cancel')} className={`profile-button${size === "compact" ? "-compact" : ""}`}>Cancel Request</button>;
        }
        if (isFriendRequest) {
            return (
                <div>
                    <button onClick={() => handleFriendRequest('accept')} className={`profile-button${size === "compact" ? "-compact" : ""}`}>Accept</button>
                    <button onClick={() => handleFriendRequest('reject')} className={`profile-button${size === "compact" ? "-compact" : ""}`}>Reject</button>
                </div>
            );
        }
        return <button onClick={() => handleFriendRequest('send')} className={`profile-button${size === "compact" ? "-compact" : ""}`}>+ Add Friend</button>;
    };

    return (
        <>
            <div className={`profile-container${size === "compact" ? "-compact" : ""}`}>
                <MinidenticonImg className={`profile-picture${size === "compact" ? "-compact" : ""}`} username={data.username} />
                <div className={`profile-details-wrapper${size === "compact" ? "-compact" : ""}`}>
                    <div className={`profile-details-container${size === "compact" ? "-compact" : ""}`}>
                        <span className={`profile-username${size === "compact" ? "-compact" : ""}`}>{data.username}</span>
                        <span className={`profile-name${size === "compact" ? "-compact" : ""}`}>{data.names.firstName} {data.names.lastName}</span>
                        <span className={`profile-email${size === "compact" ? "-compact" : ""}`}>{data.email}</span>
                    </div>
                    {getButton()}
                </div>
            </div>
        </>
    );
};

export default Profile;
