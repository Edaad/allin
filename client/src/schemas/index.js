import * as yup from "yup";

const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;

export const signupSchema = yup.object().shape({
    name: yup.string().required("Please enter your full name"),
    username: yup.string().required("Please enter your username"),
    email: yup.string().email("Please enter a valid email").required("Please enter an email"),
    password: yup.string().matches(passwordRules, { message: "Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number." }).required("Please create a password"),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required("Please confirm your password"),
});
