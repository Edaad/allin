import { useNavigate } from "react-router-dom";
import "./Logo.css";

export default function Logo() {
    const navigate = useNavigate();

    return (
        <div className='logo-name' onClick={() => { navigate('/') }}>
            <p>all</p>
            <p style={{ color: "rgb(53, 115, 55)" }}>in.</p>
        </div>
    )
}