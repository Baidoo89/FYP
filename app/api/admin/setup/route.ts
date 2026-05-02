import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/auth';
import { createLocalAdminAccount } from '../../../../lib/admin-storage';
import { getRows, query } from '../../../../lib/db';

type SetupRequestBody = {
  username?: string;
  password?: string;
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SetupRequestBody;
    const username = (body.username || '').trim();
    const password = body.password || '';
    const email = (body.email || '').trim();

    // Validate input
    if (!username || !password || !email) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = hashPassword(password);

    try {
      // Check if admin already exists in the database.
      const existingAdmins = await getRows(
        'SELECT id FROM admin_accounts WHERE username = $1 OR email = $2',
        [username, email]
      );
      if (existingAdmins.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Username or email already exists' },
          { status: 409 }
        );
      }
      // Insert new admin into the database.
      await query(
        'INSERT INTO admin_accounts (username, email, password_hash, is_active) VALUES ($1, $2, $3, TRUE)',
        [username, email, passwordHash]
      );
      return NextResponse.json(
        {
          success: true,
          message: 'Admin account created successfully',
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.warn('Database unavailable for admin setup. Falling back to local storage.');
      const localResult = await createLocalAdminAccount({
        username,
        email,
        passwordHash,
      });
      if (!localResult.created) {
        return NextResponse.json(
          { success: false, error: 'Username or email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: true,
          message: 'Admin account created successfully in local fallback storage',
        },
        { status: 201 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}
