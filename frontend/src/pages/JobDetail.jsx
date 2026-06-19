import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobAPI, getFileUrl } from '../api';
import AnnotationEditor from '../components/AnnotationEditor';
import AnnotationViewer from '../components/AnnotationViewer';

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [files, setFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotations, setCurrentAnnotations] = useState(null);
  const [annotationComment, setAnnotationComment] = useState('');
  const [isChangingVersion, setIsChangingVersion] = useState(false);

  useEffect(() => {
    fetchJobData();
  }, [id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [jobRes, filesRes, commentsRes, activityRes, annotationsRes] = await Promise.all([
        jobAPI.getById(id),
        jobAPI.getFiles(id),
        jobAPI.getComments(id),
        jobAPI.getActivity(id),
        jobAPI.getJobAnnotations(id)
      ]);
      
      setJob(jobRes.data);
      setFiles(filesRes.data);
      setComments(commentsRes.data);
      setActivity(activityRes.data);
      setAnnotations(annotationsRes.data);
      
      if (filesRes.data.length > 0) {
        setSelectedVersion(filesRes.data[0]);
        
        // Load annotations for the first file version
        const fileAnnotations = await jobAPI.getFileAnnotations(filesRes.data[0].id);
        const latestAnnotation = fileAnnotations.data.length > 0 ? fileAnnotations.data[0] : null;
        setCurrentAnnotations(latestAnnotation?.annotationData || { markers: [] });
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await jobAPI.uploadFile(id, file);
      await fetchJobData();
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error uploading file';
      alert(errorMessage);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await jobAPI.addComment(id, newComment);
      setNewComment('');
      await fetchJobData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await jobAPI.updateStatus(id, 'Approved');
      await fetchJobData();
    } catch (error) {
      console.error('Error approving job:', error);
    }
  };

  const handleRequestChanges = async () => {
    try {
      await jobAPI.updateStatus(id, 'Rework');
      await fetchJobData();
    } catch (error) {
      console.error('Error requesting changes:', error);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await jobAPI.updateStatus(id, 'Completed');
      await fetchJobData();
    } catch (error) {
      console.error('Error marking job as completed:', error);
    }
  };

  const handleMarkUnderReview = async () => {
    try {
      await jobAPI.updateStatus(id, 'Under Review');
      await fetchJobData();
    } catch (error) {
      console.error('Error marking job as under review:', error);
    }
  };

  const handleStartAnnotation = async () => {
    if (selectedVersion) {
      const fileAnnotations = await jobAPI.getFileAnnotations(selectedVersion.id);
      const latestAnnotation = fileAnnotations.data.length > 0 ? fileAnnotations.data[0] : null;
      setCurrentAnnotations(latestAnnotation?.annotationData || { markers: [] });
      setIsAnnotating(true);
    }
  };

  const handleSaveAnnotations = async (annotationData) => {
    try {
      await jobAPI.saveAnnotations(selectedVersion.id, annotationData, annotationComment);
      await jobAPI.updateStatus(id, 'Review Comments');
      setIsAnnotating(false);
      setAnnotationComment('');
      await fetchJobData();
    } catch (error) {
      console.error('Error saving annotations:', error);
      alert('Error saving annotations');
    }
  };

  const handleCancelAnnotation = () => {
    setIsAnnotating(false);
    setAnnotationComment('');
  };

  const handleResolveAnnotation = async (annotationId, markerId) => {
    try {
      await jobAPI.updateMarkerStatus(annotationId, markerId, true);
      await fetchJobData();
    } catch (error) {
      console.error('Error resolving marker:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to resolve marker';
      alert(errorMessage);
    }
  };

  const handleApproveAfterReview = async () => {
    try {
      await jobAPI.updateStatus(id, 'Approved');
      await fetchJobData();
    } catch (error) {
      console.error('Error approving job:', error);
    }
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  };

  const getAnnotationStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-created';
      case 'review-comments':
        return 'status-under-review';
      case 'resolved':
        return 'status-approved';
      case 'closed':
        return 'status-completed';
      default:
        return 'status-created';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileViewer = () => {
    if (!selectedVersion) {
      return <div className="no-file">No file uploaded yet</div>;
    }

    const fileUrl = getFileUrl(selectedVersion.fileUrl);
    const fileExt = selectedVersion.fileUrl.split('.').pop().toLowerCase();

    if (fileExt === 'pdf') {
      return (
        <div className="file-viewer file-viewer--modern">
          <iframe
            src={fileUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="PDF Preview"
          />
        </div>
      );
    } else {
      return (
        <div className="file-viewer file-viewer--modern">
          <img src={fileUrl} alt="Uploaded file" />
        </div>
      );
    }
  };

  const getAnnotationViewer = () => {
    if (!selectedVersion) {
      return <div className="no-file">No file selected</div>;
    }

    const fileUrl = getFileUrl(selectedVersion.fileUrl);

    return (
      <AnnotationEditor
        imageUrl={fileUrl}
        onSave={handleSaveAnnotations}
        existingAnnotations={currentAnnotations}
        onCancel={handleCancelAnnotation}
      />
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  const selectedFileUrl = selectedVersion ? getFileUrl(selectedVersion.fileUrl) : '';
  const selectedFileExt = selectedVersion?.fileUrl?.split('.').pop().toLowerCase();
  const canAnnotate = Boolean(selectedVersion) && job?.status !== 'Completed';
  const latestAnnotationCount = currentAnnotations?.markers?.length || 0;
  const pendingAnnotationCount = annotations.filter((annotation) => annotation.status !== 'resolved').length;

  const handleVersionChange = async (e) => {
    const version = files.find((file) => file.id === e.target.value);
    setSelectedVersion(version || null);
    setIsAnnotating(false);
    setIsChangingVersion(true);

    try {
      if (version) {
        const fileAnnotations = await jobAPI.getFileAnnotations(version.id);
        const latestAnnotation = fileAnnotations.data.length > 0 ? fileAnnotations.data[0] : null;
        setCurrentAnnotations(latestAnnotation?.annotationData || { markers: [] });
      } else {
        setCurrentAnnotations({ markers: [] });
      }
    } finally {
      setIsChangingVersion(false);
    }
  };

  return (
    <div className="job-detail-page">
      <div className="job-detail-topbar">
        <Link to="/jobs" className="btn btn-secondary">
          Back to Jobs
        </Link>
      </div>

      <section className="job-hero">
        <div>
          <div className="job-hero__eyebrow">Prepress Review</div>
          <h2>{job.name}</h2>
          <p className="job-hero__description">
            {job.description || 'Manage artwork review, version changes, approval decisions, and annotation feedback from one workspace.'}
          </p>
        </div>
        <div className="job-hero__meta">
          <div className="job-meta-tile">
            <span className="job-meta-tile__label">Customer</span>
            <strong>{job.customerName}</strong>
          </div>
          <div className="job-meta-tile">
            <span className="job-meta-tile__label">Status</span>
            <span className={`status-badge ${getStatusClass(job.status)}`}>{job.status}</span>
          </div>
          <div className="job-meta-tile">
            <span className="job-meta-tile__label">Created</span>
            <strong>{formatDate(job.createdAt)}</strong>
          </div>
        </div>
      </section>

      <div className="job-summary-grid">
        <div className="job-summary-card">
          <span className="job-summary-card__label">Versions</span>
          <strong>{files.length}</strong>
        </div>
        <div className="job-summary-card">
          <span className="job-summary-card__label">Latest Pins</span>
          <strong>{latestAnnotationCount}</strong>
        </div>
        <div className="job-summary-card">
          <span className="job-summary-card__label">Open Annotation Sets</span>
          <strong>{pendingAnnotationCount}</strong>
        </div>
      </div>



      <div className="job-detail-grid">
        <div>
          <div className="card">
            <h3>Job Information</h3>
            <div className="detail-facts">
              <div className="detail-fact">
                <span>Job ID</span>
                <strong>{job.id}</strong>
              </div>
              <div className="detail-fact">
                <span>Job Name</span>
                <strong>{job.name}</strong>
              </div>
              <div className="detail-fact">
                <span>Customer</span>
                <strong>{job.customerName}</strong>
              </div>
              <div className="detail-fact">
                <span>Status</span>
                <span className={`status-badge ${getStatusClass(job.status)}`}>{job.status}</span>
              </div>
            </div>
            {job.description && (
              <div className="detail-description">
                <span>Description</span>
                <p>{job.description}</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Artwork Review</h3>
                <p>Switch versions, preview files, and add markup comments directly on image uploads.</p>
              </div>
              {files.length > 0 && (
                <div className="review-toolbar">
                  <div className="review-toolbar__field">
                    <label htmlFor="version-select">Version</label>
                    <select
                      id="version-select"
                      value={selectedVersion?.id || ''}
                      onChange={handleVersionChange}
                    >
                      {files.map((file) => (
                        <option key={file.id} value={file.id}>
                          V{file.versionNumber} - {file.originalName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isAnnotating && selectedVersion && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleStartAnnotation}
                      disabled={!canAnnotate}
                    >
                      {canAnnotate ? 'Open Annotation Mode' : (job?.status === 'Completed' ? 'Job is Completed' : 'Image File Required')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {files.length === 0 ? (
              <div className="viewer-empty-state">
                <strong>No artwork uploaded yet</strong>
                <p>Upload the first version below to start the review workflow.</p>
              </div>
            ) : null}

            {isAnnotating ? (
              <div className="annotation-workspace">
                <div className="annotation-note-card">
                  <div className="section-heading">
                    <div>
                      <h3>Review Note</h3>
                      <p>Add a short summary so the team understands the reason for this markup set.</p>
                    </div>
                  </div>
                  <textarea
                    value={annotationComment}
                    onChange={(e) => setAnnotationComment(e.target.value)}
                    placeholder="Example: Please align the logo with the safe area, enlarge the batch code, and use the latest approved background."
                    className="annotation-session-note"
                  />
                </div>
                {getAnnotationViewer()}
              </div>
            ) : (
              <div className="review-preview-stack">
                {isChangingVersion ? (
                  <div className="viewer-empty-state">
                    <strong>Loading version</strong>
                    <p>Fetching the selected file and its latest annotations...</p>
                  </div>
                ) : (
                  getFileViewer()
                )}
                {currentAnnotations && currentAnnotations.markers && currentAnnotations.markers.length > 0 && (
                  <AnnotationViewer 
                    annotationData={currentAnnotations} 
                    imageUrl={selectedFileUrl}
                  />
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Upload New Version</h3>
                <p>Add revised artwork and keep the version history in one place.</p>
              </div>
            </div>
            <div className="upload-panel">
              <input
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="upload-input"
              />
              <p className="upload-hint">
                Accepted formats: PDF, JPEG, PNG (Max 10MB)
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Actions</h3>
                <p>Move the job through review as artwork feedback is completed.</p>
              </div>
            </div>
            <div className="action-stack">
              {job.status === 'Uploaded' && (
                <button onClick={handleMarkUnderReview} className="btn btn-primary">
                  Mark as Under Review
                </button>
              )}
              {job.status === 'Under Review' && (
                <>
                  <button onClick={handleApprove} className="btn btn-success">
                    Approve (No Changes)
                  </button>
                  <button onClick={handleRequestChanges} className="btn btn-danger">
                    Request Changes
                  </button>
                </>
              )}
              {job.status === 'Review Comments' && (
                <>
                  <button onClick={handleApproveAfterReview} className="btn btn-success">
                    Approve After Review
                  </button>
                  <button onClick={handleRequestChanges} className="btn btn-danger">
                    Request Changes
                  </button>
                </>
              )}
              {job.status === 'Approved' && (
                <button onClick={handleMarkCompleted} className="btn btn-success">
                  Mark as Completed
                </button>
              )}
              {job.status === 'Rework' && (
                <button onClick={handleMarkUnderReview} className="btn btn-primary">
                  Mark as Under Review (After Rework)
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Comments / Feedback</h3>
                <p>Capture general review notes that do not need a pinned location.</p>
              </div>
            </div>
            <form onSubmit={handleAddComment}>
              <div className="form-group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{ minHeight: '80px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add Comment
              </button>
            </form>

            <div className="stack-list">
              {comments.length === 0 ? (
                <p style={{ color: '#7f8c8d' }}>No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <p className="comment-message">{comment.message}</p>
                    <p className="comment-time">{formatDate(comment.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Activity Timeline</h3>
                <p>A running log of status changes, uploads, and review activity.</p>
              </div>
            </div>
            <div className="timeline">
              {activity.length === 0 ? (
                <p style={{ color: '#7f8c8d' }}>No activity yet</p>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <p className="timeline-action">{log.action}</p>
                    <p className="timeline-time">{formatDate(log.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {annotations.length > 0 && (
            <div className="card">
              <div className="section-heading">
                <div>
                  <h3>Annotation History</h3>
                  <p>See previous rounds of pinned feedback and close them out when resolved.</p>
                </div>
              </div>
              <div className="stack-list">
                {(() => {
                  // Collect all markers and deduplicate by number
                  const allMarkers = [];
                  annotations.forEach(annotation => {
                    if (annotation.annotationData && annotation.annotationData.markers) {
                      annotation.annotationData.markers.forEach(marker => {
                        allMarkers.push({
                          ...marker,
                          annotationId: annotation.id,
                          annotationStatus: annotation.status,
                          annotationComment: annotation.comment,
                          annotationCreatedAt: annotation.createdAt,
                          closedAt: annotation.closedAt,
                          closedReason: annotation.closedReason
                        });
                      });
                    }
                  });

                  // Deduplicate by marker number, keeping the most recent
                  const uniqueMarkers = [];
                  const seenNumbers = new Set();
                  allMarkers.sort((a, b) => new Date(b.annotationCreatedAt) - new Date(a.annotationCreatedAt));
                  allMarkers.forEach(marker => {
                    if (!seenNumbers.has(marker.number)) {
                      seenNumbers.add(marker.number);
                      uniqueMarkers.push(marker);
                    }
                  });

                  // Filter out resolved markers
                  const unresolvedMarkers = uniqueMarkers.filter(marker => !marker.resolved);

                  return unresolvedMarkers.map(marker => (
                    <div key={marker.id} className="comment-item">
                      <div className="annotation-history__header">
                        <span style={{ fontWeight: '600', color: marker.color }}>
                          #{marker.number}
                        </span>
                        <button
                          className="btn btn-success"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => handleResolveAnnotation(marker.annotationId, marker.id)}
                        >
                          Mark Resolved
                        </button>
                      </div>
                      {marker.comment && (
                        <p className="comment-message" style={{ marginTop: '8px' }}>{marker.comment}</p>
                      )}
                      <p className="comment-time">{formatDate(marker.annotationCreatedAt)}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetail;
