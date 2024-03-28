
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Button } from 'react-bootstrap';
import StockList from './components/AllStock'; 
import Login from './components/AuthView'; 



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
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/logout`, {
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
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/session-check`, {
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
    <Container className="position-relative" style={{ minHeight: '100vh' }}>
      <h1>Welcome to Wealthwise</h1>
      {isLoggedIn ? (
        <>
          <StockList />
          <Button
            variant="danger"
            onClick={handleLogout}
            style={{ position: 'absolute', top: 0, right: 0, margin: '10px' }}
          >
            Logout
          </Button>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </Container>
  );
}

export default App;