import { registerUser, loginUser } from './auth.service.js';

export async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;

    const result = await registerUser({
      name,
      email,
      phone,
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Email or phone number already registered',
      });
    }

    const validationErrors = [
      'Name is required',
      'Email or phone number is required',
      'Password must be at least 8 characters',
      'Invalid registration role',
    ];

    if (validationErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to register account',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, phone, password } = req.body;

    // Service expects one identifier: email or phone.
    const identifier = email || phone;

    const result = await loginUser({
      identifier,
      password,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password',
      });
    }

    if (error.message === 'Account is not active') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Email/phone and password are required') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to login',
    });
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user,
    },
  });
}

