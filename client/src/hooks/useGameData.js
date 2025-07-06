import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * Format filters for API
 */
const formatFiltersForAPI = (filters) => {
    if (!filters) return {};

    const formattedFilters = { ...filters };

    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
        formattedFilters.dateRange = JSON.stringify(filters.dateRange);
    }

    if (filters.handed && (filters.handed.min !== undefined || filters.handed.max !== undefined)) {
        formattedFilters.handed = JSON.stringify(filters.handed);
    }

    return formattedFilters;
};

/**
 * Custom hook to handle games data fetching and state management
 */
export const useGameData = (user, initialTab = "Public Games") => {
    const [tab, setTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState([]);
    const [waitlistPositions, setWaitlistPositions] = useState({});
    const [filterParams, setFilterParams] = useState({});

    // Track the request ID to handle race conditions
    const currentRequestIdRef = useRef(0);

    // Using a ref to track previous tab to prevent unnecessary re-fetching
    const prevTabRef = useRef(tab);

    // Track if this is first load
    const isInitialLoadRef = useRef(true);

    // Default filters for each tab
    const [tabFilters, setTabFilters] = useState({
        "Public Games": {
            blinds: [],
            handed: { min: 2, max: 10 },
            dateRange: { startDate: getCurrentDate(), endDate: "" },
            timeRange: { startTime: "", endTime: "" },
        },
        "Requested Games": {
            blinds: [],
            handed: { min: 2, max: 10 },
            dateRange: { startDate: getCurrentDate(), endDate: "" },
            timeRange: { startTime: "", endTime: "" },
        },
        "Invitations": {
            // No filters needed for invitations
        },
        "Upcoming Games": {
            blinds: [],
            handed: { min: 2, max: 10 },
            dateRange: { startDate: getCurrentDate(), endDate: "" }, // Updated to use current date
            timeRange: { startTime: "", endTime: "" },
        },
        "Past Games": {
            blinds: [],
            handed: { min: 2, max: 10 },
            dateRange: { startDate: "", endDate: "" },
            timeRange: { startTime: "", endTime: "" },
        },
    });

    // Fetch waitlist position for a specific game
    const fetchWaitlistPosition = useCallback(async (gameId, requestId) => {
        if (!user || currentRequestIdRef.current !== requestId) return;

        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/players/waitlist/${gameId}/${user._id}`
            );

            // Only update state if this is still the current request
            if (currentRequestIdRef.current === requestId) {
                setWaitlistPositions(prev => ({
                    ...prev,
                    [gameId]: res.data.position,
                }));
            }
        } catch (error) {
            console.error("Error fetching waitlist position:", error);
        }
    }, [user]);

    // Fetch games based on current tab and filters
    const fetchGames = useCallback(async () => {
        if (!user) return;

        // Generate a new request ID to track this specific request
        const requestId = Date.now();
        currentRequestIdRef.current = requestId;

        setLoading(true);

        try {
            let result = [];

            switch (tab) {
                case "Public Games":
                    const publicParams = {
                        status: "upcoming",
                        is_public: true,
                        userId: user._id,
                        ...filterParams,
                    };

                    const publicRes = await axios.get(
                        `${process.env.REACT_APP_API_URL}/games`,
                        { params: publicParams }
                    );

                    // Make sure this is still the current request
                    if (currentRequestIdRef.current !== requestId) return;

                    // Process each game to get player counts
                    result = await Promise.all(
                        publicRes.data.map(async (game) => {
                            try {
                                // Skip processing if the request is no longer current
                                if (currentRequestIdRef.current !== requestId) return game;

                                const playersRes = await axios.get(
                                    `${process.env.REACT_APP_API_URL}/players/game/${game._id}`
                                );

                                // Skip processing if the request is no longer current
                                if (currentRequestIdRef.current !== requestId) return game;

                                const acceptedPlayers = playersRes.data.filter(
                                    p => p.invitation_status === "accepted"
                                );

                                if (game.playerStatus === "waitlist") {
                                    // Pass the request ID to ensure we only update for the current request
                                    await fetchWaitlistPosition(game._id, requestId);
                                }

                                return {
                                    ...game,
                                    acceptedPlayersCount: acceptedPlayers.length,
                                };
                            } catch (err) {
                                console.error(`Error fetching players for game ${game._id}:`, err);
                                return game;
                            }
                        })
                    );
                    break;

                case "Requested Games":
                    const requestedParams = {
                        ...filterParams,
                    };

                    const requestedRes = await axios.get(
                        `${process.env.REACT_APP_API_URL}/requested/${user._id}`,
                        { params: requestedParams }
                    );

                    // Make sure this is still the current request
                    if (currentRequestIdRef.current !== requestId) return;

                    // Filter out any games where user is the host
                    result = requestedRes.data.filter(game =>
                        game.host_id && game.host_id._id !== user._id
                    );
                    break;

                case "Invitations":
                    const invitationsRes = await axios.get(
                        `${process.env.REACT_APP_API_URL}/players/invitations/${user._id}`
                    );

                    // Make sure this is still the current request
                    if (currentRequestIdRef.current !== requestId) return;

                    result = invitationsRes.data;
                    break;

                case "Upcoming Games":
                case "Past Games":
                    const status = tab === "Upcoming Games" ? "upcoming" : "completed";

                    // Get games user is a player in
                    const playerGamesRes = await axios.get(
                        `${process.env.REACT_APP_API_URL}/games/player/${user._id}`,
                        { params: { status, ...filterParams } }
                    );

                    // Get games user is hosting
                    const hostedGamesRes = await axios.get(
                        `${process.env.REACT_APP_API_URL}/games`,
                        { params: { host_id: user._id, status, ...filterParams } }
                    );

                    // Make sure this is still the current request
                    if (currentRequestIdRef.current !== requestId) return;

                    // Combine player games and hosted games
                    // Add a playerStatus of "host" to hosted games for consistent display
                    const hostedGames = hostedGamesRes.data.map(game => ({
                        ...game,
                        playerStatus: "host"
                    }));

                    result = [...playerGamesRes.data, ...hostedGames];

                    // Remove duplicates in case a game appears in both lists
                    result = result.filter((game, index, self) =>
                        index === self.findIndex(g => g._id === game._id)
                    );
                    break;

                default:
                    break;
            }

            // Only update state if this is still the current request
            if (currentRequestIdRef.current === requestId) {
                setGames(result);
            }
        } catch (error) {
            console.error("Error fetching games:", error);

            if (currentRequestIdRef.current === requestId) {
                setGames([]);
            }
        } finally {
            if (currentRequestIdRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [user, tab, filterParams, fetchWaitlistPosition]);

    // Memoize handleTabChange to prevent it from causing infinite loops
    const handleTabChange = useCallback((newTab) => {
        // Clear games immediately when changing tabs to prevent seeing old data
        setGames([]);
        setTab(newTab);

        // Apply stored filters for the new tab
        const tabFilter = tabFilters[newTab] || {};
        setFilterParams(formatFiltersForAPI(tabFilter));
    }, [tabFilters]);

    // Memoize handleApplyFilters to ensure consistent behavior
    const handleApplyFilters = useCallback((filters) => {
        // Store filters for the current tab
        setTabFilters(prev => ({
            ...prev,
            [tab]: filters,
        }));

        setFilterParams(formatFiltersForAPI(filters));
    }, [tab]);

    // Memoize invitation handlers
    const handleAcceptInvitation = useCallback(async (gameId) => {
        if (!user) return;

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/players/accept-invitation`,
                {
                    userId: user._id,
                    gameId: gameId,
                }
            );

            if (response.data.status === "waitlist" && response.data.position) {
                setWaitlistPositions(prev => ({
                    ...prev,
                    [gameId]: response.data.position,
                }));
            }

            // Refresh data after accepting
            fetchGames();
        } catch (error) {
            console.error("Error accepting invitation:", error);
        }
    }, [user, fetchGames]);

    const handleDeclineInvitation = useCallback(async (gameId) => {
        if (!user) return;

        const confirmDecline = window.confirm(
            "Are you sure you want to decline this invitation?"
        );

        if (!confirmDecline) return;

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/players/decline-invitation`,
                {
                    userId: user._id,
                    gameId: gameId,
                }
            );

            // Refresh data after declining
            fetchGames();
        } catch (error) {
            console.error("Error declining invitation:", error);
        }
    }, [user, fetchGames]);

    // Initialize default filters and fetch games when user is loaded
    useEffect(() => {
        if (user && isInitialLoadRef.current) {
            isInitialLoadRef.current = false;

            // Apply default filters for the current tab
            const tabFilter = tabFilters[tab] || {};
            setFilterParams(formatFiltersForAPI(tabFilter));

            // Fetch games data
            fetchGames();
            prevTabRef.current = tab;
        }
    }, [user, tabFilters, tab, fetchGames]);  // Include dependencies but use isInitialLoadRef to prevent re-runs

    // Fetch games when tab or filters change
    useEffect(() => {
        if (user && !isInitialLoadRef.current && (prevTabRef.current !== tab || Object.keys(filterParams).length > 0)) {
            fetchGames();
            prevTabRef.current = tab;
        }
    }, [tab, filterParams, user, fetchGames]);

    // Check for tab parameter in URL when component mounts
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");

        if (tabParam && ["Public Games", "Requested Games", "Invitations", "Upcoming Games", "Past Games"].includes(tabParam)) {
            handleTabChange(tabParam);
        }
    }, [handleTabChange]);  // Now handleTabChange is memoized so this is safe

    return {
        tab,
        games,
        loading,
        waitlistPositions,
        tabFilters,
        handleTabChange,
        handleApplyFilters,
        handleAcceptInvitation,
        handleDeclineInvitation,
    };
};