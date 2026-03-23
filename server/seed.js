require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Skill = require('./models/Skill');

const projects = [
  {
    title: 'Vice City — Smart City Web Platform',
    description: 'A full-stack smart city dashboard delivering real-time traffic alerts, live weather insights, local events, and nearby attractions — all unified with a Gemini-powered AI assistant for instant city queries.',
    tags: ['React', 'Node.js', 'MongoDB', 'Gemini AI', 'Maps API'],
    github: 'https://github.com/Ayush-Gupta-0212/Software-for-Smart-City',
    live: 'https://smart-city-frontend.onrender.com',
    image: '/vice-city.png',
    featured: true,
    year: 2026,
    order: 1
  },
  {
    title: 'AgriPower — Agricultural Energy Management',
    description: 'A web platform built to simplify electric power distribution for modern farms. Helps farmers track and manage energy consumption efficiently, with an integrated AI chatbot for real-time support and guidance.',
    tags: ['PHP', 'Tailwind CSS', 'AI Assistant Chatbot'],
    github: 'https://github.com/Ayush-Gupta-0212/AgriPower',
    live: 'https://agripower-qani.onrender.com/',
    image: '/agripower.png',
    featured: true,
    year: 2025,
    order: 2
  },
  {
    title: 'CineVerse — Movie Recommendation System',
    description: 'A full-stack recommendation engine using KNN collaborative filtering and OpenRouter LLMs to deliver personalised movie suggestions. Includes secure JWT authentication, advanced search, and a favorites management system.',
    tags: ['React', 'Python', 'FastAPI', 'KNN', 'LLM (OpenRouter)'],
    github: 'https://github.com/Ayush-Gupta-0212/CineVerse',
    live: 'https://github.com/Ayush-Gupta-0212/CineVerse',
    image: '/cineverse.png',
    featured: true,
    year: 2025,
    order: 3
  }
];

const skills = [
  { name: 'C++',        category: 'Languages', level: 75 },
  { name: 'C',          category: 'Languages', level: 70 },
  { name: 'JavaScript', category: 'Languages', level: 85 },
  { name: 'Python',     category: 'Languages', level: 65 },
  { name: 'React.js',      category: 'Frameworks', level: 82 },
  { name: 'HTML / CSS',    category: 'Frameworks', level: 88 },
  { name: 'Tailwind CSS',  category: 'Frameworks', level: 85 },
  { name: 'Framer Motion', category: 'Frameworks', level: 65 },
  { name: 'Node.js',       category: 'Frameworks', level: 78 },
  { name: 'Express.js',    category: 'Frameworks', level: 75 },
  { name: 'Data Structures & Algorithms', category: 'CS Fundamentals', level: 70 },
  { name: 'OOP',                          category: 'CS Fundamentals', level: 78 },
  { name: 'Operating Systems',            category: 'CS Fundamentals', level: 65 },
  { name: 'Computer Networks',            category: 'CS Fundamentals', level: 62 },
  { name: 'DBMS',                         category: 'CS Fundamentals', level: 68 },
  { name: 'SQL Server', category: 'Tools', level: 65 },
  { name: 'MongoDB',    category: 'Tools', level: 75 },
  { name: 'GitHub',     category: 'Tools', level: 80 },
  { name: 'VS Code',    category: 'Tools', level: 90 },
  { name: 'Notion',     category: 'Tools', level: 72 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Project.deleteMany({});
    await Skill.deleteMany({});

    await Project.insertMany(projects);
    await Skill.insertMany(skills);

    console.log(`✅ Seeded ${projects.length} projects and ${skills.length} skills`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
