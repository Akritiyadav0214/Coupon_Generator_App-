const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');
const { createNotification } = require('../services/notificationService');

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const register = asyncHandler(async (req, res) => {
  const { name, studentId, email, password, department, semester } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedStudentId = studentId.trim().toUpperCase();

  const [existingEmail, existingStudentId] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ studentId: normalizedStudentId }),
  ]);

  if (existingEmail) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }
  if (existingStudentId) {
    throw new AppError(
      'An account with this Student ID already exists.',
      409,
      'STUDENT_ID_EXISTS'
    );
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    studentId: normalizedStudentId,
    department: department.trim(),
    semester: Number(semester),
    role: 'student',
    isActive: true,
  });

  await createNotification({
    userId: user._id,
    title: 'Welcome to MessMate',
    message:
      'Your student account is active. You can now generate your daily digital lunch coupon and view today’s mess menu.',
    type: 'account',
  });

  const token = signToken(user);
  res.cookie('messmate_token', token, cookieOptions());

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user: user.toJSON(),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact the mess administrator.',
      403,
      'ACCOUNT_DEACTIVATED'
    );
  }

  const token = signToken(user);
  res.cookie('messmate_token', token, cookieOptions());

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: user.toJSON(),
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('messmate_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
};
