import { useNavigate } from "react-router-dom";
import "./Logo.css";

export default function Logo() {
	const navigate = useNavigate();

	return (
		<div
			className="logo-name"
			onClick={() => {
				navigate("/");
			}}
		>
			<span className="logo-text">all</span>
			<div className="in-text" style={{ color: "rgb(53, 115, 55)" }}>
				<span>in</span>
				<span className="spade-icon">♠</span>
			</div>
		</div>
	);
}
