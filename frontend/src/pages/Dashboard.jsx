import { useState, useEffect } from 'react';
import { jobAPI, leadAPI, drfAPI, mrfAPI } from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    leads: 0,
    drfs: 0,
    mrfs: 0,
    jobs: 0,
    leadTiming: { onTime: 0, late: 0, pending: 0 },
    drfTiming: { onTime: 0, late: 0, pending: 0 },
    mrfTiming: { onTime: 0, late: 0, pending: 0 },
    jobTiming: { onTime: 0, late: 0, pending: 0 },
    totalLate: 0,
    totalOnTime: 0,
    totalPending: 0,
    totalCompleted: 0
  });

  const getTileRingStyle = (timing) => {
    const pending = timing?.pending || 0;
    const onTime = timing?.onTime || 0;
    const late = timing?.late || 0;
    const noDeadline = Math.max(0, pending - onTime - late);

    if (pending <= 0) {
      return {
        background: 'conic-gradient(#e2e8f0 0deg 360deg)'
      };
    }

    const lateDeg = (late / pending) * 360;
    const onTimeDeg = (onTime / pending) * 360;
    const noDeadlineDeg = (noDeadline / pending) * 360;

    const a0 = 0;
    const a1 = a0 + lateDeg;
    const a2 = a1 + onTimeDeg;
    const a3 = a2 + noDeadlineDeg;

    return {
      background: `conic-gradient(from -90deg, #ef4444 ${a0}deg ${a1}deg, #22c55e ${a1}deg ${a2}deg, #eab308 ${a2}deg ${a3}deg, #e2e8f0 ${a3}deg 360deg)`
    };
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [leadsRes, drfsRes, mrfsRes, jobsRes] = await Promise.all([
        leadAPI.getAll(),
        drfAPI.getAll(),
        mrfAPI.getAll(),
        jobAPI.getAll()
      ]);

      const leads = leadsRes.data || [];
      const drfs = drfsRes.data || [];
      const mrfs = mrfsRes.data || [];
      const jobs = jobsRes.data || [];

      const now = new Date();
      const normalizeStatus = (s) => (s || '').toString().trim().toLowerCase();
      const hasDeadline = (item) => !!item?.deadline;
      const parseDeadline = (item) => {
        const d = new Date(item.deadline);
        return Number.isNaN(d.getTime()) ? null : d;
      };
      const isClosed = (item) => {
        const s = normalizeStatus(item?.status);
        return ['approved', 'completed', 'resolved', 'closed', 'rejected', 'sent to sap'].includes(s);
      };
      const timing = (items) => {
        return items.reduce(
          (acc, item) => {
            if (isClosed(item)) return acc;
            acc.pending += 1;

            if (!hasDeadline(item)) return acc;
            const d = parseDeadline(item);
            if (!d) return acc;

            if (d.getTime() < now.getTime()) {
              acc.late += 1;
            } else {
              acc.onTime += 1;
            }
            return acc;
          },
          { onTime: 0, late: 0, pending: 0 }
        );
      };

      const drfById = new Map(drfs.map((d) => [d.id, d]));
      const mrfById = new Map(mrfs.map((m) => [m.id, m]));

      const getRootLeadIdForDrf = (drf) => drf?.leadId || drf?.id || null;
      const getRootLeadIdForMrf = (mrf) => {
        const linkedDrf = mrf?.drfId ? drfById.get(mrf.drfId) : null;
        return getRootLeadIdForDrf(linkedDrf) || mrf?.id || null;
      };
      const getRootLeadIdForJob = (job) => {
        const linkedDrf = job?.drfId ? drfById.get(job.drfId) : null;
        if (linkedDrf) return getRootLeadIdForDrf(linkedDrf);

        const linkedMrf = job?.mrfId ? mrfById.get(job.mrfId) : null;
        if (linkedMrf) return getRootLeadIdForMrf(linkedMrf);

        return job?.id || null;
      };

      const chains = new Map();
      const ensureChain = (rootId) => {
        if (!rootId) return null;
        if (!chains.has(rootId)) {
          chains.set(rootId, { items: [] });
        }
        return chains.get(rootId);
      };

      leads.forEach((l) => {
        const c = ensureChain(l.id);
        if (c) c.items.push({ kind: 'lead', item: l });
      });
      drfs.forEach((d) => {
        const c = ensureChain(getRootLeadIdForDrf(d));
        if (c) c.items.push({ kind: 'drf', item: d });
      });
      mrfs.forEach((m) => {
        const c = ensureChain(getRootLeadIdForMrf(m));
        if (c) c.items.push({ kind: 'mrf', item: m });
      });
      jobs.forEach((j) => {
        const c = ensureChain(getRootLeadIdForJob(j));
        if (c) c.items.push({ kind: 'job', item: j });
      });

      const chainCounts = { late: 0, pending: 0, completed: 0 };

      for (const [, chain] of chains) {
        const items = chain.items;
        if (items.length === 0) continue;

        const hasClosedJob = items.some((x) => x.kind === 'job' && isClosed(x.item));
        if (hasClosedJob) {
          chainCounts.completed += 1;
          continue;
        }

        const openItems = items.map((x) => x.item).filter((it) => !isClosed(it));
        if (openItems.length === 0) {
          chainCounts.completed += 1;
          continue;
        }

        const deadlines = openItems
          .map((it) => parseDeadline(it))
          .filter(Boolean)
          .map((d) => d.getTime());

        if (deadlines.length > 0 && Math.min(...deadlines) < now.getTime()) {
          chainCounts.late += 1;
        } else {
          chainCounts.pending += 1;
        }
      }

      const totalLate = chainCounts.late;
      const totalPending = chainCounts.pending;
      const totalCompleted = chainCounts.completed;
      const totalOnTime = 0;

      setStats({
        leads: leads.length,
        drfs: drfs.length,
        mrfs: mrfs.length,
        jobs: jobs.length,
        leadTiming: timing(leads),
        drfTiming: timing(drfs),
        mrfTiming: timing(mrfs),
        jobTiming: timing(jobs),
        totalLate,
        totalOnTime,
        totalPending,
        totalCompleted
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { label: 'Late', value: stats.totalLate, color: '#dc2626' },
    { label: 'Pending', value: stats.totalPending, color: '#eab308' },
    { label: 'Completed', value: stats.totalCompleted, color: '#16a34a' }
  ];

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'customer':
        return {
          title: 'Customer Dashboard',
          description: 'Create leads, manage DRFs, and review artwork approvals.',
          actions: [
            { label: 'Create Lead', to: '/leads/create',  desc: 'Start a new prepress project' },
            { label: 'My DRFs', to: '/drfs', desc: 'View and manage Design Request Forms' },
            { label: 'My Jobs', to: '/jobs',  desc: 'Track artwork review progress' }
          ],
          workflow: [
            { step: '1', title: 'Create Lead', desc: 'Submit a new prepress request' },
            { step: '2', title: 'Generate DRF', desc: 'Create Design Request Form' },
            { step: '3', title: 'Review DRF', desc: 'Review and approve the DRF' },
            { step: '4', title: 'Review Artwork', desc: 'Approve or request changes' }
          ]
        };
      case 'sales':
        return {
          title: 'Sales Dashboard',
          description: 'Manage leads, create DRFs, and track customer approvals.',
          actions: [
            { label: 'Create Lead', to: '/leads/create',  desc: 'Create a new customer lead' },
            { label: 'Create DRF', to: '/drfs/create',  desc: 'Generate Design Request Form' },
            { label: 'Pending DRFs', to: '/drfs?status=pending',  desc: 'DRFs awaiting customer review' }
          ],
          workflow: [
            { step: '1', title: 'Create Lead', desc: 'Add new customer project' },
            { step: '2', title: 'Create DRF', desc: 'Generate Design Request Form' },
            { step: '3', title: 'Send to Customer', desc: 'Submit for customer review' },
            { step: '4', title: 'Track Approval', desc: 'Monitor DRF approval status' }
          ]
        };
      case 'design':
        return {
          title: 'Design Dashboard',
          description: 'Upload artwork and manage revisions.',
          actions: [
            { label: 'Upload Artwork', to: '/jobs', desc: 'Upload completed designs' },
            { label: 'Pending Revisions', to: '/jobs?status=Rework', desc: 'Jobs requiring changes' }
          ],
          workflow: [
            { step: '1', title: 'Design Work', desc: 'Create artwork based on requirements' },
            { step: '2', title: 'Upload Artwork', desc: 'Submit completed design' },
            { step: '3', title: 'Handle Feedback', desc: 'Revise based on customer comments' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Track review workload, spot jobs that need action, and jump directly into the next approval task.',
          actions: [
            { label: 'Create Job', to: '/jobs/create',  desc: 'Open a fresh prepress request' },
            { label: 'View Jobs', to: '/jobs',  desc: 'Browse all jobs and filter by status' }
          ],
          workflow: [
            { step: '1', title: 'Create and upload', desc: 'Set up the job and add artwork' },
            { step: '2', title: 'Review and annotate', desc: 'Mark changes on image files' },
            { step: '3', title: 'Approve or rework', desc: 'Move job forward when ready' }
          ]
        };
    }
  };

  const roleContent = getRoleBasedContent();

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <div className="page-hero__eyebrow">Overview</div>
          <h2>{roleContent.title}</h2>
          <p className="page-hero__description">
            {roleContent.description}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link to={roleContent.actions[0].to} className="btn btn-primary">
            {roleContent.actions[0].label}
          </Link>
          <Link to="/jobs" className="btn btn-secondary">
            View All Jobs
          </Link>
        </div>
      </section>

      <div className="stats-grid" style={{ marginBottom: '0px' }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              padding: '3px',
              borderRadius: '16px'
            }}
          >
            <div
              className="stat-card"
              style={{
                borderRadius: '13px',
                padding: '40px',
                minHeight: '25px',
                border: `3px solid ${card.color}`
              }}
            >
              <div className="stat-card__label" style={{ textAlign: 'center', fontSize: '24px' }}>{card.label}</div>
              <h3 style={{ textAlign: 'center', fontSize: '60px', margin: '0' }}>
                <span
                  style={{
                    color: card.color,
                    WebkitTextFillColor: card.color,
                    background: 'none',
                    WebkitBackgroundClip: 'initial'
                  }}
                >
                  {card.value}
                </span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-grid" style={{ marginTop: '0px' }}>
        {[
          { label: 'Leads', value: stats.leads, accent: 'black' },
          { label: 'DRFs', value: stats.drfs, accent: 'black' },
          { label: 'MRFs', value: stats.mrfs, accent: 'black' },
          { label: 'Jobs', value: stats.jobs, accent: 'black' }
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: '1px',
              borderRadius: '1px'
            }}
          >
            <div className={`stat-card stat-card--${card.accent}`} style={{ borderRadius: '13px', padding: '20px', minHeight: '12px' }}>
              <div className="stat-card__label" style={{ textAlign: 'center', fontSize: '10px' }}>{card.label}</div>
              <h3 style={{ textAlign: 'center', fontSize: '15px', margin: '4px 0' }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Start new work or jump into the current review queue.</p>
            </div>
          </div>
          <div className="quick-actions-grid">
            {roleContent.actions.map((action) => (
              <Link key={action.label} to={action.to} className="quick-action-card">
                <strong>{action.icon} {action.label}</strong>
                <span>{action.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Workflow Snapshot</h3>
              <p>A simple guide for how work moves through the portal.</p>
            </div>
          </div>
          <div className="workflow-list">
            {roleContent.workflow.map((step) => (
              <div key={step.step} className="workflow-step">
                <strong>{step.step}. {step.title}</strong>
                <span>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
