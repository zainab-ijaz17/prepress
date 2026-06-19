import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function AnnotationEditor({ imageUrl, onSave, existingAnnotations, onCancel }) {
  const canvasRef = useRef(null);
  const expandedCanvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState('');
  const [markers, setMarkers] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [nextMarkerNumber, setNextMarkerNumber] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  });
  const [isPdf, setIsPdf] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfPage, setPdfPage] = useState(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const renderTaskMainRef = useRef(null);
  const renderTaskExpandedRef = useRef(null);

  const colors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#000000', // Black
  ];

  useEffect(() => {
    if (existingAnnotations && existingAnnotations.markers) {
      setMarkers(existingAnnotations.markers);
      setNextMarkerNumber(existingAnnotations.markers.length + 1);
    } else {
      setMarkers([]);
      setNextMarkerNumber(1);
    }
  }, [existingAnnotations]);

  useEffect(() => {
    if (!imageUrl) return;

    setImageLoaded(false);
    setImageError('');

    // Check if file is PDF
    const isPdfFile = imageUrl.toLowerCase().endsWith('.pdf');
    setIsPdf(isPdfFile);

    if (isPdfFile) {
      loadPdf(imageUrl);
    } else {
      loadImage(imageUrl);
    }
  }, [imageUrl, isExpanded, viewportSize]);

  const loadImage = (url) => {
    const img = new Image();

    img.onload = () => {
      setImageLoaded(true);
      const maxWidth = isExpanded ? Math.max(960, viewportSize.width - 220) : 960;
      const maxHeight = isExpanded ? Math.max(640, viewportSize.height - 220) : 640;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

      const width = img.width * scale;
      const height = img.height * scale;

      setCanvasSize({ width, height });
      drawImageToCanvas(canvasRef.current, img, width, height);
      drawImageToCanvas(expandedCanvasRef.current, img, width, height);
    };

    img.onerror = (event) => {
      console.error('Failed to load image', event);
      setImageLoaded(false);
      setImageError('The selected artwork could not be loaded for annotation.');
    };

    img.src = url;
  };

  const loadPdf = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      const page = await pdf.getPage(1);
      setPdfPage(page);

      const maxWidth = isExpanded ? Math.max(960, viewportSize.width - 220) : 960;
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(maxWidth / viewport.width, 1);
      setPdfScale(scale);

      const scaledViewport = page.getViewport({ scale });
      const width = scaledViewport.width;
      const height = scaledViewport.height;

      setCanvasSize({ width, height });

      await renderPdfToCanvas(canvasRef.current, page, scaledViewport, 1);
      await renderPdfToCanvas(expandedCanvasRef.current, page, scaledViewport, 1);

      setImageLoaded(true);
    } catch (error) {
      if (error.name === 'RenderingCancelledException') {
        console.log('PDF render cancelled');
        return;
      }
      console.error('Failed to load PDF', error);
      setImageLoaded(false);
      setImageError(`The selected PDF could not be loaded for annotation: ${error.message || 'Unknown error'}. Please ensure the PDF file is valid and accessible.`);
    }
  };

  const renderPdfToCanvas = async (canvas, page, viewport, pageNumber) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    const taskRef = canvas === expandedCanvasRef.current ? renderTaskExpandedRef : renderTaskMainRef;

    if (taskRef.current) {
      taskRef.current.cancel();
    }

    taskRef.current = page.render({
      canvasContext: ctx,
      viewport: viewport
    });

    await taskRef.current.promise;

    drawMarkers(ctx, markers, viewport.width, viewport.height, pageNumber);
  };

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  const drawImageToCanvas = (canvas, img, width, height) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    drawMarkers(ctx, markers, width, height, undefined);
  };

  const redrawCanvas = () => {
    if (isPdf && pdfPage) {
      const viewport = pdfPage.getViewport({ scale: pdfScale });
      renderPdfToCanvas(canvasRef.current, pdfPage, viewport, currentPage);
      renderPdfToCanvas(expandedCanvasRef.current, pdfPage, viewport, currentPage);
    } else if (imageUrl && !isPdf) {
      const img = new Image();
      img.onload = () => {
        drawImageToCanvas(canvasRef.current, img, canvasSize.width, canvasSize.height);
        drawImageToCanvas(expandedCanvasRef.current, img, canvasSize.width, canvasSize.height);
      };
      img.src = imageUrl;
    }
  };

  const handlePageChange = async (newPage) => {
    if (!pdfDocument || newPage < 1 || newPage > totalPages) return;
    const pageNumber = newPage;
    setCurrentPage(pageNumber);
    const page = await pdfDocument.getPage(pageNumber);
    setPdfPage(page);

    const maxWidth = isExpanded ? Math.max(960, viewportSize.width - 220) : 960;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / viewport.width, 1);
    setPdfScale(scale);

    const scaledViewport = page.getViewport({ scale });
    const width = scaledViewport.width;
    const height = scaledViewport.height;

    setCanvasSize({ width, height });

    await renderPdfToCanvas(canvasRef.current, page, scaledViewport, pageNumber);
    await renderPdfToCanvas(expandedCanvasRef.current, page, scaledViewport, pageNumber);
  };

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [markers]);

  const drawMarkers = (ctx, markerList, width, height, pageNumber) => {
    const pageMarkers = markerList.filter(m => !m.pageNumber || m.pageNumber === pageNumber);
    pageMarkers.forEach((marker) => {
      const x = (marker.x / marker.canvasWidth) * width;
      const y = (marker.y / marker.canvasHeight) * height;

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = marker.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.number.toString(), x, y);
    });
  };

  const createMarkerFromClick = (event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const newMarker = {
      id: Date.now(),
      number: nextMarkerNumber,
      x,
      y,
      color: selectedColor,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      comment: '',
      pageNumber: currentPage
    };

    setMarkers([...markers, newMarker]);
    setNextMarkerNumber(nextMarkerNumber + 1);
  };

  const handleCanvasClick = (event) => {
    createMarkerFromClick(event);
  };

  const handleMarkerCommentChange = (markerId, comment) => {
    setMarkers(markers.map(m => 
      m.id === markerId ? { ...m, comment } : m
    ));
  };

  const handleDeleteMarker = (markerId) => {
    const remaining = markers.filter(m => m.id !== markerId);
    const renumbered = remaining.map((m, index) => ({ ...m, number: index + 1 }));
    setMarkers(renumbered);
    setNextMarkerNumber(renumbered.length + 1);
  };

  const handleSave = () => {
    onSave({
      markers,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height
    });
  };

  return (
    <div className="annotation-editor">
      <div className="annotation-toolbar">
        <div className="annotation-toolbar__group">
          <div className="annotation-toolbar__copy">
            <p className="annotation-toolbar__label">Marker color</p>
            <p className="annotation-toolbar__hint">Click anywhere on the artwork to drop a numbered comment pin.</p>
          </div>
          <div className="annotation-color-row">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`annotation-color-swatch ${selectedColor === color ? 'is-active' : ''}`}
                aria-label={`Select marker color ${color}`}
                title={color}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {isPdf && totalPages > 1 && (
          <div className="annotation-toolbar__group">
            <div className="annotation-toolbar__copy">
              <p className="annotation-toolbar__label">Page navigation</p>
              <p className="annotation-toolbar__hint">Switch between PDF pages to annotate different sections.</p>
            </div>
            <div className="annotation-page-nav">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="annotation-page-nav__current">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="annotation-toolbar__side">
          <div className="annotation-toolbar__actions">
            <div className="annotation-chip">
              <span className="annotation-chip__value">{markers.length}</span>
              <span>markers</span>
            </div>
            <div className="annotation-chip annotation-chip--subtle">
              <span className="annotation-chip__value">#{nextMarkerNumber}</span>
              <span>next pin</span>
            </div>
          </div>

          <div className="annotation-toolbar__buttons">
            <button type="button" onClick={() => setIsExpanded(true)} className="btn btn-secondary">
              Open Large View
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save Annotations
            </button>
          </div>
        </div>
      </div>

      <div className="annotation-layout">
        <div className="annotation-canvas-card">
          <div className="annotation-panel-heading">
            <div>
              <h4>Artwork Preview</h4>
              <p>Place pins directly on the image to point out edits.</p>
            </div>
          </div>

          {!imageLoaded && !imageError ? (
            <div className="annotation-empty-state">Loading image for annotation...</div>
          ) : null}

          {imageError ? (
            <div className="annotation-empty-state annotation-empty-state--error">
              <strong>Image unavailable</strong>
              <span>{imageError}</span>
            </div>
          ) : (
            <div className="annotation-canvas-shell" style={{ display: imageLoaded ? 'flex' : 'none' }}>
              <canvas ref={canvasRef} onClick={handleCanvasClick} className="annotation-canvas" />
              <div className="annotation-canvas-caption">
                Use one pin per required change. You can remove pins from the panel on the right.
              </div>
            </div>
          )}
        </div>

        <div className="annotation-sidebar">
          <div className="annotation-list-card">
            <div className="annotation-panel-heading">
              <div>
                <h4>Feedback Pins</h4>
                <p>{markers.length === 0 ? 'Start by clicking the artwork.' : 'Add details for each requested change.'}</p>
              </div>
            </div>

            {markers.length === 0 ? (
              <div className="annotation-empty-list">
                No markers yet. Click on the artwork to create your first annotation.
              </div>
            ) : (
              <div className="annotation-list">
                {markers.map((marker) => (
                  <div key={marker.id} className="annotation-item" style={{ '--marker-color': marker.color }}>
                    <div className="annotation-item__header">
                      <div className="annotation-marker-pill" style={{ backgroundColor: marker.color }}>
                        {marker.number}
                      </div>
                      <div>
                        <p className="annotation-item__title">Marker #{marker.number}</p>
                        <p className="annotation-item__meta">Click delete if this pin is no longer needed.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMarker(marker.id)}
                        className="annotation-delete"
                        title="Delete marker"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={marker.comment}
                      onChange={(e) => handleMarkerCommentChange(marker.id, e.target.value)}
                      placeholder="Describe exactly what should change here..."
                      className="annotation-textarea"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="annotation-modal">
          <div className="annotation-modal__backdrop" onClick={() => setIsExpanded(false)} />
          <div className="annotation-modal__dialog">
            <div className="annotation-modal__header">
              <div>
                <h4>Large Annotation View</h4>
                <p>Click exactly on the artwork to drop markers. Press `Esc` to close.</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setIsExpanded(false)}>
                Close
              </button>
            </div>

            <div className="annotation-modal__body">
              <div className="annotation-modal__canvas">
                {imageError ? (
                  <div className="annotation-empty-state annotation-empty-state--error">
                    <strong>Image unavailable</strong>
                    <span>{imageError}</span>
                  </div>
                ) : (
                  <div className="annotation-canvas-shell annotation-canvas-shell--modal" style={{ display: imageLoaded ? 'flex' : 'none' }}>
                    <canvas
                      ref={expandedCanvasRef}
                      onClick={handleCanvasClick}
                      className="annotation-canvas annotation-canvas--expanded"
                    />
                  </div>
                )}
              </div>

              <div className="annotation-modal__sidebar">
                <div className="annotation-list-card">
                  <div className="annotation-panel-heading">
                    <div>
                      <h4>Markers</h4>
                      <p>Delete or update any pin while working in the larger view.</p>
                    </div>
                  </div>
                  {markers.length === 0 ? (
                    <div className="annotation-empty-list">No markers yet. Click the image to add one.</div>
                  ) : (
                    <div className="annotation-list">
                      {markers.map((marker) => (
                        <div key={marker.id} className="annotation-item" style={{ '--marker-color': marker.color }}>
                          <div className="annotation-item__header">
                            <div className="annotation-marker-pill" style={{ backgroundColor: marker.color }}>
                              {marker.number}
                            </div>
                            <div>
                              <p className="annotation-item__title">Marker #{marker.number}</p>
                              <p className="annotation-item__meta">Placed exactly where you clicked.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMarker(marker.id)}
                              className="annotation-delete"
                              title="Delete marker"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            value={marker.comment}
                            onChange={(e) => handleMarkerCommentChange(marker.id, e.target.value)}
                            placeholder="Describe exactly what should change here..."
                            className="annotation-textarea"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnotationEditor;
