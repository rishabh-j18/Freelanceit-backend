const Project = require("../model/project");
const Application = require("../model/application");
const Payment = require("../model/payment");
const Contract = require("../model/contract");
const User = require("../model/user");
const Client = require("../model/client");
const Freelancer = require("../model/freelancer");
const sanitize = require("mongo-sanitize");

//blockchain code to be used
async function storeReportOnBlockchain(blockchainData) {
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/079a8f73494a4ef3b0df149d40815323"
  );

  // Private key for using wallet to submit gas price while writing on gas
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key not found. Please add it to your .env file.");
  }

  // Create a wallet and connect it to the provider
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Wallet address:", wallet.address);
  // Smart contract configuration
  const contractAddress = "0x";
  console.log("Contract address:", contractAddress);

  const contractABI = [];

  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  console.log("Blockchain data:", blockchainData);
  try {
    // Call the submitReport function
    const txResponse = await contract.submitReport(blockchainData);

    // Wait for transaction to be mined
    const receipt = await txResponse.wait();

    // Extract reportCount from the function's return value
    const reportCount = receipt.events[0].args[0].toNumber(); // Assuming NewReport emits the reportCount as the first argument

    console.log("Report Count :", reportCount);
    console.log("Receipt :", receipt);
    console.log("Receipt event :", receipt.events[0]);
    console.log("Event args", receipt.events[0].args[0]);

    return { transactionHash: receipt.transactionHash, reportCount };
  } catch (error) {
    console.error("Error submitting report to blockchain:", error.message);
    throw new Error("Blockchain transaction failed");
  }
}

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      categories,
      required_skills,
      location,
    } = req.body;
    const client_id = req.user.id;

    // Check required fields
    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate types and values
    if (typeof budget !== "number" || budget <= 0) {
      return res
        .status(400)
        .json({ message: "Budget must be a positive number" });
    }
    if (new Date(deadline) <= new Date()) {
      return res
        .status(400)
        .json({ message: "Deadline must be in the future" });
    }

    // Ensure arrays for categories and skills
    const projectCategories = Array.isArray(categories) ? categories : [];
    const projectSkills = Array.isArray(required_skills) ? required_skills : [];

    const project = new Project({
      client_id,
      title,
      description,
      budget,
      deadline,
      categories: projectCategories,
      required_skills: projectSkills,
      location, // Optional
      status: "open",
    });

    await project.save();
    const populatedProject = await Project.findById(project._id).populate(
      "client_id",
      "name company_name"
    );
    res.status(200).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;
    const updates = req.body;

    const project = await Project.findOne({ _id: id, client_id });
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    // Define updatable fields
    const updatableFields = [
      "title",
      "description",
      "budget",
      "deadline",
      "categories",
      "required_skills",
      "location",
    ];
    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    });

    // Validate updated fields
    if (
      updates.budget &&
      (typeof updates.budget !== "number" || updates.budget <= 0)
    ) {
      return res
        .status(400)
        .json({ message: "Budget must be a positive number" });
    }
    if (updates.deadline && new Date(updates.deadline) <= new Date()) {
      return res
        .status(400)
        .json({ message: "Deadline must be in the future" });
    }

    await project.save();
    const populatedProject = await Project.findById(id).populate(
      "client_id",
      "name company_name"
    );
    res.status(200).json({
      message: "Project updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;

    const project = await Project.findOne({ _id: id, client_id });
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    project.deleted_at = new Date();
    await project.save();

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOpenProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "open" }).populate(
      "client_id",
      "name company_name"
    );
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const searchProjects = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const sanitizedQuery = sanitize(query);
    const projects = await Project.find({
      $text: { $search: sanitizedQuery },
      status: "open",
      deleted_at: null,
    }).populate("client_id", "name company_name");

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const filterProjects = async (req, res) => {
  try {
    const { category, minBudget, maxBudget, location } = req.query;
    const filter = { status: "open", deleted_at: null };

    if (category) filter.categories = { $in: [category] }; // Supports multiple categories
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (location) filter.location = location;

    const projects = await Project.find(filter).populate(
      "client_id",
      "name company_name"
    );
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createApplication = async (req, res) => {
  try {
    const { project_id, proposal } = req.body;
    const freelancer_id = req.user.id;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can apply" });
    }
    if (!project_id || !proposal) {
      return res.status(400).json({ message: "Project ID and proposal are required" });
    }
    if (proposal.length < 50) {
      return res.status(400).json({ message: "Proposal must be at least 50 characters" });
    }

    const project = await Project.findOne({ _id: project_id, status: "open", deleted_at: null });
    if (!project) {
      return res.status(400).json({ message: "Project not found or not open" });
    }

    const existingApplication = await Application.findOne({ project_id, freelancer_id });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied" });
    }

    const application = new Application({
      project_id,
      freelancer_id,
      proposal,
      status: "pending",
    });

    await application.save();
    const populatedApplication = await Application.findById(application._id)
      .populate("project_id", "title description")
      .populate("freelancer_id", "name");
    res.status(200).json({
      message: "Application submitted successfully",
      application: populatedApplication,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProjectApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;

    const project = await Project.findOne({ _id: id, client_id, deleted_at: null });
    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    const applications = await Application.find({ project_id: id })
      .populate("freelancer_id", "name skills bio")
      .select("proposal status created_at");

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const project = await Project.findById(application.project_id);
    if (project.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (status === 'accepted') {
      const contract = new Contract({
        project_id: project._id,
        freelancer_id: application.freelancer_id,
        client_id: project.client_id,
        status: 'pending_tc', // Start with T&Cs submission
      });
      await contract.save();

      application.status = 'accepted';
      await application.save();

      res.status(200).json({ 
        message: 'Bid accepted, please submit T&Cs', 
        contractId: contract._id 
      });
    } else {
      application.status = status;
      await application.save();
      res.status(200).json({ message: `Application ${status}` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== "client") {
      return res.status(403).json({ message: "Only clients can view their projects" });
    }

    const projects = await Project.find({ client_id: id, deleted_at: null });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
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
};
