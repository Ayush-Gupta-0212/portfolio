/*
 * Content shipped with the site. Used until the API responds (Render's free
 * tier can take ~50 s to wake), when the API is down, and as the starting
 * point the admin page can import into an empty database.
 *
 * In `about.statement`, wrap words in [[double brackets]] to highlight them.
 */
export const DEFAULT_CONTENT = {
  profile: {
    firstName: 'Ayush',
    lastName: 'Gupta',
    roles: ['Full Stack Developer', 'React & Node.js', 'REST APIs', 'MongoDB & SQL', 'Creative Coding'],
    heroIntro: "I build things for the web — scalable backends, clean APIs, and fast frontends. Focused on writing code that's functional, efficient, and actually shipped.",
    available: true,
    availabilityLabel: 'Open to work',
    location: 'India 🇮🇳',
    heroStats: [
      { value: '5+', label: 'Projects' },
      { value: '10+', label: 'Tech Stacks' },
      { value: '∞', label: 'Learning' },
    ],
    about: {
      statement: "Hey, I'm Ayush — a [[full-stack developer]] and [[creative coder]] building things that live on the internet. I craft immersive web experiences that blend aesthetic finesse with [[technical precision.]]",
      philosophy: 'The best software is both functional and beautiful — and I refuse to compromise on either.',
      bio: 'Currently pursuing my degree while simultaneously building production-grade applications — from scalable backends and clean APIs to fast, polished frontends.',
      portrait: '/ayush-portrait.jpg',
      stats: [
        { value: '5+', label: 'Projects Built' },
        { value: '10+', label: 'Tech Stacks' },
        { value: '∞', label: 'Cups of Coffee' },
      ],
    },
    skillsIntro: 'A curated set of technologies I use to build fast, scalable, and beautiful things.',
    skillsNote: 'Always learning. Currently deepening expertise in system design, DSA, and full-stack architecture.',
    projectsIntro: "Things I've designed, built and shipped — from smart-city dashboards to AI-powered recommendation engines.",
    contact: {
      email: 'itsayush0212@gmail.com',
      intro: 'Whether you have a project in mind, a role to fill, or just want to talk shop — my inbox is always open.',
      status: 'Open to opportunities',
    },
    links: {
      github: 'https://github.com/Ayush-Gupta-0212',
      linkedin: 'https://www.linkedin.com/in/ayush-gupta-5a646b289',
      resume: 'https://drive.google.com/file/d/1t2lAIj8f-tA10wilV_R4o7EIoYW6DqoL/view?usp=sharing',
    },
  },

  projects: [
    { _id: 'default-p1', title: 'Vice City — Smart City Web Platform', description: 'A full-stack smart city dashboard delivering real-time traffic alerts, live weather insights, local events, and nearby attractions — all unified with a Gemini-powered AI assistant for instant city queries.', tags: ['React', 'Node.js', 'MongoDB', 'Gemini AI', 'Maps API'], github: 'https://github.com/Ayush-Gupta-0212/Software-for-Smart-City', live: 'https://smart-city-frontend.onrender.com', featured: true, year: 2026, image: '/vice-city.webp' },
    { _id: 'default-p2', title: 'AgriPower — Agricultural Energy Management', description: 'A web platform built to simplify electric power distribution for modern farms. Helps farmers track and manage energy consumption efficiently, with an integrated AI chatbot for real-time support and guidance.', tags: ['PHP', 'Tailwind CSS', 'AI Assistant Chatbot'], github: 'https://github.com/Ayush-Gupta-0212/AgriPower', live: 'https://agripower-qani.onrender.com/', featured: true, year: 2025, image: '/agripower.webp' },
    { _id: 'default-p3', title: 'CineVerse — Movie Recommendation System', description: 'A full-stack recommendation engine using KNN collaborative filtering and OpenRouter LLMs to deliver personalised movie suggestions. Includes secure JWT authentication, advanced search, and a favorites management system.', tags: ['React', 'Python', 'FastAPI', 'KNN', 'LLM (OpenRouter)'], github: 'https://github.com/Ayush-Gupta-0212/CineVerse', live: 'https://github.com/Ayush-Gupta-0212/CineVerse', featured: true, year: 2025, image: '/cineverse.webp' },
  ],

  skills: [
    { name: 'C++', category: 'Languages', level: 75 },
    { name: 'C', category: 'Languages', level: 70 },
    { name: 'JavaScript', category: 'Languages', level: 85 },
    { name: 'Python', category: 'Languages', level: 65 },
    { name: 'React.js', category: 'Frameworks', level: 82 },
    { name: 'HTML / CSS', category: 'Frameworks', level: 88 },
    { name: 'Tailwind CSS', category: 'Frameworks', level: 85 },
    { name: 'Framer Motion', category: 'Frameworks', level: 65 },
    { name: 'Node.js', category: 'Frameworks', level: 78 },
    { name: 'Express.js', category: 'Frameworks', level: 75 },
    { name: 'Data Structures & Algorithms', category: 'CS Fundamentals', level: 70 },
    { name: 'OOP', category: 'CS Fundamentals', level: 78 },
    { name: 'Operating Systems', category: 'CS Fundamentals', level: 65 },
    { name: 'Computer Networks', category: 'CS Fundamentals', level: 62 },
    { name: 'DBMS', category: 'CS Fundamentals', level: 68 },
    { name: 'SQL Server', category: 'Tools', level: 65 },
    { name: 'MongoDB', category: 'Tools', level: 75 },
    { name: 'GitHub', category: 'Tools', level: 80 },
    { name: 'VS Code', category: 'Tools', level: 90 },
    { name: 'Notion', category: 'Tools', level: 72 },
  ].map((s, i) => ({ _id: `default-s${i + 1}`, ...s })),

  certificates: [
    { _id: 'default-c1', title: 'The Bits and Bytes of Computer Networking', issuer: 'Google · Coursera', date: 'Sep 2024', link: 'https://coursera.org/share/4e4c7de8a17077c5b7739a5b60a9ff4c', image: '/cert-google-networking.webp' },
    { _id: 'default-c2', title: 'ChatGPT-4 Prompt Engineering: ChatGPT, Generative AI & LLM', issuer: 'Infosys Springboard', date: 'Aug 2025', link: 'https://verify.onwingspan.com/', image: '/cert-infosys-prompt.webp' },
    { _id: 'default-c3', title: 'Cloud Computing', issuer: 'NPTEL · IIT Kharagpur · Elite', date: 'Jan–Apr 2025', link: 'https://archive.nptel.ac.in/content/noc/NOC25/SEM1/Ecertificates/106/noc25-cs11/Course/NPTEL25CS11S143730205304237111.pdf', image: '/cert-nptel-cloud.webp' },
    { _id: 'default-c4', title: 'Data Structures and Algorithm', issuer: 'LPU · iamNEO · 72 hrs', date: 'Dec 2024', link: 'https://lpucolab438.examly.io/certificate/U2FsdGVkX1%2FFrU7t0k%2FGDI6CamFFUjuhLa6tCSJi1MY%3D', image: '/cert-lpu-dsa.webp' },
    { _id: 'default-c5', title: 'Object Oriented Programming', issuer: 'LPU · iamNEO · 72 hrs', date: 'Dec 2024', link: 'https://lpucolab438.examly.io/certificate/U2FsdGVkX19K1WhCp9UOMqDVZwHp5TWa00dRMvED0Vs%3D', image: '/cert-lpu-oop.webp' },
  ],
};
