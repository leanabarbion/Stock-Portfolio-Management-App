
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Button } from 'react-bootstrap';
import StockList from './components/AllStock'; // Ensure this path is correct
import Login from './components/AuthView'; // Ensure this path is correct

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    // Check if the user is logged in when the app loads
    const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(storedLoginState);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    // Perform any additional actions after login if necessary
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    // Optionally reset any other state or perform cleanup
  };

  return (
    <Container>
      <h1>Welcome to Wealthwise</h1>
      {isLoggedIn ? (
        <>
          <StockList />
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </Container>
  );
}

export default App;
