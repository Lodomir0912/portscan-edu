import React from 'react';
import '../../App.css';

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
            <div class="dropdown">
              <button class="dropbtn">Tools
                <i class="fa fa-caret-down"></i>
              </button>
              <div class="dropdown-content">
                <a href="/nmap">nmap</a>
                <a href="/snort">snort</a>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <h1>Welcome to PortScan-Edu!</h1>
      </main>
    </div>
  );
}

export default NavBar;
