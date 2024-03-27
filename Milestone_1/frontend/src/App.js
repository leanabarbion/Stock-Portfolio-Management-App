
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Button } from 'react-bootstrap';
import StockList from './components/AllStock'; // Ensure this path is correct
import Login from './components/AuthView'; // Ensure this path is correct
import Portfolio from './components/Portfolio';



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');


  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    // Perform any additional actions after login if necessary
  };
  
  const handleLogout = async () => {
    // Here you would call your backend to destroy the session
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/logout`, {
        method: "POST",
        credentials: "include", // To ensure cookies are included
      });
      if (response.ok) {
        setIsLoggedIn(false);
        localStorage.setItem('isLoggedIn', 'false');
      } else {
        // Handle error case
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Network error on logout", error);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/session-check`, {
                credentials: 'include', // Important for including cookies
            });
            const data = await response.json();
            setIsLoggedIn(data.isLoggedIn);
            localStorage.setItem('isLoggedIn', data.isLoggedIn ? 'true' : 'false');
        } catch (error) {
            console.error("Error checking login status", error);
        }
    };

    checkLoginStatus();
  }, []);


  return (
    <Container>
      <h1>Welcome to Wealthwise</h1>
      {isLoggedIn ? (
        <>
          <StockList />
          <Portfolio isLoggedIn={isLoggedIn} />
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </Container>
  );
}

export default App;
