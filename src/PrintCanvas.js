import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Rect, Transformer, Line, Group, Text } from "react-konva";

const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

function PrintCanvas({ pageSize, orientation }) {
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]); // Track text elements
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
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

  const handleSelectImage = (id) => {
    setSelectedImage(id);
    setSelectedText(null); // Deselect text when selecting an image
  };

  const handleSelectText = (id) => {
    setSelectedText(id);
    setSelectedImage(null); // Deselect image when selecting text
  };

  const deleteSelectedImage = () => {
    setImages(images.filter((img) => img.id !== selectedImage));
    setSelectedImage(null);
    setContextMenu(null); // Close the context menu after deleting
  };

  const deleteSelectedText = () => {
    setTexts(texts.filter((txt) => txt.id !== selectedText));
    setSelectedText(null);
    setContextMenu(null); // Close the context menu after deleting text
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

  const addText = () => {
    if (selectedImage != null) {
      const image = images.find((img) => img.id === selectedImage);
      const newText = {
        id: texts.length,
        x: image.x + 10, // Position near the selected image
        y: image.y + 10,
        text: "Sample Text",
        width: 100,
        rotation: 0,
      };
      setTexts((prevTexts) => [...prevTexts, newText]);
    }
    setContextMenu(null); // Close the context menu after adding text
  };

  const handleTextChange = (id, newAttrs) => {
    const updatedTexts = texts.map((txt) => (txt.id === id ? { ...txt, ...newAttrs } : txt));
    setTexts(updatedTexts);
  };

  const handleTextEdit = (id, newText) => {
    setTexts(texts.map((txt) => (txt.id === id ? { ...txt, text: newText } : txt)));
  };

  const handleContextMenu = (e, id, type) => {
    e.evt.preventDefault();
    if (type === "image") {
      setSelectedImage(id);
      setSelectedText(null);
    } else if (type === "text") {
      setSelectedText(id);
      setSelectedImage(null);
    }
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
    });
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedImage(null);
      setSelectedText(null);
      setContextMenu(null);
    }
  };

  const handlePrint = () => {
    setSelectedImage(null);
    setSelectedText(null);
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
    setTexts([]);
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
              onSelect={() => handleSelectImage(img.id)}
              onChange={(newAttrs) => {
                const updatedImages = images.slice();
                updatedImages[index] = { ...updatedImages[index], ...newAttrs };
                setImages(updatedImages);
              }}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              clipToCell={printMode === "PECS"}
              onContextMenu={(e) => handleContextMenu(e, img.id, "image")}
            />
          ))}
          {texts.map((txt, index) => (
            <Group
              key={txt.id}
              onClick={() => handleSelectText(txt.id)}
              onContextMenu={(e) => handleContextMenu(e, txt.id, "text")}
            >
              <Rect
                x={txt.x}
                y={txt.y}
                width={txt.width}
                height={20}
                fill="white"
              />
              <Text
                text={txt.text}
                x={txt.x}
                y={txt.y}
                width={txt.width}
                fontSize={14}
                draggable
                fill="black"
                background="white"
                onClick={() => setSelectedText(txt.id)}
                onDblClick={(e) => {
                  const input = prompt("Edit Text:", txt.text);
                  if (input !== null) handleTextEdit(txt.id, input);
                }}
                onDragEnd={(e) => handleTextChange(txt.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={(e) => {
                  const node = e.target;
                  handleTextChange(txt.id, { x: node.x(), y: node.y(), rotation: node.rotation(), width: node.width() });
                }}
              />
              {selectedText === txt.id && (
                <Transformer
                  anchorSize={5}
                  boundBoxFunc={(oldBox, newBox) => newBox}
                />
              )}
            </Group>
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
            <li onClick={addText}>Add Text</li>
            <li onClick={deleteSelectedText}>Delete Text</li>
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
