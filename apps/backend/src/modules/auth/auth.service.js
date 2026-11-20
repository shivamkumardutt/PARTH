
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/database.js';
import { generateAccessToken } from '../../utils/token.js';

const ALLOWED_ROLES = ['STUDENT', 'PARENT'];

export async function registerUser(data) {
  const { name, email, phone, password, role } = data;

  // Validate name
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Name is required');
  }

  // Validate email or phone
  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : null;

  const normalizedPhone =
    typeof phone === 'string' ? phone.trim() : null;

  if (!normalizedEmail && !normalizedPhone) {
    throw new Error('Email or phone number is required');
  }

  // Validate password
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Public registration cannot assign privileged roles
  const selectedRole = role || 'STUDENT';

  if (!ALLOWED_ROLES.includes(selectedRole)) {
    throw new Error('Invalid registration role');
  }

  // Check existing account
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    },
  });

  if (existingUser) {
    throw new Error('An account with this email or phone already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user and assign role in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const roleRecord = await tx.role.findUnique({
      where: { name: selectedRole },
    });

    if (!roleRecord) {
      throw new Error('Registration role is not configured');
    }

    return tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        roles: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  });

  // Generate access token
  const accessToken = generateAccessToken(user);

  return {
    user,
    accessToken,
  };
}

export async function loginUser(data) {
  const { identifier, password } = data;

  const normalizedIdentifier =
    typeof identifier === 'string'
      ? identifier.trim()
      : null;

  const normalizedEmail = normalizedIdentifier?.toLowerCase();


if (!normalizedIdentifier || typeof password !== 'string' || !password) {
    throw new Error('Email/phone and password are required');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
  	{ email: normalizedEmail },
  	{ phone: normalizedIdentifier },
      ],
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Account is not active');
  }

  const accessToken = generateAccessToken(user);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((item) => item.role.name),
  };

  return {
    user: safeUser,
    accessToken,
  };
}
