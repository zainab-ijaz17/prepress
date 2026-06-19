import { useState, useEffect } from 'react';
import { drfAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function DRFList() {
  const { user } = useAuth();
  const [drfs, setDrfs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDRFs();
  }, [filter]);

  const fetchDRFs = async () => {
    try {
      setLoading(true);
      const response = filter === 'all'
        ? await drfAPI.getAll()
        : await drfAPI.getAll(filter);
      setDrfs(response.data);
    } catch (error) {
      console.error('Error fetching DRFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Draft': 'badge badge--gray',
      'Pending Review': 'badge badge--amber',
      'Approved': 'badge badge--green',
      'Rejected': 'badge badge--red',
      'Sent to SAP': 'badge badge--blue',
      'Completed': 'badge badge--green'
    };
    return badges[status] || 'badge badge--gray';
  };

  const handleSendToCustomer = async (drfId) => {
    try {
      await drfAPI.updateStatus(drfId, 'Pending Review');
      fetchDRFs();
    } catch (error) {
      console.error('Error sending DRF to customer:', error);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">Design Request Forms</div>
          <h2>DRF Management</h2>
          <p className="page-hero__description">
            Manage Design Request Forms and track their approval status.
          </p>
        </div>
        <div className="page-hero__actions">
          {user?.role === 'sales' && (
            <Link to="/drfs/create" className="btn btn-primary">
              Create DRF
            </Link>
          )}
        </div>
      </section>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>All DRFs</h3>
            <p>Filter and manage Design Request Forms.</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-group input"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Sent to SAP">Sent to SAP</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading DRFs...</p>
        ) : drfs.length === 0 ? (
          <p>No DRFs found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drfs.map((drf) => (
                <tr key={drf.id}>
                  <td>
                    <Link to={`/drfs/${drf.id}`} className="job-name">
                      {drf.projectName}
                    </Link>
                  </td>
                  <td>
                    <span className={getStatusBadge(drf.status)}>{drf.status}</span>
                  </td>
                  <td>{drf.createdBy}</td>
                  <td>{new Date(drf.createdAt).toLocaleDateString()}</td>
                  <td>
                    {drf.status === 'Draft' && user?.role === 'sales' && (
                      <button
                        onClick={() => handleSendToCustomer(drf.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Send to Customer
                      </button>
                    )}
                    <Link to={`/drfs/${drf.id}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
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

export default DRFList;
