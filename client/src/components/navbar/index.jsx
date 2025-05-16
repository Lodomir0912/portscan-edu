import React from 'react';
import './navbar.css';

const NavBar = () => {
  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <a href="/" className="logo-link">PortScan-Edu</a>
        </div>
        <ul className="nav-links">
          <li><a href="/">Main Page</a></li>
          <li><a href="/scan">Scan</a></li>
          <li><a href="/login">Login</a></li>
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
