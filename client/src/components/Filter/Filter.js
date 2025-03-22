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

function Filter({ onApply, tab }) {
	const defaultFilters = useMemo(
		() => ({
			blinds: [],
			handed: {
				min: 2,
				max: 10,
			},
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
				return {
					...prevFilters,
					blinds: [...prevFilters.blinds, value],
				};
			} else {
				return {
					...prevFilters,
					blinds: prevFilters.blinds.filter((b) => b !== value),
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
				...prevFilters.handed,
				[name]: Number(value),
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

	// When the tab changes, reset the filters and clear the parent's filters.
	useEffect(() => {
		setFilters(defaultFilters);
		onApply({});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

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
									checked={filters.blinds.includes(
										blindValue
									)}
									onChange={handleBlindsChange}
								/>
								<label className="filter-blinds">
									{blindValue}
								</label>
							</div>
						))}
					</div>
				</AccordionItem>

				<AccordionItem title="Handed">
					<div className="filter-group">
						<div className="filter-range">
							<div className="filter-range-input">
								<label>
									Min: <strong>{filters.handed.min}</strong>
								</label>
								<input
									className="filter-slider"
									type="range"
									name="min"
									min="2"
									max="10"
									value={filters.handed.min}
									onChange={handleHandedChange}
								/>
							</div>
							<div className="filter-range-input">
								<label>
									Max: <strong>{filters.handed.max}</strong>
								</label>
								<input
									className="filter-slider"
									type="range"
									name="max"
									min="2"
									max="10"
									value={filters.handed.max}
									onChange={handleHandedChange}
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
