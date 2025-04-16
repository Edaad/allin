import React, { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';
import './UsersTab.css';
import Input from '../Input/Input';
import Profile from '../Profile/Profile';

const UsersTab = ({ user, activeTab }) => {
    const [query, setQuery] = useState("");
    const [data, setData] = useState([]);

    const fetchData = useMemo(
        () =>
            debounce(async (searchQuery) => {
                if (!user) return;

                try {
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                        params: {
                            query: searchQuery.length >= 3 ? searchQuery : '',
                            tab: activeTab,
                            userId: user._id,
                        },
                    });
                    setData(res.data);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }, 200),
        [user, activeTab]
    );

    useEffect(() => {
        fetchData(query);
        return () => fetchData.cancel();
    }, [query, activeTab, fetchData]);

    const updateUserState = (updatedUser) => {
        // This is passed to Profile component
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'Friends':
                return 'You currently have no friends';
            case 'PendingRequests':
                return 'You currently have no pending requests';
            case 'Invitations':
                return 'You currently have no invitations';
            case 'All':
                return '';
            default:
                return '';
        }
    };

    const getNoUserFoundMessage = () => {
        switch (activeTab) {
            case 'Friends':
                return 'There are no friends that match your search';
            case 'PendingRequests':
                return 'There are no pending requests that match your search';
            case 'Invitations':
                return 'There are no invitations that match your search';
            case 'All':
                return 'There are no members in the community that match your search';
            default:
                return '';
        }
    };

    return (
        <>
            <Input
                name='search'
                type='text'
                placeholder='Search for members in the community by their name or username..'
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className='all-profiles-container'>
                {data.filter(item => item._id !== user?._id).length > 0 ? (
                    data.filter(item => item._id !== user?._id).map((item) => (
                        <Profile
                            key={item._id}
                            data={item}
                            currentUser={user}
                            refreshData={() => fetchData(query)}
                            updateUserState={updateUserState}
                        />
                    ))
                ) : (
                    <p>{!query && getEmptyMessage()}{query && getNoUserFoundMessage()}</p>
                )}
            </div>
        </>
    );
};

export default UsersTab;