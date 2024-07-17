import * as yup from "yup";

const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;
const usernameRules = /^[a-zA-Z0-9]+$/;

export const signupSchema = yup.object().shape({
    firstName: yup.string().required("Please enter your first name"),
    lastName: yup.string().required("Please enter your last name"),
    username: yup.string()
        .required("Please enter your username")
        .min(5, "Username must be at least 5 characters")
        .max(12, "Username must be at most 12 characters")
        .matches(usernameRules, "Username can only contain letters and numbers"),
    email: yup.string().email("Please enter a valid email").required("Please enter an email"),
    password: yup.string().matches(passwordRules, { message: "Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number." }).required("Please create a password"),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required("Please confirm your password"),
});
