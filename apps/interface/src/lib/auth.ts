// Simple authentication utility for admin page protection
import { useState, useEffect } from "react";

// In a real application, you would use a more secure approach
// such as server-side authentication, JWT tokens, etc.
const ADMIN_PASSWORD = "blockchain123"; // This would be stored securely in a real app

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if authenticated on mount (could use localStorage or cookies in a real app)
  useEffect(() => {
    const authStatus = sessionStorage.getItem("blockchain_setup_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Authenticate function
  const authenticate = (password: string): boolean => {
    const isValid = password === ADMIN_PASSWORD;

    if (isValid) {
      sessionStorage.setItem("blockchain_setup_auth", "true");
      setIsAuthenticated(true);
    }

    return isValid;
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem("blockchain_setup_auth");
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    authenticate,
    logout,
  };
}
