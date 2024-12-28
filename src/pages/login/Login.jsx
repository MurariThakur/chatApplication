import React, { useState } from "react";
import "./Login.css";
import assest from "../../assets/assets";
import { signup, login, resetPass } from "../../config/firebase";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, email, password } = formData;
    if (isSignUp) {
      signup(username, email, password);
    } else {
      login(email, password);
    }
  };

  return (
    <div className="login">
      <img src={assest.logo_big} alt="Logo" className="logo" />
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{isSignUp ? "Sign Up" : "Login"}</h2>

        {isSignUp && (
          <input
            type="text"
            name="username"
            onChange={handleInputChange}
            value={formData.username}
            className="form-input"
            placeholder="Username"
            required
          />
        )}
        <input
          type="email"
          name="email"
          onChange={handleInputChange}
          value={formData.email}
          className="form-input"
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          onChange={handleInputChange}
          value={formData.password}
          className="form-input"
          placeholder="Password"
          required
        />
        <button type="submit" className="form-button">
          {isSignUp ? "Sign Up" : "Login"}
        </button>

        <div className="login-term">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy</p>
        </div>

        <div className="login-forgot">
          {!isSignUp ? (
            <p className="login-toggle">
              Forgot Password ?{" "}
              <span onClick={() => resetPass(formData.email)}>Reset here</span>
            </p>
          ) : null}
          {isSignUp ? (
            <p className="login-toggle">
              Already have an account?{" "}
              <span onClick={() => setIsSignUp(false)}>Login</span>
            </p>
          ) : (
            <p className="login-toggle">
              Don't have an account?{" "}
              <span onClick={() => setIsSignUp(true)}>Sign Up</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
