import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { drfAPI, leadAPI, mrfAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

function DRFDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drf, setDrf] = useState(null);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDRF();
  }, [id]);

  const fetchDRF = async () => {
    try {
      setLoading(true);
      const response = await drfAPI.getById(id);
      setDrf(response.data);

      if (response.data.leadId) {
        const leadResponse = await leadAPI.getById(response.data.leadId);
        setLead(leadResponse.data);
      }
    } catch (error) {
      console.error('Error fetching DRF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setUpdating(true);
      await drfAPI.updateStatus(id, 'Approved');

      // Create MRF when DRF is approved
      await mrfAPI.create({
        drfId: id,
        materialRequirements: drf.specifications,
        quantity: 1,
        assignedTo: 'design', // Assign to design team
        deadline: drf.deadline,
        createdBy: user.id
      });

      await drfAPI.updateStatus(id, 'Sent to SAP');
      alert('DRF approved and sent to SAP!');
      fetchDRF();
    } catch (error) {
      console.error('Error approving DRF:', error);
      alert('Failed to approve DRF');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    try {
      setUpdating(true);
      await drfAPI.updateStatus(id, 'Rejected');
      alert('DRF rejected');
      fetchDRF();
    } catch (error) {
      console.error('Error rejecting DRF:', error);
      alert('Failed to reject DRF');
    } finally {
      setUpdating(false);
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

  if (loading) {
    return <div className="page-shell">Loading...</div>;
  }

  if (!drf) {
    return <div className="page-shell">DRF not found</div>;
  }

  const canApproveReject = user?.role === 'customer' && drf.status === 'Pending Review';
  const canEdit = user?.role === 'sales' && drf.status === 'Draft';

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">DRF Details</div>
          <h2>{drf.projectName}</h2>
          <p className="page-hero__description">
            Review and manage this Design Request Form.
          </p>
        </div>
        <div className="page-hero__actions">
          <button onClick={() => navigate('/drfs')} className="btn btn-secondary">
            Back to DRFs
          </button>
        </div>
      </section>

      <div className="job-detail-grid job-detail-grid--single">
        <div className="job-main">
          <div className="card">
            <div className="section-heading">
              <div>
                <h3>DRF Information</h3>
                <p>Project specifications and requirements.</p>
              </div>
              <div className="drf-detail-header-meta">
                <span className="drf-detail-header-date">
                  {new Date(drf.createdAt).toLocaleDateString()}
                </span>
                <span className={getStatusBadge(drf.status)}>{drf.status}</span>
              </div>
            </div>

            <div className="detail-facts">
              {lead && (
                <div className="detail-fact">
                  <span className="detail-fact__label">Customer</span>
                  <span className="detail-fact__value">{lead.customerName}</span>
                </div>
              )}
              {lead && (
                <div className="detail-fact">
                  <span className="detail-fact__label">Company</span>
                  <span className="detail-fact__value">{lead.companyName}</span>
                </div>
              )}
              <div className="detail-fact">
                <span className="detail-fact__label">Created By</span>
                <span className="detail-fact__value">{drf.createdBy}</span>
              </div>
              {drf.deadline && (
                <div className="detail-fact">
                  <span className="detail-fact__label">Deadline</span>
                  <span className="detail-fact__value">
                    {new Date(drf.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="detail-description">
              <span>Specifications</span>
              <p>{drf.specifications}</p>
            </div>

            <div className="detail-description">
              <span>Requirements</span>
              <p>{drf.requirements}</p>
            </div>

            {canApproveReject && (
              <div className="form-actions form-actions--right">
                <button
                  onClick={handleReject}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Reject DRF'}
                </button>
                <button
                  onClick={handleApprove}
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Approve & Send to SAP'}
                </button>
              </div>
            )}

            {canEdit && (
              <div className="form-actions form-actions--right">
                <button
                  onClick={() => drfAPI.updateStatus(id, 'Pending Review').then(() => fetchDRF())}
                  className="btn btn-primary"
                >
                  Send to Customer for Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DRFDetail;
