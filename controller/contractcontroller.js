const Contract = require("../model/contract");

const submitTc = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { terms_and_conditions } = req.body;
    const client_id = req.user.id; // Assumes req.user is set by auth middleware

    const contract = await Contract.findById(contractId);
    if (!contract || contract.client_id.toString() !== client_id) {
      return res
        .status(404)
        .json({ message: "Contract not found or unauthorized" });
    }
    if (contract.status !== "pending_tc") {
      return res
        .status(400)
        .json({ message: "Cannot submit T&Cs at this stage" });
    }

    contract.terms_and_conditions = terms_and_conditions;
    contract.tc_status = "under_review";
    contract.status = "under_review";
    await contract.save();

    res.status(200).json({ message: "T&Cs submitted for review", contract });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reviewTc = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { action, comments } = req.body; // action: "accept" or "request_changes"
    const freelancer_id = req.user.id;

    const contract = await Contract.findById(contractId);
    if (!contract || contract.freelancer_id.toString() !== freelancer_id) {
      return res
        .status(404)
        .json({ message: "Contract not found or unauthorized" });
    }
    if (contract.tc_status !== "under_review") {
      return res.status(400).json({ message: "T&Cs not under review" });
    }

    if (action === "accept") {
      contract.tc_status = "agreed";
      contract.status = "pending_payment";
      await contract.save();
      res
        .status(200)
        .json({ message: "T&Cs accepted, proceed to payment", contract });
    } else if (action === "request_changes") {
      contract.tc_status = "rejected";
      contract.tc_history.push({
        terms: contract.terms_and_conditions,
        action: "rejected",
        comments,
      });
      await contract.save();
      res
        .status(200)
        .json({
          message: "Changes requested, please wait for client update",
          contract,
        });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTc = async (req, res) => {
    try {
      const { contractId } = req.params                                
      const { terms_and_conditions } = req.body;
      const client_id = req.user.id;
  
      const contract = await Contract.findById(contractId);
      if (!contract || contract.client_id.toString() !== client_id) {
        return res.status(404).json({ message: 'Contract not found or unauthorized' });
      }
      if (contract.tc_status !== 'rejected') {
        return res.status(400).json({ message: 'Cannot update T&Cs at this stage' });
      }
  
      contract.terms_and_conditions = terms_and_conditions;
      contract.tc_status = 'under_review';
      contract.status = 'under_review';
      contract.tc_history.push({ 
        terms: terms_and_conditions, 
        action: 'updated' 
      });
      await contract.save();
  
      res.status(200).json({ message: 'T&Cs updated and resubmitted for review', contract });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const fundEscrow = async (req, res) => {
    try {
      const { contractId } = req.params;
      const client_id = req.user.id;
  
      const contract = await Contract.findById(contractId);
      if (!contract || contract.client_id.toString() !== client_id) {
        return res.status(404).json({ message: 'Contract not found or unauthorized' });
      }
      if (contract.status !== 'pending_payment') {
        return res.status(400).json({ message: 'Cannot fund escrow at this stage' });
      }
  
      // Placeholder for blockchain payment logic
      // const { transactionHash, receiptId } = await yourBlockchainFunction(contract);
      // For now, simulate payment success
      contract.status = 'active';
      await contract.save();
  
      res.status(200).json({ message: 'Escrow funded, project is now active', contract });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { submitTc, reviewTc, updateTc,fundEscrow };
