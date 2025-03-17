// src/components/Table/Table.js

import './Table.css';

const Table = ({ headers, data, onRowClick, style, shadow, compact, disableRowClick, renderStatus }) => {
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
                        {renderStatus && <th className={compact ? "th-compact" : ""}>Status</th>}
                    </tr>
                </thead>
                <tbody>
                    {data && data.map((item, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => {
                                if (!disableRowClick && item.clickable !== false) onRowClick(item._id);
                            }}
                            className={disableRowClick || item.clickable === false ? 'row-disabled' : ''}
                        >
                            {headers.map((header, colIndex) => (
                                <td key={colIndex} className={compact ? "td-compact" : ""}>
                                    {item[header.toLowerCase()]}
                                </td>
                            ))}
                            {renderStatus && (
                                <td className={compact ? "td-compact" : ""}>
                                    {renderStatus(item)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;