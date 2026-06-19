import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

function CreateLead() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Skip selection screen for customer users
  useEffect(() => {
    if (user?.role === 'customer') {
      setCustomerType('new');
      // Pre-fill customer info from user profile
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        contactEmail: user.username || ''
      }));
    }
  }, [user]);

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
      const response = await leadAPI.create({
        ...formData,
        createdBy: user.id
      });

      const createdLeadId = response?.data?.id;
      if (user?.role === 'customer' && createdLeadId) {
        navigate(`/drfs/create?leadId=${createdLeadId}`);
      } else {
        navigate('/drfs');
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!customerType) {
    return (
      <div className="page-shell">
        <section className="page-hero">
          <div>
            <div className="page-hero__eyebrow">New Lead</div>
            <h2>Create Lead</h2>
            <p className="page-hero__description">
              Select the customer type to start the prepress workflow process.
            </p>
          </div>
        </section>

        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Select Customer Type</h3>
              <p>Choose whether this is for an existing customer or a new customer.</p>
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              onClick={() => setCustomerType('existing')}
              className="quick-action-card"
              style={{ cursor: 'pointer', textAlign: 'left' }}
            >
              <strong>👤 Existing Customer</strong>
              <span>Create a lead for a customer already in your system.</span>
            </button>
            <button
              onClick={() => setCustomerType('new')}
              className="quick-action-card"
              style={{ cursor: 'pointer', textAlign: 'left' }}
            >
              <strong>➕ New Customer</strong>
              <span>Add a new customer to the system and create a lead.</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showSelectionScreen = user?.role !== 'customer';

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">New Lead</div>
          <h2>
            {customerType === 'existing' ? 'Create Lead - Existing Customer' : 'Create Lead'}
          </h2>
          <p className="page-hero__description">
            {customerType === 'existing'
              ? 'Create a new lead for an existing customer.'
              : 'Enter the project details to create a new lead.'}
          </p>
        </div>
        {showSelectionScreen && (
          <div className="page-hero__actions">
            <button onClick={() => setCustomerType(null)} className="btn btn-secondary">
              Back
            </button>
          </div>
        )}
      </section>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Lead Information</h3>
            <p>Enter the customer and project details for this lead.</p>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-job-layout">
          <div className="create-job-main">
            {customerType === 'new' && (
              <>
                <div className="form-group">
                  <label htmlFor="customerName">Customer Name *</label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email *</label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="Enter contact email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactPhone">Contact Phone</label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="Enter contact phone number"
                  />
                </div>
              </>
            )}

            {customerType === 'existing' && (
              <>
                <div className="form-group">
                  <label htmlFor="customerName">Select Customer *</label>
                  <select
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select an existing customer</option>
                    <option value="Customer A">Customer A</option>
                    <option value="Customer B">Customer B</option>
                    <option value="Customer C">Customer C</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="companyName">Company</label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company name (auto-filled)"
                    readOnly
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the project requirements"
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
              {showSelectionScreen && (
                <button type="button" onClick={() => setCustomerType(null)} className="btn btn-secondary">
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateLead;
