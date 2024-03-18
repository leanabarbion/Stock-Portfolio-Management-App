function LogoutButton({ onLogout }) {
  const handleLogout = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/logout`, {
        method: "POST", // Adjust according to your backend implementation
        credentials: "include",
      });

      if (response.ok) {
        onLogout(); // Handle any cleanup or state updates needed on logout
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="secondary">
      Logout
    </Button>
  );
}
