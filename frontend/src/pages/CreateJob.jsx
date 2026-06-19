import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';

function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    customerName: '',
    description: '',
    deadline: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.customerName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await jobAPI.create(formData);
      navigate('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job');
    }
  };

  return (
    <div className="page-shell create-job-page">
      <section className="create-job-header">
        <div>
          <h2>Create New Job</h2>
          <p className="create-job-header__description">
            Start with the essentials. You can upload artwork and add review notes after the job is created.
          </p>
        </div>
      </section>

      <div className="create-job-layout create-job-layout--clean">
        <div className="card create-job-card">
          <div className="section-heading create-job-card__heading">
            <div>
              <h3>Job Details</h3>
              <p>Only the job name and customer are required.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="create-job-form">
            <div className="form-group">
              <label htmlFor="name">Job Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Summer Beverage Label Update"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="FreshSip Foods"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Notes</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional production notes or revision details."
              />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions create-job-form__actions">
              <button type="submit" className="btn btn-primary">
                Create Job
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/jobs')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <aside className="card create-job-aside">
          <h3>Next</h3>
          <ul className="create-job-checklist">
            <li>Upload the first artwork version.</li>
            <li>Review and annotate changes.</li>
            <li>Track comments and approval status.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default CreateJob;
