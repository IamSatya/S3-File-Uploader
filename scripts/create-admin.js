#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */

import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { users } from '../shared/schema';

neonConfig.webSocketConstructor = ws;

async function createAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Creating admin user...\n');

  // Get user input
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  try {
    const email = await question('Email: ');
    const password = await question('Password (min 8 characters): ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');

    if (!email || !password || password.length < 8) {
      console.error('\n❌ Error: Email is required and password must be at least 8 characters');
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    console.log('⏳ Creating user in database...');
    await db.insert(users).values({
      email: email.trim(),
      password: hashedPassword,
      firstName: firstName.trim() || 'Admin',
      lastName: lastName.trim() || 'User',
      isAdmin: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`\nLogin credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: [hidden]\n`);

  } catch (error) {
    if (error.code === '23505') {
      console.error('\n❌ Error: User with this email already exists');
    } else {
      console.error('\n❌ Error creating admin user:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
