const express = require('express');
const Application=require('../model/application')
const router = express.Router();
const {
  createProject,
  updateProject,
  deleteProject,
  getOpenProjects,
  searchProjects,
  filterProjects,
  createApplication,
  getProjectApplications,
  updateApplicationStatus,
  getMyProjects,
} = require('../controller/gigcontroller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/projects', authMiddleware, createProject); // Create gig
router.put('/projects/:id', authMiddleware, updateProject); // Update gig
router.delete('/projects/:id', authMiddleware, deleteProject); // Delete gig
router.get('/projects', getOpenProjects); // Get all open gigs (public)
router.get('/projects/search', searchProjects); // Search gigs (public)
router.get('/projects/filter', filterProjects); // Filter gigs (public)
router.post('/projects/applications', authMiddleware, createApplication); // Submit application
router.get('/my-applications', authMiddleware, async (req, res) => { // New endpoint
  try {
    const applications = await Application.find({ freelancer_id: req.user.id })
      .populate('project_id', 'title description'); // Populate project details
    res.status(200).json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/projects/:id/applications', authMiddleware, getProjectApplications); // Get applications for a gig
router.put('/projects/applications/:id', authMiddleware, updateApplicationStatus); // Update application status

router.get('/my-projects', authMiddleware, getMyProjects);

module.exports = router;