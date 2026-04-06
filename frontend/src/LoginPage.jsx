import { useState } from "react";
import { useAuth } from "./AuthContext";
import { SplineScene } from "./components/ui/splite";
import { Spotlight } from "./components/ui/spotlight";
import { LiquidMetalButton } from "./components/ui/liquid-metal-button";
import "./LoginPage.css";

export default function LoginPage({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split dark">
      {/* Left side — Login form */}
      <div className="login-form-side">
        <div className="login-glass-card">
          <h1 className="login-dark-title">INTELLITRACT</h1>

          <form onSubmit={handleSubmit} className="login-dark-form">
            <div className="login-dark-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-dark-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="login-dark-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-dark-input"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="login-dark-error">{error}</div>}

            <div className="flex justify-center">
              <LiquidMetalButton
                label={loading ? "Logging in..." : "Login"}
                onClick={handleSubmit}
              />
            </div>
          </form>

          <div className="login-dark-footer">
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="login-dark-switch"
                disabled={loading}
              >
                Register here
              </button>
            </p>
          </div>

          <div className="login-dark-demo">
            <p className="demo-head">Demo Credentials</p>
            <p>alice@example.com &nbsp;/&nbsp; password123</p>
          </div>
        </div>
      </div>

      {/* Right side — 3D Scene */}
      <div className="login-scene-side">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />

        <div className="scene-3d">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
