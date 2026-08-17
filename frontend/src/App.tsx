import { useEffect, useState } from "react";
import api from "./api";
import Login from "./components/Login";
import ObjectDropdown from "./components/ObjectDropdown";
import RecordsTable from "./components/RecordsTable";
import type { SFObject } from "./types";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [selectedObject, setSelectedObject] = useState<SFObject | null>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setLoggedIn(res.data.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleLogout() {
    await api.post("/auth/logout");
    setLoggedIn(false);
    setSelectedObject(null);
  }

  if (loggedIn === null) {
    return <div className="app-shell">Checking login status...</div>;
  }

  if (!loggedIn) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <div className="header-bar">
        <h1>Salesforce CRUD App</h1>
        <button className="btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <ObjectDropdown value={selectedObject} onChange={setSelectedObject} />
      </div>

      {selectedObject && <RecordsTable objectName={selectedObject} />}
    </div>
  );
}