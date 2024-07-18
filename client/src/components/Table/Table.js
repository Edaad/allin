import './Table.css';

const Table = ({ data, excludeUserId }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                {data.filter(item => item._id !== excludeUserId).map((item) => (
                    <tr key={item._id}>
                        <td>{item.names.firstName} {item.names.lastName}</td>
                        <td>{item.username}</td>
                        <td>{item.email}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Table;
