import './Table.css';

const Table = ({ headers, data, onRowClick, excludeUserId, style, shadow, compact }) => {
    return (
        <div
            style={{
                ...style,
                ...(shadow && { boxShadow: "0px 4px 7px rgba(0, 0, 0, 0.1)" }),
            }}
            className={`table-container ${compact ? 'compact' : ''}`}
        >
            <table>
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className={compact ? "th-compact" : ""}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data
                        // .filter(item => item._id !== excludeUserId) // Exclude the logged-in user if excludeUserId is provided
                        .map((item, rowIndex) => (
                            <tr key={rowIndex} onClick={() => onRowClick(item._id)}>
                                {headers.map((header, colIndex) => (
                                    <td key={colIndex} className={compact ? "td-compact" : ""}>
                                        {item[header.toLowerCase()]} {/* Assuming data keys are lowercased header names */}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
