import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import Main from './components/main/';
import NavBar from './components/navbar/';
import './components/navbar/navbar.css';
import Login from './components/login/';
import './components/login/login.css';
import Register from './components/register/';
import './components/register/register.css';
import Scan from './components/scan/';
import './components/scan/scan.css';
import Nmap from './components/nmap/';
import './components/nmap/nmap.css';
import Snort from './components/snort/';
import './components/snort/snort.css';
import Account from './components/account';
import './components/account/account.css'

function App() {

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/scan' element={<Scan />} />
        <Route path="/nmap" element={<Nmap />} />
        <Route path="/snort" element={<Snort />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Router>
  );
}


export default App;
