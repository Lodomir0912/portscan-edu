import React from 'react';
import '../../App.css';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="logo">PortScan-Edu</div>
      <ul className="nav-links">
        <li><a href="/">Main Page</a></li>
        <li><a href="/about">Tools</a></li>
        <li><a href="/contact">Kontakt</a></li>
      </ul>
    </nav>
  );
};

export default NavBar;
