const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and 127.0.0.1 on any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins for MVP
  },
  credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory data storage
let jobs = [];
let fileVersions = [];
let comments = [];
let activityLogs = [];
let annotations = [];
let leads = [];
let drfs = [];
let mrfs = [];
let users = [
  {
    id: '1',
    username: 'sales@packages.com',
    password: '123456',
    role: 'sales',
    name: 'Sales User'
  },
  {
    id: '2',
    username: 'customer@packages.com',
    password: '123456',
    role: 'customer',
    name: 'Customer User'
  },
  {
    id: '3',
    username: 'design@packages.com',
    password: '123456',
    role: 'design',
    name: 'Design User'
  }
];

// Helper function to add activity log
const addActivityLog = (jobId, action) => {
  const log = {
    id: uuidv4(),
    jobId,
    action,
    timestamp: new Date().toISOString()
  };
  activityLogs.push(log);
  return log;
};

// Helper function to get next version number for a job
const getNextVersionNumber = (jobId) => {
  const jobFiles = fileVersions.filter(f => f.jobId === jobId);
  if (jobFiles.length === 0) return 1;
  return Math.max(...jobFiles.map(f => f.versionNumber)) + 1;
};

// API Routes

// Login endpoint (dummy auth)
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    }
  });
});

// Lead endpoints
app.get('/leads', (req, res) => {
  res.json(leads);
});

app.post('/leads', (req, res) => {
  const { customerName, companyName, contactEmail, contactPhone, description, deadline, createdBy } = req.body;

  const newLead = {
    id: uuidv4(),
    customerName,
    companyName,
    contactEmail,
    contactPhone,
    description,
    deadline,
    status: 'New',
    createdBy,
    createdAt: new Date().toISOString()
  };

  leads.push(newLead);
  res.status(201).json(newLead);
});

app.get('/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  res.json(lead);
});

// DRF endpoints
app.get('/drfs', (req, res) => {
  const { status } = req.query;
  let filteredDrfs = drfs;

  if (status) {
    filteredDrfs = drfs.filter(d => d.status === status);
  }

  res.json(filteredDrfs);
});

app.post('/drfs', (req, res) => {
  const { leadId, projectName, specifications, requirements, deadline, createdBy } = req.body;

  const newDrf = {
    id: uuidv4(),
    leadId,
    projectName,
    specifications,
    requirements,
    deadline,
    status: 'Draft',
    createdBy,
    createdAt: new Date().toISOString()
  };

  drfs.push(newDrf);
  res.status(201).json(newDrf);
});

app.get('/drfs/:id', (req, res) => {
  const drf = drfs.find(d => d.id === req.params.id);

  if (!drf) {
    return res.status(404).json({ error: 'DRF not found' });
  }

  res.json(drf);
});

app.patch('/drfs/:id/status', (req, res) => {
  const { status } = req.body;
  const drf = drfs.find(d => d.id === req.params.id);

  if (!drf) {
    return res.status(404).json({ error: 'DRF not found' });
  }

  drf.status = status;
  drf.updatedAt = new Date().toISOString();

  res.json(drf);
});

// MRF endpoints
app.get('/mrf', (req, res) => {
  const { assignedTo } = req.query;
  let filteredMrfs = mrfs;

  if (assignedTo) {
    filteredMrfs = mrfs.filter(m => m.assignedTo === assignedTo);
  }

  res.json(filteredMrfs);
});

app.post('/mrf', (req, res) => {
  const { drfId, materialRequirements, quantity, assignedTo, deadline, createdBy } = req.body;

  const newMrf = {
    id: uuidv4(),
    drfId,
    materialRequirements,
    quantity,
    assignedTo,
    status: 'Assigned',
    deadline,
    createdBy,
    createdAt: new Date().toISOString()
  };

  const linkedDrf = drfs.find(d => d.id === drfId);
  const linkedLead = linkedDrf?.leadId ? leads.find(l => l.id === linkedDrf.leadId) : null;

  const newJob = {
    id: uuidv4(),
    name: linkedDrf?.projectName || `MRF ${newMrf.id.substring(0, 8)}`,
    customerName: linkedLead?.customerName || 'Unknown',
    description: linkedDrf?.requirements || '',
    status: 'Uploaded',
    createdByRole: 'design',
    createdBy: 'system',
    drfId: drfId || null,
    mrfId: newMrf.id,
    deadline: linkedDrf?.deadline || deadline,
    createdAt: new Date().toISOString()
  };

  newMrf.jobId = newJob.id;

  mrfs.push(newMrf);
  jobs.push(newJob);
  addActivityLog(newJob.id, `Job created from MRF assignment: ${newJob.name}`);
  res.status(201).json(newMrf);
});

app.patch('/mrf/:id/status', (req, res) => {
  const { status } = req.body;
  const mrf = mrfs.find(m => m.id === req.params.id);

  if (!mrf) {
    return res.status(404).json({ error: 'MRF not found' });
  }

  mrf.status = status;
  mrf.updatedAt = new Date().toISOString();

  res.json(mrf);
});

// Get all jobs
app.get('/jobs', (req, res) => {
  const { status } = req.query;
  const requestingUserRole = req.header('x-user-role');
  let filteredJobs = jobs;
  
  if (status) {
    filteredJobs = jobs.filter(job => job.status === status);
  }

  if (requestingUserRole === 'customer') {
    filteredJobs = filteredJobs.filter(job => !job.createdByRole || ['sales', 'design'].includes(job.createdByRole));
  }
  
  res.json(filteredJobs);
});

// Create a new job
app.post('/jobs', (req, res) => {
  const requestingUserRole = req.header('x-user-role');
  const requestingUserName = req.header('x-user-name');
  const { name, customerName, description, deadline } = req.body;

  if (requestingUserRole === 'customer') {
    return res.status(403).json({ error: 'Customers are not allowed to create jobs' });
  }
  
  const newJob = {
    id: uuidv4(),
    name,
    customerName,
    description,
    status: 'Uploaded',
    createdByRole: requestingUserRole || 'unknown',
    createdBy: requestingUserName || 'unknown',
    deadline,
    createdAt: new Date().toISOString()
  };
  
  jobs.push(newJob);
  addActivityLog(newJob.id, `Job created: ${name}`);
  
  res.status(201).json(newJob);
});

// Get a specific job
app.get('/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Update job status
app.patch('/jobs/:id/status', (req, res) => {
  const { status } = req.body;
  const job = jobs.find(j => j.id === req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const oldStatus = job.status;
  job.status = status;
  addActivityLog(job.id, `Status changed from ${oldStatus} to ${status}`);
  
  res.json(job);
});

// Upload file for a job
app.post('/jobs/:id/upload', upload.single('file'), (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const versionNumber = getNextVersionNumber(job.id);

  // Close pending annotations from previous file versions
  const previousFileVersions = fileVersions.filter(f => f.jobId === job.id);
  const previousFileIds = previousFileVersions.map(f => f.id);

  annotations.forEach(annotation => {
    if (previousFileIds.includes(annotation.fileId) && annotation.status === 'pending') {
      annotation.status = 'closed';
      annotation.closedAt = new Date().toISOString();
      annotation.closedReason = 'New version uploaded';
    }
  });

  const newFileVersion = {
    id: uuidv4(),
    jobId: job.id,
    fileUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    versionNumber,
    uploadedAt: new Date().toISOString()
  };

  fileVersions.push(newFileVersion);

  // Update job status if it's in Rework state
  if (job.status === 'Rework') {
    job.status = 'Uploaded';
    addActivityLog(job.id, `File uploaded (Version ${versionNumber}). Previous annotations closed.`);
  } else {
    addActivityLog(job.id, `File uploaded (Version ${versionNumber}). Previous annotations closed.`);
  }

  res.status(201).json(newFileVersion);
});

// Get files for a job
app.get('/jobs/:id/files', (req, res) => {
  const jobFiles = fileVersions
    .filter(f => f.jobId === req.params.id)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  
  res.json(jobFiles);
});

// Add comment to a job
app.post('/jobs/:id/comments', (req, res) => {
  const { message } = req.body;
  const job = jobs.find(j => j.id === req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const newComment = {
    id: uuidv4(),
    jobId: job.id,
    message,
    createdAt: new Date().toISOString()
  };
  
  comments.push(newComment);
  addActivityLog(job.id, `Comment added: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
  
  res.status(201).json(newComment);
});

// Get comments for a job
app.get('/jobs/:id/comments', (req, res) => {
  const jobComments = comments
    .filter(c => c.jobId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(jobComments);
});

// Get activity logs for a job
app.get('/jobs/:id/activity', (req, res) => {
  const jobActivity = activityLogs
    .filter(a => a.jobId === req.params.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json(jobActivity);
});

// Save annotations for a file version
app.post('/files/:fileId/annotations', (req, res) => {
  const { annotations: annotationData, comment } = req.body;
  const fileVersion = fileVersions.find(f => f.id === req.params.fileId);
  
  if (!fileVersion) {
    return res.status(404).json({ error: 'File version not found' });
  }
  
  const newAnnotation = {
    id: uuidv4(),
    fileId: fileVersion.id,
    jobId: fileVersion.jobId,
    annotationData, // Array of annotation objects (drawings, comments, etc.)
    comment,
    status: 'review-comments', // pending, review-comments, resolved
    createdAt: new Date().toISOString()
  };
  
  annotations.push(newAnnotation);
  addActivityLog(fileVersion.jobId, `Annotations added to file version ${fileVersion.versionNumber}`);
  
  res.status(201).json(newAnnotation);
});

// Get annotations for a file version
app.get('/files/:fileId/annotations', (req, res) => {
  const fileAnnotations = annotations
    .filter(a => a.fileId === req.params.fileId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(fileAnnotations);
});

// Update annotation status
app.patch('/annotations/:id/status', (req, res) => {
  const { status } = req.body;
  const annotation = annotations.find(a => a.id === req.params.id);

  if (!annotation) {
    return res.status(404).json({ error: 'Annotation not found' });
  }

  const oldStatus = annotation.status;
  annotation.status = status;
  addActivityLog(annotation.jobId, `Annotation status changed from ${oldStatus} to ${status}`);

  res.json(annotation);
});

// Update individual marker status within an annotation
app.patch('/annotations/:id/markers/:markerId/status', (req, res) => {
  const { resolved } = req.body;
  const annotation = annotations.find(a => a.id === req.params.id);

  if (!annotation) {
    return res.status(404).json({ error: 'Annotation not found' });
  }

  if (!annotation.annotationData || !annotation.annotationData.markers) {
    return res.status(404).json({ error: 'No markers found in annotation' });
  }

  const marker = annotation.annotationData.markers.find(m => m.id == req.params.markerId);
  if (!marker) {
    return res.status(404).json({ error: 'Marker not found' });
  }

  marker.resolved = resolved;
  addActivityLog(annotation.jobId, `Marker #${marker.number} marked as ${resolved ? 'resolved' : 'unresolved'}`);

  res.json(annotation);
});

// Get all annotations for a job
app.get('/jobs/:id/annotations', (req, res) => {
  const jobAnnotations = annotations
    .filter(a => a.jobId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(jobAnnotations);
});

// Serve uploaded files with proper MIME types
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
