require('dotenv').config();
const readline = require('readline');
const connectDB = require('../config/db');
const User = require('../models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
      parsed[key] = val;
    }
  }
  return parsed;
}

function promptQuestion(rl, question, mask = false) {
  return new Promise((resolve) => {
    if (!mask) {
      rl.question(question, (answer) => resolve(answer.trim()));
      return;
    }
    rl.stdoutMuted = true;
    rl.question(question, (answer) => {
      rl.stdoutMuted = false;
      console.log('');
      resolve(answer.trim());
    });
    rl._writeToOutput = function writeMasked(stringToWrite) {
      if (rl.stdoutMuted) rl.output.write('*');
      else rl.output.write(stringToWrite);
    };
  });
}

async function run() {
  const args = parseArgs();
  if (Object.prototype.hasOwnProperty.call(args, 'password')) {
    throw new Error('Do not pass --password; enter the password at the masked prompt instead.');
  }

  let name = args.name || process.env.ADMIN_NAME;
  let email = args.email || process.env.ADMIN_EMAIL;
  let password;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    if (!name) name = await promptQuestion(rl, 'Admin Full Name: ');
    if (!email) email = await promptQuestion(rl, 'Admin Email: ');
    password = await promptQuestion(rl, 'Admin Password (min 8 chars): ', true);
  } finally {
    rl.close();
  }

  if (!name || !email || !password || password.length < 8) {
    console.error('Error: Valid name, email, and password (at least 8 characters) are required.');
    process.exit(1);
  }

  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await User.hashPassword(password);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('That email belongs to a student account. Use a separate admin email.');
    }
    existing.name = name.trim();
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    console.log(`Updated existing admin account: ${normalizedEmail}`);
  } else {
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      department: 'Mess Administration',
      semester: 1,
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin account: ${normalizedEmail}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Admin creation failed:', err.message);
  process.exit(1);
});
