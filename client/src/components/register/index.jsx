import React, { useState } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import Swal from "sweetalert2"
import "./register.css"

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleRegister(e) {
    e.preventDefault()
    try {
      const requestBody = { email, password }
      await axios.post("https://api.p2.lc2s5.foxhub.space/register", requestBody)
      Swal.fire({
        icon: "success",
        title: "Account created",
        text: "You can now log in.",
      })
      navigate("/login")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration failed",
        text: error.response?.data?.message || "Something went wrong",
      })
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <form onSubmit={handleRegister}>
          <h2>Create an account</h2>
          <p className="subtitle">Let's get started!</p>

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

          <button type="submit" className="register-button">
            REGISTER
          </button>

          <p className="info">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
