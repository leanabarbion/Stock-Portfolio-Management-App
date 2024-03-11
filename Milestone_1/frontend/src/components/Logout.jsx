import React from "react";
import { Button } from "react-bootstrap";

function LogoutButton({ setIsLoggedIn }) {
  const handleLogout = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/logout");
      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(false); // Navigate to home page or login page after logout
      } else {
        alert(data.message); // Display an error message if logout failed
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <Button variant="danger" onClick={handleLogout}>
      Log Out
    </Button>
  );
}

export default LogoutButton;
