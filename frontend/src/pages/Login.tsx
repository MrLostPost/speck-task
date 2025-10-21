import { useEffect } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const navigate = useNavigate();


  useEffect(() => {
    //* Tries to fetch /api/me - if it exist, it redirect to /main
    (async () => {
      try {
        await api.get("/api/me");
        navigate("/main", { replace: true });
      } catch (error: unknown){ 
        console.log(error)
      }
    })();
  }, [navigate]);


  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };


  return (
    <div>
      <h1>Login</h1>
      <p>Sign in with your Google account to continue.</p>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
}