const Payment = require("../model/payment");
const Contract = require("../model/contract");
const Client = require("../model/client");

const createPayment = async (req, res) => {
  try {
    const { contractId, amount } = req.body;
    const id = req.user.id;

    const client = await Client.findOne({ user_id: id });
    if (!client) {
      return res
        .status(403)
        .json({ message: "Client profile not found for this user" });
    }
    const client_id = client._id;

    const contract = await Contract.findById(contractId);
    if (!contract || contract.client_id.toString() !== client_id.toString()) {
      return res
        .status(404)
        .json({ message: "Contract not found or unauthorized" });
    }
    if (contract.status !== "pending_payment") {
      return res
        .status(400)
        .json({ message: "Cannot create payment at this stage" });
    }
    const payment = new Payment({
      contract_id: contractId,
      milestone_index: 1, // Assuming single payment for now
      amount,
      transaction_hash: "", // Placeholder for Web3
      payment_date: new Date(),
      status: "pending",
    });
    await payment.save();
    res.status(201).json({ message: "Payment record created", payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transaction_hash } = req.body;
    const id = req.user.id;

    const client = await Client.findOne({ user_id :id});
    if (!client) {
      return res.status(403).json({ message: "Client profile not found for this user" });
    }
    const client_id = client._id;


    const payment = await Payment.findById(paymentId).populate("contract_id");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.contract_id.client_id.toString() !== client_id.toString())
      return res.status(403).json({ message: "Unauthorized" });
    const validStatuses = ["pending", "completed", "disputed"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });
    payment.status = status;
    if (transaction_hash) payment.transaction_hash = transaction_hash;
    await payment.save();
    if (status === "completed") {
      const contract = await Contract.findById(payment.contract_id);
      contract.status = "active";
      await contract.save();
    }
    res.status(200).json({ message: `Payment updated to ${status}`, payment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user_id = req.user.id;
    const payment = await Payment.findById(paymentId).populate("contract_id");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (
      payment.contract_id.client_id.toString() !== user_id &&
      payment.contract_id.freelancer_id.toString() !== user_id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createPayment, updatePaymentStatus, getPaymentStatus };
