import { useState, useEffect } from 'react';
import { mrfAPI, drfAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function MRFList() {
  const { user } = useAuth();
  const [mrfs, setMrfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMRFs();
  }, []);

  const fetchMRFs = async () => {
    try {
      setLoading(true);
      const response = await mrfAPI.getAll('design');
      const mrfsWithDrf = await Promise.all(
        response.data.map(async (mrf) => {
          try {
            const drfResponse = await drfAPI.getById(mrf.drfId);
            return { ...mrf, drf: drfResponse.data };
          } catch {
            return { ...mrf, drf: null };
          }
        })
      );
      setMrfs(mrfsWithDrf);
    } catch (error) {
      console.error('Error fetching MRFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Assigned': 'badge badge--amber',
      'In Progress': 'badge badge--blue',
      'Completed': 'badge badge--green'
    };
    return badges[status] || 'badge badge--gray';
  };

  const handleStartWork = async (mrfId) => {
    try {
      await mrfAPI.updateStatus(mrfId, 'In Progress');
      fetchMRFs();
    } catch (error) {
      console.error('Error updating MRF:', error);
    }
  };

  const handleCompleteWork = async (mrfId) => {
    try {
      await mrfAPI.updateStatus(mrfId, 'Completed');
      fetchMRFs();
    } catch (error) {
      console.error('Error updating MRF:', error);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">Design Team</div>
          <h2>Assigned Tasks</h2>
          <p className="page-hero__description">
            View and manage Material Request Forms assigned to the design team.
          </p>
        </div>
      </section>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Material Requests</h3>
            <p>Tasks assigned to the design team.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading tasks...</p>
        ) : mrfs.length === 0 ? (
          <p>No assigned tasks found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Requirements</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mrfs.map((mrf) => (
                <tr key={mrf.id}>
                  <td>
                    {mrf.drf ? mrf.drf.projectName : 'Unknown Project'}
                  </td>
                  <td>{mrf.materialRequirements}</td>
                  <td>
                    <span className={getStatusBadge(mrf.status)}>{mrf.status}</span>
                  </td>
                  <td>{new Date(mrf.createdAt).toLocaleDateString()}</td>
                  <td>
                    {mrf.jobId && (
                      <Link to={`/jobs/${mrf.jobId}`} className="btn btn-secondary btn-sm">
                        Open Job
                      </Link>
                    )}
                    {mrf.status === 'Assigned' && (
                      <button
                        onClick={() => handleStartWork(mrf.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Start Work
                      </button>
                    )}
                    {mrf.status === 'In Progress' && (
                      <button
                        onClick={() => handleCompleteWork(mrf.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MRFList;
