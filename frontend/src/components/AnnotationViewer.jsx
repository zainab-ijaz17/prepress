import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function AnnotationViewer({ annotationData, imageUrl }) {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isPdf, setIsPdf] = useState(false);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfPage, setPdfPage] = useState(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl || !annotationData) return;

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
  }, [imageUrl, annotationData]);

  const renderPdfPage = async (page, pageNumber, scale) => {
    const viewport = page.getViewport({ scale });
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = viewport.width;
    canvasRef.current.height = viewport.height;
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    renderTaskRef.current = page.render({
      canvasContext: ctx,
      viewport
    });

    await renderTaskRef.current.promise;

    if (annotationData.markers) {
      drawMarkers(ctx, annotationData.markers, viewport.width, viewport.height, pageNumber);
    }
  };

  const loadImage = (url) => {
    const img = new Image();

    setImageLoaded(false);
    setImageError('');

    img.onload = () => {
      setImageLoaded(true);
      const maxWidth = 960;
      const maxHeight = 640;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

      const width = img.width * scale;
      const height = img.height * scale;

      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      if (annotationData.markers) {
        drawMarkers(ctx, annotationData.markers, width, height, undefined);
      }
    };

    img.onerror = (event) => {
      console.error('Failed to load image', event);
      setImageLoaded(false);
      setImageError('The artwork preview could not be loaded.');
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

      const maxWidth = 960;
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(maxWidth / viewport.width, 1);
      setPdfScale(scale);

      await renderPdfPage(page, 1, scale);

      setImageLoaded(true);
    } catch (error) {
      if (error.name === 'RenderingCancelledException') {
        console.log('PDF render cancelled');
        return;
      }
      console.error('Failed to load PDF', error);
      setImageLoaded(false);
      setImageError(`The PDF preview could not be loaded: ${error.message || 'Unknown error'}`);
    }
  };

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

  const handlePageChange = async (newPage) => {
    if (!pdfDocument || newPage < 1 || newPage > totalPages) return;
    const pageNumber = newPage;
    setCurrentPage(pageNumber);
    const page = await pdfDocument.getPage(pageNumber);
    setPdfPage(page);

    const maxWidth = 960;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / viewport.width, 1);
    setPdfScale(scale);

    await renderPdfPage(page, pageNumber, scale);
  };

  if (!annotationData || !annotationData.markers || annotationData.markers.length === 0) {
    return null;
  }

  return (
    <div className="annotation-viewer">
      <div className="annotation-panel-heading">
        <div>
          <h4>Annotated Preview</h4>
          <p>Review the latest requested changes on the selected version.</p>
        </div>
        {isPdf && totalPages > 1 && (
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
        )}
      </div>

      {!imageLoaded && !imageError ? (
        <div className="annotation-empty-state">Loading annotations...</div>
      ) : null}

      {imageError ? (
        <div className="annotation-empty-state annotation-empty-state--error">
          <strong>Preview unavailable</strong>
          <span>{imageError}</span>
        </div>
      ) : (
        <div className="annotation-canvas-shell annotation-canvas-shell--viewer" style={{ display: imageLoaded ? 'flex' : 'none' }}>
          <canvas ref={canvasRef} className="annotation-canvas annotation-canvas--readonly" />
        </div>
      )}

      <div className="annotation-summary-list">
          {annotationData.markers.map((marker) => (
            <div key={marker.id} className="annotation-summary-item" style={{ borderLeftColor: marker.color }}>
              <div className="annotation-summary-item__header">
                <div className="annotation-marker-pill" style={{ backgroundColor: marker.color }}>
                  {marker.number}
                </div>
                <span className="annotation-summary-item__title">
                  Change Request #{marker.number}
                </span>
              </div>
              {marker.comment && (
                <p className="annotation-summary-item__comment">
                  {marker.comment}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default AnnotationViewer;
