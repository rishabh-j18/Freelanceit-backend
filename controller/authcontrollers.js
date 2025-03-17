const Freelancer = require("../model/freelancer");
const Client = require("../model/client");
const User = require("../model/user");
const otps = require("../model/otp");
const Nonce = require("../model/nonce");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

/*
All the in between functions goes here
 */

//nodemailer cofiguration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "www.officialecochain@gmail.com",
    pass: "qikkpopzbiewbtpj",
  },
});

//Nonce generation
const noncegeneration = async (req, res) => {
  try {
    const { walletAddress } = req.query;
    const normalizedWalletAddress = walletAddress.toLowerCase(); // Normalize to lowercase
    const nonce = Math.random().toString(36).substring(2, 15); // Random nonce

    await Nonce.create({ wallet_address: normalizedWalletAddress, nonce });
    res.json({ nonce });
  } catch (e) {
    console.log(e);
  }
};



//all the main functionalities of the controller codes goes here
const registerWithEmail = async (req, res) => {
  const {
    isverified,
    email,
    password,
    role,
    name,
    bio,
    hourly_rate,
    portfolio,
    skills,
    company_name,
    industry,
  } = req.body;

  try {
    if (!isverified)
      return res.status(400).json({ message: "Verify email to continue" });

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user (not verified yet)
    user = new User({ email, password_hash, role });
    await user.save();

    // Create role-specific profile
    if (role === "freelancer") {
      const freelancer = new Freelancer({
        user_id: user._id,
        name,
        bio,
        hourly_rate,
        portfolio,
        skills,
      });
      await freelancer.save();
    } else if (role === "client") {
      const client = new Client({
        user_id: user._id,
        name,
        company_name,
        industry,
      });
      await client.save();
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    res.status(200).json({ message: "User registered." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const registerWithWallet = async (req, res) => {
  const {
    walletAddress,
    nonce,
    signature
  } = req.body;
  const normalizedWalletAddress = walletAddress.toLowerCase();

  // Check if nonce is valid
  const storedNonce = await Nonce.findOne({
    wallet_address: normalizedWalletAddress,
    nonce,
  });
  if (!storedNonce) {
    return res.status(400).json({ message: "Invalid or expired nonce" });
  }

  // Construct the original message
  const message = `Register with nonce: ${nonce}`;

  // Verify the signature
  const signer = ethers.utils.verifyMessage(message, signature).toLowerCase();
  if (signer !== normalizedWalletAddress) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Check if wallet is already registered (assuming a User model exists)
  const existingUser = await User.findOne({
    wallet_address: normalizedWalletAddress,
  });
  if (existingUser) {
    return res.status(400).json({ message: "Wallet already registered" });
  }

  // Proceed with registration
  const newUser = await User.create({
    wallet_address: normalizedWalletAddress,
    // Add other fields like name, role, etc., if collected
  });

  // Clean up used nonce
  await Nonce.deleteOne({ _id: storedNonce._id });

  res.status(200).json({ message: "Registration successful", user: newUser });
};

const verifyemail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ message: "Please enter email" });
    }

    // const user = await User.findOne({ email });
    // if (!user) {
    //   return res
    //     .status(422)
    //     .json({ message: "Please enter correct email or sign up" });
    // }

    const OTP = Math.floor(100000 + Math.random() * 900000);
    const otpexpire = Date.now() + 5 * 60 * 1000; // Set expiration time to 5 minutes from now

    const mailOptions = {
      from: "www.officialecochain@gmail.com",
      to: email,
      subject: "OTP to proceed",
      text: `Your OTP for the account ${email} is ${OTP} and is valid only for 5 minutes.`,
    };

    const oldUser = await otps.findOne({ email });
    if (oldUser) {
      // Update the OTP and expiry if the user already exists in the OTP collection
      const updateInfo = await otps.findByIdAndUpdate(
        oldUser._id,
        { otp: OTP, otpexpire: otpexpire },
        { new: true }
      );
      if (!updateInfo) {
        return res
          .status(400)
          .json({ error: "Unable to process for OTP system" });
      }
    } else {
      // Create new OTP entry if not found
      const newOtpEntry = new otps({ email, otp: OTP, otpexpire });
      await newOtpEntry.save();
    }

    // Send the OTP via email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    return res.status(200).json({ message: "OTP sent to the email address" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error: " + err });
  }
};

const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.is_verified) {
      return res.status(400).json({ message: 'Invalid credentials or unverified account' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.user; // From JWT middleware
  const { name, bio, hourly_rate, portfolio, skills, company_name, industry } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'freelancer') {
      const freelancer = await Freelancer.findOne({ user_id: id });
      if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });

      freelancer.name = name || freelancer.name;
      freelancer.bio = bio || freelancer.bio;
      freelancer.hourly_rate = hourly_rate || freelancer.hourly_rate;
      freelancer.portfolio = portfolio || freelancer.portfolio;
      freelancer.skills = skills || freelancer.skills;
      if (req.file) freelancer.profile_photo = req.file.path;

      await freelancer.save();
    } else if (user.role === 'client') {
      const client = await Client.findOne({ user_id: id });
      if (!client) return res.status(404).json({ message: 'Client profile not found' });

      client.name = name || client.name;
      client.company_name = company_name || client.company_name;
      client.industry = industry || client.industry;
      if (req.file) client.profile_photo = req.file.path;

      await client.save();
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerWithEmail,
  verifyemail,
  noncegeneration,
  registerWithWallet,
  loginWithEmail,
  updateProfile
};
