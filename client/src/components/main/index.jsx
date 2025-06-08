import React from 'react';
import { useNavigate } from 'react-router-dom';
import './main.css';
import illustration from '../../images/cyber-security.png';

function Main() {
  const navigate = useNavigate();

  const handleStartScan = () => { // przekierowanie do strony skanowania, jeśli użytkownik jest zalogowany
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/scan');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="hero">
      <div className="hero-left">
        <h1>Welcome to <span className="highlight">Port-Scan Edu</span></h1>
        <p className="tagline">Learn network scanning in a safe environment.<br />
  Gain hands-on experience with real-world scenarios designed for ethical training.<br />
  No risks, no legal issues — just a clear path to mastering cybersecurity fundamentals.</p>
        <button className="get-started" onClick={handleStartScan}>Start Scanning!</button>
      </div>
      <div className="hero-right">
        <img src={illustration} alt="Illustration" />
      </div>
    </div>
  );
}

export default Main;