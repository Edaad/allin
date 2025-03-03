import React, { useState, useEffect, useMemo } from "react";
import "./Filter.css";

const BLINDS_OPTIONS = [
    "0.05/0.1",
    "0.1/0.2",
    "0.5/1",
    "1/2",
    "1/3",
    "2/5",
    "5/10",
];

function Filter({ onApply, tab }) {
    const defaultFilters = useMemo(
        () => ({
            blinds: [],
            handed: 2,
        }),
        []
    );

    // Local state for filters
    const [filters, setFilters] = useState(defaultFilters);

    // Handler for blinds checkboxes
    const handleBlindsChange = (e) => {
        const { value, checked } = e.target;
        setFilters((prevFilters) => {
            if (checked) {
                return { ...prevFilters, blinds: [...prevFilters.blinds, value] };
            } else {
                return {
                    ...prevFilters,
                    blinds: prevFilters.blinds.filter((b) => b !== value),
                };
            }
        });
    };

    // Handler for handed slider
    const handleHandedChange = (e) => {
        const { value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            handed: Number(value),
        }));
    };

    // Apply the current filters
    const handleApply = () => {
        onApply(filters);
    };

    // Reset filters to defaults and notify parent with an empty object (no filters)
    const handleReset = () => {
        setFilters(defaultFilters);
        onApply({});
    };

    // When the tab changes, reset the filters and clear the parent's filters.
    useEffect(() => {
        setFilters(defaultFilters);
        onApply({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    return (
        <div className="filter-sidebar">
            <h4>Filters</h4>

            <div className="filter-group">
                <label>Blinds:</label>
                {BLINDS_OPTIONS.map((blindValue) => (
                    <div key={blindValue}>
                        <input
                            className="filter-checkbox"
                            type="checkbox"
                            name="blinds"
                            value={blindValue}
                            checked={filters.blinds.includes(blindValue)}
                            onChange={handleBlindsChange}
                        />
                        <label className="filter-blinds">{blindValue}</label>
                    </div>
                ))}
            </div>

            <div className="filter-group">
                <label>
                    Handed: <strong>{filters.handed}</strong>
                </label>
                <input
                    className="filter-slider"
                    type="range"
                    id="handed"
                    name="handed"
                    min="2"
                    max="10"
                    value={filters.handed}
                    onChange={handleHandedChange}
                />
            </div>

            <button className="filter-applyButton" onClick={handleApply}>
                Apply Filters
            </button>
            <button className="filter-resetButton" onClick={handleReset}>
                Reset Filters
            </button>
        </div>
    );
}

export default Filter;