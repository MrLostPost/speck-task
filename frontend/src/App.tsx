import { Outlet } from "react-router-dom";


export default function App() {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <Outlet />
    </div>
  );
}