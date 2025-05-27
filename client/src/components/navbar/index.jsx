import React from 'react';
import './navbar.css';
import { useNavigate, Link } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <Link to="/" className="logo-link">PortScan-Edu</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Main Page</Link></li>
          <li><Link to="/scan">Scan</Link></li>
          {token ? (
            <>
              <li><Link to="/account">Account</Link></li>
              <li><button onClick={handleLogout}>Log Out</button></li>
            </>
          ) : (
            <li><Link to="/login">Login</Link></li>
          )}
          <li>
            <div className="dropdown">
              <button className="dropbtn">Tools
                <i className="fa fa-caret-down"></i>
              </button>
              <div className="dropdown-content">
                <Link to="/nmap">nmap</Link>
                <Link to="/snort">snort</Link>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default NavBar;