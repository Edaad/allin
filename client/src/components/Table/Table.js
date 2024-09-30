// src/components/Table/Table.js

import './Table.css';

const Table = ({ headers, data, onRowClick, style, shadow, compact, disableRowClick }) => {
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
                    {data && data.map((item, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => {
                                if (!disableRowClick) onRowClick(item._id);
                            }}
                            className={disableRowClick ? 'row-disabled' : ''}
                        >
                            {headers.map((header, colIndex) => (
                                <td key={colIndex} className={compact ? "td-compact" : ""}>
                                    {item[header.toLowerCase()]}
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
