import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

function RegisterModal({ show, onHide, onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(username, password);
  };
  // Assuming you have defined this function in the context where you're using RegisterModal
  const handleRegister = async (username, password) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/handle-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      // Handle successful registration (e.g., updating state, closing modal)
      setIsLoggedIn(true);
      // Close the modal if you're passing onHide as a prop to RegisterModal
      onHide();
    } catch (error) {
      console.error("Registration Error:", error.message);
      // Optionally handle registration error (e.g., displaying an error message)
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Register</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Register
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default RegisterModal;
