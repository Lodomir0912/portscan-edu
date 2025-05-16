import React, { useState } from "react"
import NavBar from '../navbar';
import './login.css';
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import Swal from "sweetalert2"


function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const response = await axios.post("https://api.p2.lc2s5.foxhub.space/login", {
        email,
        password,
      })
      localStorage.setItem("access_token", response.data.access_token)
      navigate("/")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong",
      })
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <form onSubmit={handleLogin}>
          <h2>Login to your account</h2>
          <p className="subtitle">Welcome back!</p>

          <div className="form-group">
            <label htmlFor="email">Email address:</label>
            <input
              type="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button">
            LOG IN
          </button>

          <p className="info">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login