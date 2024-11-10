import React, { useState } from "react";
import PrintCanvas from "./PrintCanvas";
import "./assets/scss/App.scss"

function App() {
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");

  return (
    <div className="App">
      <div className="menu">
        <label>Select Page Size: </label>
        <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
          <option value="A4">A4</option>
          <option value="A3">A3</option>
        </select>
        <label> Orientation: </label>
        <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      <PrintCanvas pageSize={pageSize} orientation={orientation} />
    </div>
  );
}

export default App;
