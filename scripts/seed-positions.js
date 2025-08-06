/**
 * npm run seed:position
*/
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Checking environment variables...');
console.log('Script directory:', __dirname);
console.log('Project root:', path.join(__dirname, '..'));
console.log('MongoDB URI loaded:', !!process.env.MONGODB_URI);
console.log('MongoDB URI (partial):', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT FOUND');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables!');
  console.error('Make sure you have one of these files with MONGODB_URI:');
  console.error('  - .env.local');
  console.error('  - .env');
  console.error('  - or set MONGODB_URI as system environment variable');
  process.exit(1);
}

const positions = [
  "Human Resource",
  "Team Leader",
  "Project Manager",
  "Senior Developer",
  "Junior Developer",
  "Quality Assurance",
  "Business Analyst",
  "Data Scientist",
  "UI/UX Designer",
  "System Administrator",
  "Network Engineer",
  "DevOps Engineer",
  "Technical Support",
  "Sales Executive",
  "Marketing Specialist",
  "Customer Service",
  "Trainee",
  "Student",
  "Intern"
];

async function seedPositions() {
  try {
    console.log('Connecting to database...');
    const { default: mongoose } = await import('mongoose');
    const { default: Position } = await import('../src/model/Position.js');
    await mongoose.connect(process.env.MONGODB_URI);

    for (const name of positions) {
      await Position.updateOne({ name }, { name }, { upsert: true });
    }
    console.log('Seeded positions');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding positions:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

console.log('Starting positions seed process...');
seedPositions();
