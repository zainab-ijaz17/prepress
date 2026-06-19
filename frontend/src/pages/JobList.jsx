import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

function JobList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll(filter);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">Queue</div>
          <h2>Jobs</h2>
          <p className="page-hero__description">
            Browse every prepress job, filter by stage, and open the right record in one click.
          </p>
        </div>
        {user?.role !== 'customer' && (
          <div className="page-hero__actions">
            <Link to="/jobs/create" className="btn btn-primary">
              New Job
            </Link>
          </div>
        )}
      </section>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Job Queue</h3>
            <p>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} shown{filter ? ` for ${filter}` : ''}.</p>
          </div>
          <div className="filters">
            <label htmlFor="job-filter">Filter by Status</label>
            <select id="job-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Under Review">Under Review</option>
              <option value="Review Comments">Review Comments</option>
              <option value="Rework">Rework</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-panel">
            <strong>No jobs found</strong>
            {user?.role !== 'customer' ? (
              <span>Try another filter or <Link to="/jobs/create">create a new job</Link>.</span>
            ) : (
              <span>Try another filter.</span>
            )}
          </div>
        ) : (
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="job-table-primary">
                        <strong>{job.name}</strong>
                        <span>{job.id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td>{job.customerName}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{formatDate(job.createdAt)}</td>
                    <td>
                      <Link to={`/jobs/${job.id}`} className="btn btn-primary">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobList;
