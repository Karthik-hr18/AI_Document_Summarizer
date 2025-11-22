import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // ensure wrapper not active for login (blue stays left)
    const wrap = document.querySelector(".wrapper");
    wrap && wrap.classList.remove("active");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/login", {
        username,
        password,
      });
      localStorage.setItem("token", res.data.access_token);
      // ✅ Added: Save username so UploadPage can display it
      localStorage.setItem("username", username); 
      navigate("/upload");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed. Check credentials or server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      {/* Blue toggle panel (left) */}
      <div className="toggle-container" aria-hidden>
        <h2>New here?</h2>
        <p>Create an account and try our summarizer for free.</p>
        <Link to="/register">
          <button className="switch-btn">Create Account</button>
        </Link>

        <div style={{ height: 18 }} />

        {/* social buttons only google + github */}
        <div className="social-login" aria-hidden>
          <div className="social-btn google" title="Sign in with Google">
            {/* simple google 'G' svg */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#DB4437" d="M12 11v2h6.1c-.3 1.9-1.9 3.5-3.9 4.1v2.1c3-1 5.1-3.9 5.1-7.2 0-.6-.1-1.2-.2-1.8H12z" />
              <path fill="#0F9D58" d="M6.3 13.1c-.2-.6-.3-1.3-.3-1.9 0-.6.1-1.2.3-1.8V6.3C3.9 7.7 2.3 9.9 2.3 12.2c0 2.4 1.6 4.6 3.9 5.9l.1-5z" />
              <path fill="#F4B400" d="M12 7.6c1 0 1.9.3 2.6.9l1.9-1.9C15.6 5 13.9 4.4 12 4.4 9.4 4.4 7.1 5.7 5.6 7.9l1.9 1.8C8.2 9 10 7.6 12 7.6z" />
              <path fill="#4285F4" d="M21.5 12.2c0-.8-.1-1.6-.3-2.3H12v4.3h5.5c-.2 1.1-.8 2-1.7 2.6l2 1.6c1.3-1.2 2.5-3 2.5-5.2z"/>
            </svg>
          </div>

          <div className="social-btn github" title="Sign in with GitHub">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#333" d="M12 .5C5.6.5.6 5.4.6 11.8c0 4.9 3.1 9 7.4 10.4.5.1.7-.2.7-.5v-1.8c-3 .6-3.6-1.4-3.6-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.7.7 2.1 1.2.1-.9.4-1.6.8-2-2.4-.3-4.9-1.2-4.9-5.3 0-1.2.4-2.2 1-3-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.6 1 .8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 1.7-1.3 2.6-1 2.6-1 .5 1.4.2 2.4.1 2.7.6.8 1 1.8 1 3 0 4.1-2.5 5-4.9 5.3.4.4.8 1 .8 2v3c0 .3.2.6.7.5 4.3-1.4 7.4-5.5 7.4-10.4C23.4 5.4 18.4.5 12 .5z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Right white form */}
      <div className="form-container">
        <div className="card">
          <h2>Welcome Back!</h2>
          <p className="lead">Sign in to access your summarizer</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin} noValidate>
            <input
              id="username"
              placeholder="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                  /* Eye OFF SVG */
                  <svg viewBox="0 0 24 24">
                    <path d="M2 2l20 20-1.5 1.5L3.5 3.5 2 2zm10 5c-1.1 0-2 .9-2 2 0 .4.1.7.3 1L8.1 9.8c.4-1.8 2-3.3 3.9-3.3 1.1 0 2 .4 2.8 1l-1.5 1.5c-.4-.7-1-.9-1.3-.9z"/>
                  </svg>
                ) : (
                  /* Eye ON SVG */
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                  </svg>
                )}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}