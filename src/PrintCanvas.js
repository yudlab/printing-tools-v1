import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Rect, Transformer, Line, Group } from "react-konva";

const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

function PrintCanvas({ pageSize, orientation }) {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [printMode, setPrintMode] = useState("Scaled Print");
  const [gridSize, setGridSize] = useState({ rows: 3, cols: 4 });
  const [contextMenu, setContextMenu] = useState(null);
  const stageRef = useRef();

  const baseDimensions = PAGE_SIZES[pageSize];
  const canvasDimensions =
    orientation === "portrait"
      ? { width: baseDimensions.width, height: baseDimensions.height }
      : { width: baseDimensions.height, height: baseDimensions.width };

  const cellWidth = canvasDimensions.width / gridSize.cols;
  const cellHeight = canvasDimensions.height / gridSize.rows;

  const handleFileUpload = (event) => {
    setImages([]);
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        const scale = printMode === "Scaled Print"
          ? Math.min(canvasDimensions.width / img.width, canvasDimensions.height / img.height)
          : Math.min(cellWidth / img.width, cellHeight / img.height);
        
        const width = img.width * scale;
        const height = img.height * scale;

        const newImage = {
          id: images.length,
          src: img,
          x: printMode === "Scaled Print" ? (canvasDimensions.width - width) / 2 : (cellWidth - width) / 2,
          y: printMode === "Scaled Print" ? (canvasDimensions.height - height) / 2 : (cellHeight - height) / 2,
          width,
          height,
          gridPos: { row: Math.floor(images.length / gridSize.cols), col: images.length % gridSize.cols },
        };
        setImages((prevImages) => [...prevImages, newImage]);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSelect = (id) => setSelectedImage(id);

  const deleteSelectedImage = () => {
    setImages(images.filter((img) => img.id !== selectedImage));
    setSelectedImage(null);
    setContextMenu(null); // Close the context menu after deleting
  };

  const zoomInImage = () => {
    const updatedImages = images.map((img) =>
      img.id === selectedImage
        ? { ...img, width: img.width * 1.2, height: img.height * 1.2 }
        : img
    );
    setImages(updatedImages);
    setContextMenu(null); // Close the context menu after zooming in
  };

  const zoomOutImage = () => {
    const updatedImages = images.map((img) =>
      img.id === selectedImage
        ? { ...img, width: img.width * 0.8, height: img.height * 0.8 }
        : img
    );
    setImages(updatedImages);
    setContextMenu(null); // Close the context menu after zooming out
  };

  const handleContextMenu = (e, id) => {
    e.evt.preventDefault(); // Prevent default context menu
    setSelectedImage(id);
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
    });
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedImage(null);
      setContextMenu(null); // Close context menu when clicking outside
    }
  };

  const handlePrint = () => {
    setSelectedImage(null);
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
      const printWindow = window.open("", "_blank");
      printWindow.document.write(
        `<html><head><title>Print</title></head><body><img src="${dataURL}" style="width:100%;max-width:100%;height:auto;" onload="window.print();window.close();" /></body></html>`
      );
    }, 50);
  };

  const handlePrintModeChange = (e) => {
    setPrintMode(e.target.value);
    setImages([]);
  };

  const drawGrid = () => {
    const lines = [];
    for (let i = 1; i < gridSize.rows; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * cellHeight, canvasDimensions.width, i * cellHeight]}
          stroke="black"
          strokeWidth={0.5}
        />
      );
    }
    for (let j = 1; j < gridSize.cols; j++) {
      lines.push(
        <Line
          key={`v-${j}`}
          points={[j * cellWidth, 0, j * cellWidth, canvasDimensions.height]}
          stroke="black"
          strokeWidth={0.5}
        />
      );
    }
    return lines;
  };

  return (
    <div className="printPreview">
      <div className="menu">
        {printMode === "PECS" && (
          <div>
            Columns: <input type="number" value={gridSize.cols} onChange={(e) => setGridSize({ ...gridSize, cols: parseInt(e.target.value) || 5 })} min="1" />
            Rows: <input type="number" value={gridSize.rows} onChange={(e) => setGridSize({ ...gridSize, rows: parseInt(e.target.value) || 4 })} min="1" />
          </div>
        )}

        <select onChange={handlePrintModeChange} value={printMode}>
          <option value="Scaled Print">Scaled Print</option>
          <option value="PECS">PECS</option>
        </select>
        
        <input type="file" onChange={handleFileUpload} />
        
        <button onClick={handlePrint}>Print</button>
      </div>

      <Stage
        className="canvas-area"
        width={canvasDimensions.width * 3}
        height={canvasDimensions.height * 3}
        scaleX={3}
        scaleY={3}
        ref={stageRef}
        onMouseDown={handleStageClick}
      >
        <Layer>
          <Rect width={canvasDimensions.width} height={canvasDimensions.height} fill="#f0f0f0" />
          {printMode === "PECS" && drawGrid()}
          {images.map((img, index) => (
            <ClippedImage
              key={img.id}
              image={img}
              isSelected={img.id === selectedImage}
              onSelect={() => handleSelect(img.id)}
              onChange={(newAttrs) => {
                const newImages = images.slice();
                newImages[index] = newAttrs;
                setImages(newImages);
              }}
              cellWidth={printMode === "PECS" ? cellWidth : canvasDimensions.width}
              cellHeight={printMode === "PECS" ? cellHeight : canvasDimensions.height}
              clipToCell={printMode === "PECS"} // Conditionally clip image in PECS mode only
              onContextMenu={(e) => handleContextMenu(e, img.id)} // Attach the context menu event handler
            />
          ))}
        </Layer>
      </Stage>

      {contextMenu && (
        <div
          className="contextMenu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: "absolute",
            backgroundColor: "white",
            border: "1px solid gray",
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: "none", padding: "5px", margin: 0 }}>
            <li onClick={deleteSelectedImage}>Delete</li>
            <li onClick={zoomInImage}>Zoom In (+)</li>
            <li onClick={zoomOutImage}>Zoom Out (-)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ClippedImage component
function ClippedImage({ image, isSelected, onSelect, onChange, cellWidth, cellHeight, clipToCell, onContextMenu }) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <Group
      x={clipToCell ? image.gridPos.col * cellWidth : 0}
      y={clipToCell ? image.gridPos.row * cellHeight : 0}
      clipFunc={clipToCell ? (ctx) => ctx.rect(0, 0, cellWidth, cellHeight) : null}
      onContextMenu={onContextMenu}
    >
      <Image
        image={image.src}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        draggable
        onClick={onSelect}
        onDragEnd={(e) => onChange({ ...image, x: e.target.x(), y: e.target.y() })}
        ref={shapeRef}
      />
      {isSelected && <Transformer ref={trRef} />}
    </Group>
  );
}

export default PrintCanvas;
