import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './GroupsTab.css';
import GroupCard from '../GroupCard/GroupCard';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal';

const GroupsTab = ({ user }) => {
    const [groups, setGroups] = useState([]);
    const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [filterGroupsBy, setFilterGroupsBy] = useState('all'); // all, my-groups, joined

    const fetchGroups = useCallback(async () => {
        if (!user) return;

        try {
            let endpoint;
            let params = {};

            if (filterGroupsBy === 'my-groups') {
                // Fetch groups where the user is admin
                params = { admin_id: user._id, userId: user._id };
                endpoint = '/groups';
            } else if (filterGroupsBy === 'joined') {
                // Fetch groups where the user is a member
                endpoint = `/groups/user/${user._id}`;
                params = { membership_status: 'accepted' };
            } else {
                // Fetch all public groups + groups where user is a member
                endpoint = '/groups';
                params = { is_public: true, userId: user._id };
            }

            const res = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`, { params });
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }, [user, filterGroupsBy]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleGroupCreated = () => {
        // Refresh the groups list
        fetchGroups();
    };

    const getEmptyMessage = () => {
        if (filterGroupsBy === 'my-groups') return 'You haven\'t created any groups yet';
        if (filterGroupsBy === 'joined') return 'You haven\'t joined any groups yet';
        return 'There are no public groups available';
    };

    return (
        <div className="groups-container">
            <div className="groups-actions">
                <button
                    className="create-group-button"
                    onClick={() => setCreateGroupModalOpen(true)}
                >
                    + Create New Group
                </button>

                <div className="groups-filter">
                    <button
                        className={`filter-button ${filterGroupsBy === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterGroupsBy('all')}
                    >
                        All Groups
                    </button>
                    <button
                        className={`filter-button ${filterGroupsBy === 'my-groups' ? 'active' : ''}`}
                        onClick={() => setFilterGroupsBy('my-groups')}
                    >
                        My Groups
                    </button>
                    <button
                        className={`filter-button ${filterGroupsBy === 'joined' ? 'active' : ''}`}
                        onClick={() => setFilterGroupsBy('joined')}
                    >
                        Joined Groups
                    </button>
                </div>
            </div>

            <div className="groups-list">
                {groups.length > 0 ? (
                    groups.map(group => (
                        <GroupCard
                            key={group._id}
                            group={group}
                            user={user}
                        />
                    ))
                ) : (
                    <p className="no-groups-message">{getEmptyMessage()}</p>
                )}
            </div>

            <CreateGroupModal
                open={createGroupModalOpen}
                onClose={() => setCreateGroupModalOpen(false)}
                user={user}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
};

export default GroupsTab;