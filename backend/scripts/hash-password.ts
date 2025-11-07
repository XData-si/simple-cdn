#!/usr/bin/env bun
import { hash } from '@node-rs/argon2';
import { stdin } from 'process';

// Read password from stdin or command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: bun scripts/hash-password.ts <password>');
  console.error('   or: echo -n "password" | bun scripts/hash-password.ts');
  process.exit(1);
}

try {
  // Hash with Argon2id (secure defaults)
  const hashed = await hash(password, {
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
    algorithm: 'argon2id',
  });

  console.log('\nPassword hashed successfully!');
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hashed}`);
} catch (error) {
  console.error('Error hashing password:', error);
  process.exit(1);
}
