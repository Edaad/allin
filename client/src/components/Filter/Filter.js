import React, { useState, useEffect, useMemo } from "react";
import "./Filter.css";
import { Accordion, AccordionItem } from "../Accordion/Accordion";

const BLINDS_OPTIONS = [
	"0.05/0.1",
	"0.1/0.2",
	"0.5/1",
	"1/2",
	"1/3",
	"2/5",
	"5/10",
];

function Filter({ onApply, tab, initialFilters }) {
	const defaultFilters = useMemo(
		() => ({
			blinds: [],
			handed: {
				min: 2,
				max: 10,
			},
			dateRange: {
				startDate: "",
				endDate: "",
			},
			timeRange: {
				startTime: "",
				endTime: "",
			},
		}),
		[]
	);

	// Local state for filters - initialize with initialFilters if available
	const [filters, setFilters] = useState(initialFilters || defaultFilters);

	// Update filters when initialFilters changes
	useEffect(() => {
		// Ensure we always have a properly structured filters object
		const safeFilters = initialFilters && Object.keys(initialFilters).length > 0
			? {
				// Provide defaults for any missing properties
				blinds: initialFilters.blinds || [],
				handed: initialFilters.handed || { min: 2, max: 10 },
				dateRange: initialFilters.dateRange || { startDate: "", endDate: "" },
				timeRange: initialFilters.timeRange || { startTime: "", endTime: "" }
			}
			: defaultFilters;

		setFilters(safeFilters);
	}, [initialFilters, defaultFilters, tab]);

	// Handler for blinds checkboxes
	const handleBlindsChange = (e) => {
		const { value, checked } = e.target;
		setFilters((prevFilters) => {
			// Ensure blinds is an array, default to empty if undefined
			const currentBlinds = prevFilters.blinds || [];

			if (checked) {
				return {
					...prevFilters,
					blinds: [...currentBlinds, value],
				};
			} else {
				return {
					...prevFilters,
					blinds: currentBlinds.filter((b) => b !== value),
				};
			}
		});
	};

	// Handler for handed range inputs
	const handleHandedChange = (e) => {
		const { name, value } = e.target;
		setFilters((prevFilters) => ({
			...prevFilters,
			handed: {
				...(prevFilters.handed || { min: 2, max: 10 }),
				[name]: Number(value),
			},
		}));
	};

	// Handler for date range inputs
	const handleDateChange = (e) => {
		const { name, value } = e.target;
		setFilters((prevFilters) => ({
			...prevFilters,
			dateRange: {
				...(prevFilters.dateRange || { startDate: "", endDate: "" }),
				[name]: value,
			},
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

	// Guard against accessing properties of undefined
	const blinds = filters && filters.blinds ? filters.blinds : [];
	const handed = filters && filters.handed ? filters.handed : { min: 2, max: 10 };
	const dateRange = filters && filters.dateRange ? filters.dateRange : { startDate: "", endDate: "" };

	return (
		<div className="filter-sidebar">
			<div className="filter-header">
				<h4>Filters</h4>
				<button className="filter-resetButton" onClick={handleReset}>
					Reset
				</button>
			</div>

			<Accordion>
				<AccordionItem title="Blinds">
					<div className="filter-group">
						{BLINDS_OPTIONS.map((blindValue) => (
							<div key={blindValue}>
								<input
									className="filter-checkbox"
									type="checkbox"
									name="blinds"
									value={blindValue}
									checked={blinds.includes(blindValue)}
									onChange={handleBlindsChange}
								/>
								<label className="filter-blinds">
									{blindValue}
								</label>
							</div>
						))}
					</div>
				</AccordionItem>

				<AccordionItem title="Players">
					<div className="filter-group">
						<div className="filter-range">
							<div className="filter-range-input">
								<label>
									Min: <strong>{handed.min}</strong>
								</label>
								<input
									className="filter-slider"
									type="range"
									name="min"
									min="2"
									max="10"
									value={handed.min}
									onChange={handleHandedChange}
								/>
							</div>
							<div className="filter-range-input">
								<label>
									Max: <strong>{handed.max}</strong>
								</label>
								<input
									className="filter-slider"
									type="range"
									name="max"
									min="2"
									max="10"
									value={handed.max}
									onChange={handleHandedChange}
								/>
							</div>
						</div>
					</div>
				</AccordionItem>

				<AccordionItem title="Date Range">
					<div className="filter-group">
						<div className="filter-date-range">
							<div className="filter-date-input">
								<label>Start Date</label>
								<input
									className="filter-date"
									type="date"
									name="startDate"
									value={dateRange.startDate}
									onChange={handleDateChange}
								/>
							</div>
							<div className="filter-date-input">
								<label>End Date</label>
								<input
									className="filter-date"
									type="date"
									name="endDate"
									value={dateRange.endDate}
									onChange={handleDateChange}
									min={dateRange.startDate}
								/>
							</div>
						</div>
					</div>
				</AccordionItem>
			</Accordion>

			<div className="filter-actions">
				<button className="filter-applyButton" onClick={handleApply}>
					Apply Filters
				</button>
			</div>
		</div>
	);
}

export default Filter;
