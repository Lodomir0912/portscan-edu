import React from 'react';
import './navbar.css';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/")
    window.location.reload();
  };
  var site = "";
  var logout = "";
    if (token) {
      site = <a href="/account">Account</a>
      logout = <li><button onClick={handleLogout}>Log Out</button></li>
    } else {
      site = <a href="/login">Login</a>
    }
  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <a href="/" className="logo-link">PortScan-Edu</a>
        </div>
        <ul className="nav-links">
          <li><a href="/">Main Page</a></li>
          <li><a href="/scan">Scan</a></li>
          <li>{site}</li>
          {logout}
          <li>
            <div className="dropdown">
              <button className="dropbtn">Tools
                <i className="fa fa-caret-down"></i>
              </button>
              <div className="dropdown-content">
                <a href="/nmap">nmap</a>
                <a href="/snort">snort</a>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default NavBar;
