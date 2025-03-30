const Freelancer = require("../model/freelancer");
const Client = require("../model/client");
const User = require("../model/user");
const otps = require("../model/otp");
const Nonce = require("../model/nonce");
const bcryptjs = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const ethers = require("ethers");
const Cloudinary=require('cloudinary').v2;

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
    const { walletAddress } = req.body;
    const normalizedWalletAddress = walletAddress.toLowerCase(); // Normalize to lowercase
    const nonce = Math.random().toString(36).substring(2, 15); // Random nonce
    console.log("i am running");
    await Nonce.create({ wallet_address: normalizedWalletAddress, nonce });
    res.status(200).json({ nonce });
  } catch (e) {
    console.log(e);
  }
};

//all the main functionalities of the controller codes goes here
const registerWithEmail = async (req, res) => {
  const {
    isVerified,
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
    if (!isVerified)
      return res.status(400).json({ message: "Verify email to continue" });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcryptjs.genSalt(10);
    const password_hash = await bcryptjs.hash(password, salt);

    user = new User({ email, password_hash, role });
    await user.save();

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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "User registered", token, user_id: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerWithWallet = async (req, res) => {
  const {
    role,
    name,
    walletAddress,
    nonce,
    signature,
    bio,
    hourly_rate,
    portfolio,
    skills,
    company_name,
    industry,
  } = req.body;
  const normalizedWalletAddress = walletAddress.toLowerCase();

  const storedNonce = await Nonce.findOne({
    wallet_address: normalizedWalletAddress,
    nonce,
  });
  if (!storedNonce) {
    return res.status(400).json({ message: "Invalid or expired nonce" });
  }

  const message = `Register with nonce: ${nonce}`;
  const signer = await ethers.verifyMessage(message, signature).toLowerCase();
  if (signer !== normalizedWalletAddress) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const existingUser = await User.findOne({
    wallet_address: normalizedWalletAddress,
  });
  if (existingUser) {
    return res.status(400).json({ message: "Wallet already registered" });
  }

  const user = new User({ wallet_address: normalizedWalletAddress, role });
  await user.save();

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

  const token = jwt.sign(
    { id: user._id, wallet_address: normalizedWalletAddress },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  await Nonce.deleteOne({ _id: storedNonce._id });

  res.status(200).json({ message: "Registration successful", token, user });
};

const verifyemail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ message: "Please enter email" });
    }

    const OTP = Math.floor(100000 + Math.random() * 900000);
    const otpexpire = Date.now() + 5 * 60 * 1000; // Set expiration time to 5 minutes from now

    const mailOptions = {
      from: "www.officialecochain@gmail.com",
      to: email,
      subject: "OTP to proceed",
      text: `Your OTP for the account ${email} is ${OTP} and is valid only for 5 minutes.`,
    };
    console.log(OTP)

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
    if (!user ) {
      return res
        .status(400)
        .json({ message: "Invalid credentials or unverified account" });
    }
    

    const isMatch = await bcryptjs.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.user;
  const {
    name,
    bio,
    hourly_rate,
    portfolio,
    skills,
    company_name,
    industry,
    email,
    walletAddress,
    signature,
    nonce,
    isEmailVerified, // New field to confirm OTP verification
  } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle Email Linking
    if (email && !user.email) {
      if (!isEmailVerified) {
        return res.status(400).json({ message: 'Email not verified' });
      }
      user.email = email;
    }

    // Handle Wallet Linking
    if (walletAddress && signature && nonce && !user.wallet_address) {
      const storedNonce = await Nonce.findOne({ wallet_address: walletAddress.toLowerCase(), nonce });
      if (!storedNonce) {
        return res.status(400).json({ message: 'Invalid or expired nonce' });
      }
      const message = `Verify wallet with nonce: ${nonce}`;
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
        user.wallet_address = walletAddress;
        await Nonce.deleteOne({ _id: storedNonce._id }); // Remove used nonce
      } else {
        return res.status(400).json({ message: 'Invalid signature' });
      }
    }

    // Handle Profile Photo Upload
    let profilePhotoUrl;
    if (req.file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPEG and PNG allowed.' });
      }
      if (req.file.size > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({ message: 'File size exceeds 5MB limit.' });
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_photos',
        public_id: `${id}_${Date.now()}`,
      });
      profilePhotoUrl = result.secure_url;
    }

    // Role-Based Updates
    if (user.role === 'freelancer') {
      const freelancer = await Freelancer.findOne({ user_id: id });
      if (!freelancer) {
        return res.status(404).json({ message: 'Freelancer profile not found' });
      }
      freelancer.name = name || freelancer.name;
      freelancer.bio = bio || freelancer.bio;
      freelancer.hourly_rate = hourly_rate || freelancer.hourly_rate;
      freelancer.portfolio = portfolio || freelancer.portfolio;
      freelancer.skills = skills ? skills.split(',').map(s => s.trim()) : freelancer.skills;
      if (profilePhotoUrl) freelancer.profile_photo = profilePhotoUrl;
      await freelancer.save();
    } else if (user.role === 'client') {
      const client = await Client.findOne({ user_id: id });
      if (!client) {
        return res.status(404).json({ message: 'Client profile not found' });
      }
      client.name = name || client.name;
      client.company_name = company_name || client.company_name;
      client.industry = industry || client.industry;
      if (profilePhotoUrl) client.profile_photo = profilePhotoUrl;
      await client.save();
    }

    // Save User Updates
    await user.save();

    // Generate new token (minimal payload)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Profile updated successfully', token });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyotp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otp) {
    return res.status(422).json({ message: "Please enter otp" });
  }

  try {
    const userExist = await otps.findOne({ email });
    if (!userExist) {
      return res.status(422).json({ message: "User must first request an OTP" });
    }

    const otpe = Date.now();
    const isMatch = otp == userExist.otp;

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    } else if (otpe > userExist.otpexpire) {
      return res.status(422).json({ error: "OTP expired" });
    }

    // Optionally delete OTP after verification
    await otps.deleteOne({ _id: userExist._id });

    res.status(200).json({ message: "OTP verified" });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error: " + e });
  }
};

//need to work on this
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    // Send resetToken via email (implementation omitted for brevity)

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//need to work on this later
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcryptjs.genSalt(10);
    user.password_hash = await bcryptjs.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

const generateLoginNonce = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const normalizedWalletAddress = walletAddress.toLowerCase();
    // Verify user exists
    const user = await User.findOne({
      wallet_address: normalizedWalletAddress,
    }).populate();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate and store nonce
    const nonce = Math.random().toString(36).substring(2, 15); // Random string
    await Nonce.create({ wallet_address: normalizedWalletAddress, nonce });
    console.log("running");
    res.status(200).json({ nonce });
  } catch (e) {
    res.status(400).json({ message: "An error has occured: " + e });
  }
};

const loginWithWallet = async (req, res) => {
  const { walletAddress, nonce, signature } = req.body;
  const normalizedWalletAddress = walletAddress.toLowerCase();

  const storedNonce = await Nonce.findOne({
    wallet_address: normalizedWalletAddress,
    nonce,
  });
  if (!storedNonce) {
    return res.status(400).json({ message: "Invalid or expired nonce" });
  }

  const message = `Login with nonce: ${nonce}`;
  const signer = ethers.utils.verifyMessage(message, signature).toLowerCase();
  if (signer !== normalizedWalletAddress) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const user = await User.findOne({ wallet_address: normalizedWalletAddress })
    .populate("role")
    .populate({
      path: "applications",
      model: "Application",
    })
    .populate({
      path: "reviews",
      model: "Review",
    });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const token = jwt.sign(
    { id: user._id, wallet_address: normalizedWalletAddress },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  await Nonce.deleteOne({ _id: storedNonce._id });

  res.status(200).json({ token, user });
};

const getProfile = async (req, res) => {
  const { id } = req.user;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let roleData;
    if (user.role === 'freelancer') {
      roleData = await Freelancer.findOne({ user_id: id });
      if (!roleData) {
        return res.status(404).json({ message: 'Freelancer profile not found' });
      }
    } else if (user.role === 'client') {
      roleData = await Client.findOne({ user_id: id });
      if (!roleData) {
        return res.status(404).json({ message: 'Client profile not found' });
      }
    }

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        wallet_address: user.wallet_address,
        createdAt: user.createdAt,
      },
      roleData: roleData.toObject(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = {
  registerWithEmail,
  verifyemail,
  verifyotp,
  noncegeneration,
  registerWithWallet,
  loginWithEmail,
  updateProfile,
  generateLoginNonce,
  loginWithWallet,
  getProfile
};
