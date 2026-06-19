import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { drfAPI, leadAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

function CreateDRF() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState({
    leadId: '',
    projectName: '',
    specifications: '',
    requirements: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      setFormData((prev) => ({
        ...prev,
        leadId
      }));
    }
  }, [searchParams]);

  const fetchLeads = async () => {
    try {
      const response = await leadAPI.getAll();
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await drfAPI.create({
        ...formData,
        createdBy: user.id
      });
      navigate('/drfs');
    } catch (err) {
      setError('Failed to create DRF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">New DRF</div>
          <h2>Create Design Request Form</h2>
          <p className="page-hero__description">
            Create a new Design Request Form for an approved lead.
          </p>
        </div>
      </section>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>DRF Information</h3>
            <p>Enter the design specifications and requirements.</p>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-job-layout">
          <div className="create-job-main">
            <div className="form-group">
              <label htmlFor="leadId">Select Lead *</label>
              <select
                id="leadId"
                name="leadId"
                value={formData.leadId}
                onChange={handleChange}
                required
              >
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.customerName} - {lead.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="projectName">Project Name *</label>
              <input
                id="projectName"
                name="projectName"
                type="text"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="specifications">Specifications *</label>
              <textarea
                id="specifications"
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                placeholder="Enter design specifications"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements *</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="Enter project requirements"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/drfs')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create DRF'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDRF;
