import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);               // <-- added
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    const wrap = document.querySelector(".wrapper");
    wrap && wrap.classList.add("active");
    return () => wrap && wrap.classList.remove("active");
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/auth/register", {
        username,
        email,
        password,
        confirm_password: confirmPassword,
      });
      navigate("/login");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) setError(detail[0]?.msg || "Registration error");
      else setError(detail || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper active">
      {/* Blue toggle moves to right due to .active on wrapper */}
      <div className="toggle-container" aria-hidden>
        <h2>Welcome Back!</h2>
        <p>If you already have an account, login to continue.</p>
        <Link to="/login">
          <button className="switch-btn">Sign In</button>
        </Link>

        <div style={{ height: 18 }} />
      </div>

      {/* Right white form */}
      <div className="form-container">
        <div className="card">
          <h2>Create an Account</h2>
          <p className="lead">Get started by creating a new account</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleRegister} noValidate>
            <input
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              id="email"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="input-with-icon">
            <input
              id="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                /* eye-off */
                <svg viewBox="0 0 24 24">
                  <path d="M2 2l20 20-1.5 1.5L3.5 3.5 2 2zm10 5c-1.1 0-2 .9-2 2 0 .4.1.7.3 1L8.1 9.8c.4-1.8 2-3.3 3.9-3.3 1.1 0 2 .4 2.8 1l-1.5 1.5c-.4-.7-1-.9-1.3-.9z"/>
                </svg>
              ) : (
                /* eye-on */
                <svg viewBox="0 0 24 24">
                  <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                </svg>
              )}
            </button>
          </div>
            <input
              id="confirm-password"
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* TERMS & CONDITIONS CHECKBOX */}
            <div className="terms">
              <input
                type="checkbox"
                id="terms"
                checked={agree}
                onChange={() => {
                  setAgree((s) => !s);
                  // clear error when user toggles
                  if (error) setError("");
                }}
              />
              <label htmlFor="terms">
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading || !agree}>
              {isLoading ? "Registering..." : "Register"}
            </button>

            <div className="social-login" aria-hidden style={{ marginTop: 18 }}>
              <div className="social-btn google" title="Sign up with Google">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#DB4437" d="M12 11v2h6.1c-.3 1.9-1.9 3.5-3.9 4.1v2.1c3-1 5.1-3.9 5.1-7.2 0-.6-.1-1.2-.2-1.8H12z" />
                  <path fill="#0F9D58" d="M6.3 13.1c-.2-.6-.3-1.3-.3-1.9 0-.6.1-1.2.3-1.8V6.3C3.9 7.7 2.3 9.9 2.3 12.2c0 2.4 1.6 4.6 3.9 5.9l.1-5z" />
                  <path fill="#F4B400" d="M12 7.6c1 0 1.9.3 2.6.9l1.9-1.9C15.6 5 13.9 4.4 12 4.4 9.4 4.4 7.1 5.7 5.6 7.9l1.9 1.8C8.2 9 10 7.6 12 7.6z" />
                  <path fill="#4285F4" d="M21.5 12.2c0-.8-.1-1.6-.3-2.3H12v4.3h5.5c-.2 1.1-.8 2-1.7 2.6l2 1.6c1.3-1.2 2.5-3 2.5-5.2z"/>
                </svg>
              </div>

              <div className="social-btn github" title="Sign up with GitHub">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#333" d="M12 .5C5.6.5.6 5.4.6 11.8c0 4.9 3.1 9 7.4 10.4.5.1.7-.2.7-.5v-1.8c-3 .6-3.6-1.4-3.6-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.7.7 2.1 1.2.1-.9.4-1.6.8-2-2.4-.3-4.9-1.2-4.9-5.3 0-1.2.4-2.2 1-3-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.6 1 .8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 1.7-1.3 2.6-1 2.6-1 .5 1.4.2 2.4.1 2.7.6.8 1 1.8 1 3 0 4.1-2.5 5-4.9 5.3.4.4.8 1 .8 2v3c0 .3.2.6.7.5 4.3-1.4 7.4-5.5 7.4-10.4C23.4 5.4 18.4.5 12 .5z"/>
                </svg>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}