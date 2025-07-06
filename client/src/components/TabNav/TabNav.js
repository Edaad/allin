import React from 'react';
import './TabNav.css';

/**
 * Reusable tab navigation component styled to match Community page
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {function} props.onTabChange - Function to call when tab is changed
 * @param {Array} props.tabs - Array of tab objects: [{id: 'tab1', label: 'Tab 1'}, ...]
 */
const TabNav = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="tab-container">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabNav;