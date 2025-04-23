import { useNavigate } from "react-router-dom";
import { ReactComponent as SpadeIcon } from "../../assets/icons/spade.svg";
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
			<p>all</p>
			<p className="in-text" style={{ color: "rgb(53, 115, 55)" }}>
				in
				<div className="logo-spade">
					<SpadeIcon className="spade-icon" />
				</div>
			</p>
		</div>
	);
}
