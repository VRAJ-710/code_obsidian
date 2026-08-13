// ── Curated 100-Question Interview Bank ──────────────────────────────────────
// Dynamically compiled from the user's official interview question bank.
// Each question is tagged with company, role, level, type, and focus skill.

const QUESTION_BANK = [
  {"id": "q-1", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "What is the difference between a pointer and a reference in C++?", "focusSkill": "C++"},
  {"id": "q-2", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Meta", "question": "Explain encapsulation, inheritance, polymorphism, and abstraction with examples.", "focusSkill": "OOP"},
  {"id": "q-3", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Amazon", "question": "What is the difference between a stack and a heap?", "focusSkill": "C++"},
  {"id": "q-4", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Microsoft", "question": "What is a constructor? When is a destructor called?", "focusSkill": "C++"},
  {"id": "q-5", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Netflix", "question": "What is the time complexity of accessing an element in an array?", "focusSkill": "DSA"},
  {"id": "q-6", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "What is the difference between an array and a linked list?", "focusSkill": "DSA"},
  {"id": "q-7", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Meta", "question": "When would you use a stack instead of a queue?", "focusSkill": "DSA"},
  {"id": "q-8", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Amazon", "question": "What is the difference between git pull and git fetch?", "focusSkill": "Git"},
  {"id": "q-9", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Microsoft", "question": "What is the difference between a process and a thread?", "focusSkill": "OS"},
  {"id": "q-10", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Netflix", "question": "What happens when you enter a URL into a browser?", "focusSkill": "Networks"},
  {"id": "q-11", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "Explain the Rule of 3, Rule of 5, and Rule of 0.", "focusSkill": "C++"},
  {"id": "q-12", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "What problem do smart pointers solve?", "focusSkill": "C++"},
  {"id": "q-13", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "Explain move semantics and why they can improve performance.", "focusSkill": "C++"},
  {"id": "q-14", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Microsoft", "question": "What is the difference between compile-time and runtime polymorphism?", "focusSkill": "OOP"},
  {"id": "q-15", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Netflix", "question": "What is a race condition? How can you prevent one?", "focusSkill": "OS"},
  {"id": "q-16", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "What is a deadlock? Explain the four necessary conditions for deadlock.", "focusSkill": "OS"},
  {"id": "q-17", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "What is database normalization and why is it useful?", "focusSkill": "DBMS"},
  {"id": "q-18", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "How does a database index improve query performance?", "focusSkill": "DBMS"},
  {"id": "q-19", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Microsoft", "question": "Explain TCP vs UDP and when you would choose each.", "focusSkill": "Networks"},
  {"id": "q-20", "role": "Full-Stack", "level": "Senior", "type": "system-design", "companyTag": "Netflix", "question": "How would you identify and eliminate a performance bottleneck in a production application?", "focusSkill": "Architecture"},
  {"id": "q-21", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "Given an array of integers, find the largest element without sorting the array.", "focusSkill": "Arrays"},
  {"id": "q-22", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Meta", "question": "Find the second-largest distinct element in an array.", "focusSkill": "Arrays"},
  {"id": "q-23", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Amazon", "question": "Determine whether a string is a palindrome.", "focusSkill": "Strings"},
  {"id": "q-24", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Microsoft", "question": "Given an array, determine whether it contains duplicates.", "focusSkill": "Hashing"},
  {"id": "q-25", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Netflix", "question": "Given a sorted array, determine whether two numbers sum to a target.", "focusSkill": "Two Pointers"},
  {"id": "q-26", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "Insert a node at the beginning and end of a singly linked list.", "focusSkill": "Linked List"},
  {"id": "q-27", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Meta", "question": "Reverse a singly linked list.", "focusSkill": "Linked List"},
  {"id": "q-28", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Amazon", "question": "Determine whether a string containing (), {}, and [] has balanced brackets.", "focusSkill": "Stack"},
  {"id": "q-29", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Microsoft", "question": "Implement a queue using an array.", "focusSkill": "Queue"},
  {"id": "q-30", "role": "Full-Stack", "level": "Junior", "type": "technical", "companyTag": "Netflix", "question": "Implement binary search on a sorted array.", "focusSkill": "Binary Search"},
  {"id": "q-31", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "Find the maximum sum of a contiguous subarray.", "focusSkill": "Arrays"},
  {"id": "q-32", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "Find the length of the longest substring without repeating characters.", "focusSkill": "Sliding Window"},
  {"id": "q-33", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "Given an array and target k, find the number of pairs whose sum equals k.", "focusSkill": "Hashing"},
  {"id": "q-34", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Microsoft", "question": "Given an array, move all zeroes to the end while maintaining the order of other elements.", "focusSkill": "Two Pointers"},
  {"id": "q-35", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Netflix", "question": "Detect whether a linked list contains a cycle.", "focusSkill": "Linked List"},
  {"id": "q-36", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "Find the middle node of a linked list in one traversal.", "focusSkill": "Linked List"},
  {"id": "q-37", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "Find the next greater element for every element in an array.", "focusSkill": "Stack"},
  {"id": "q-38", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "Find the height of a binary tree.", "focusSkill": "Trees"},
  {"id": "q-39", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Microsoft", "question": "Determine whether two binary trees are identical.", "focusSkill": "Trees"},
  {"id": "q-40", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Netflix", "question": "Perform BFS traversal of an undirected graph.", "focusSkill": "Graphs"},
  {"id": "q-41", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "Detect a cycle in an undirected graph.", "focusSkill": "Graphs"},
  {"id": "q-42", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "Given intervals, merge all overlapping intervals.", "focusSkill": "Greedy"},
  {"id": "q-43", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "Find the K largest elements in an array efficiently.", "focusSkill": "Heap"},
  {"id": "q-44", "role": "Full-Stack", "level": "Mid", "type": "technical", "companyTag": "Microsoft", "question": "Find the first and last occurrence of a target in a sorted array.", "focusSkill": "Binary Search"},
  {"id": "q-45", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Netflix", "question": "Given a set of numbers and a target, determine whether the target can be formed using a subset.", "focusSkill": "Dynamic Programming"},
  {"id": "q-46", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Google", "question": "Find the shortest path between two nodes in a weighted graph.", "focusSkill": "Graphs"},
  {"id": "q-47", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Meta", "question": "Implement Dijkstra's algorithm and explain its complexity.", "focusSkill": "Graphs"},
  {"id": "q-48", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Amazon", "question": "Solve the longest common subsequence problem.", "focusSkill": "Dynamic Programming"},
  {"id": "q-49", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Microsoft", "question": "Generate all valid configurations for the N-Queens problem.", "focusSkill": "Backtracking"},
  {"id": "q-50", "role": "Full-Stack", "level": "Senior", "type": "technical", "companyTag": "Netflix", "question": "Given a grid containing land and water, find the number of islands.", "focusSkill": "Graphs"},
  {"id": "q-51", "role": "Frontend", "level": "Junior", "type": "technical", "companyTag": "Meta", "question": "What is the DOM and how does JavaScript interact with it?", "focusSkill": "Technical"},
  {"id": "q-52", "role": "Frontend", "level": "Junior", "type": "technical", "companyTag": "Airbnb", "question": "What is the difference between let, const, and var?", "focusSkill": "Technical"},
  {"id": "q-53", "role": "Frontend", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "What is event bubbling?", "focusSkill": "Technical"},
  {"id": "q-54", "role": "Frontend", "level": "Junior", "type": "technical", "companyTag": "Netflix", "question": "What is responsive web design?", "focusSkill": "Technical"},
  {"id": "q-55", "role": "Frontend", "level": "Junior", "type": "technical", "companyTag": "Spotify", "question": "What is the difference between == and === in JavaScript?", "focusSkill": "Technical"},
  {"id": "q-56", "role": "Frontend", "level": "Mid", "type": "technical", "companyTag": "Stripe", "question": "Explain closures in JavaScript with a practical example.", "focusSkill": "Technical"},
  {"id": "q-57", "role": "Frontend", "level": "Mid", "type": "technical", "companyTag": "Meta", "question": "What is the JavaScript event loop?", "focusSkill": "Technical"},
  {"id": "q-58", "role": "Frontend", "level": "Mid", "type": "technical", "companyTag": "Airbnb", "question": "How would you optimize a slow React application?", "focusSkill": "Technical"},
  {"id": "q-59", "role": "Frontend", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "What causes unnecessary React re-renders?", "focusSkill": "Technical"},
  {"id": "q-60", "role": "Frontend", "level": "Senior", "type": "system-design", "companyTag": "Netflix", "question": "Design the frontend architecture for a large e-commerce application used by millions of users.", "focusSkill": "System Design"},
  {"id": "q-61", "role": "Backend", "level": "Junior", "type": "technical", "companyTag": "Stripe", "question": "What is a REST API?", "focusSkill": "Technical"},
  {"id": "q-62", "role": "Backend", "level": "Junior", "type": "technical", "companyTag": "Amazon", "question": "What is the difference between authentication and authorization?", "focusSkill": "Technical"},
  {"id": "q-63", "role": "Backend", "level": "Junior", "type": "technical", "companyTag": "Google", "question": "What are HTTP GET, POST, PUT, PATCH, and DELETE used for?", "focusSkill": "Technical"},
  {"id": "q-64", "role": "Backend", "level": "Junior", "type": "technical", "companyTag": "Uber", "question": "What is JSON and why is it commonly used in APIs?", "focusSkill": "Technical"},
  {"id": "q-65", "role": "Backend", "level": "Mid", "type": "technical", "companyTag": "Netflix", "question": "How would you implement rate limiting for an API?", "focusSkill": "Technical"},
  {"id": "q-66", "role": "Backend", "level": "Mid", "type": "technical", "companyTag": "LinkedIn", "question": "What is caching and when can caching actually make an application worse?", "focusSkill": "Technical"},
  {"id": "q-67", "role": "Backend", "level": "Mid", "type": "technical", "companyTag": "Stripe", "question": "What is a database transaction?", "focusSkill": "Technical"},
  {"id": "q-68", "role": "Backend", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "How would you handle two users attempting to modify the same resource simultaneously?", "focusSkill": "Technical"},
  {"id": "q-69", "role": "Backend", "level": "Senior", "type": "system-design", "companyTag": "Google", "question": "Design a URL-shortening service capable of handling millions of requests per second.", "focusSkill": "System Design"},
  {"id": "q-70", "role": "Backend", "level": "Senior", "type": "system-design", "companyTag": "Uber", "question": "Design a notification system capable of sending millions of notifications per minute.", "focusSkill": "System Design"},
  {"id": "q-71", "role": "DevOps", "level": "Junior", "type": "technical", "companyTag": "AWS", "question": "What problem does Docker solve?", "focusSkill": "Technical"},
  {"id": "q-72", "role": "DevOps", "level": "Junior", "type": "technical", "companyTag": "Google Cloud", "question": "What is CI/CD?", "focusSkill": "Technical"},
  {"id": "q-73", "role": "DevOps", "level": "Junior", "type": "technical", "companyTag": "Microsoft Azure", "question": "What is the difference between a virtual machine and a container?", "focusSkill": "Technical"},
  {"id": "q-74", "role": "DevOps", "level": "Junior", "type": "technical", "companyTag": "HashiCorp", "question": "What is Git branching?", "focusSkill": "Technical"},
  {"id": "q-75", "role": "DevOps", "level": "Mid", "type": "technical", "companyTag": "Netflix", "question": "What is Kubernetes and why would an organization use it?", "focusSkill": "Technical"},
  {"id": "q-76", "role": "DevOps", "level": "Mid", "type": "technical", "companyTag": "AWS", "question": "Explain horizontal vs vertical scaling.", "focusSkill": "Technical"},
  {"id": "q-77", "role": "DevOps", "level": "Mid", "type": "technical", "companyTag": "Google Cloud", "question": "What is a load balancer?", "focusSkill": "Technical"},
  {"id": "q-78", "role": "DevOps", "level": "Mid", "type": "technical", "companyTag": "Microsoft Azure", "question": "What is Infrastructure as Code?", "focusSkill": "Technical"},
  {"id": "q-79", "role": "DevOps", "level": "Senior", "type": "system-design", "companyTag": "HashiCorp", "question": "Design a highly available cloud deployment system spanning multiple availability zones.", "focusSkill": "System Design"},
  {"id": "q-80", "role": "DevOps", "level": "Senior", "type": "technical", "companyTag": "Netflix", "question": "Your application suddenly receives 100x its normal traffic. Walk through how you would keep the system operational.", "focusSkill": "Troubleshooting"},
  {"id": "q-81", "role": "Cybersecurity", "level": "Junior", "type": "technical", "companyTag": "CrowdStrike", "question": "What is SQL injection?", "focusSkill": "Technical"},
  {"id": "q-82", "role": "Cybersecurity", "level": "Junior", "type": "technical", "companyTag": "Palo Alto Networks", "question": "What is cross-site scripting (XSS)?", "focusSkill": "Technical"},
  {"id": "q-83", "role": "Cybersecurity", "level": "Junior", "type": "technical", "companyTag": "Cloudflare", "question": "What is the difference between encryption and hashing?", "focusSkill": "Technical"},
  {"id": "q-84", "role": "Cybersecurity", "level": "Junior", "type": "technical", "companyTag": "Microsoft", "question": "What is multi-factor authentication?", "focusSkill": "Technical"},
  {"id": "q-85", "role": "Cybersecurity", "level": "Mid", "type": "technical", "companyTag": "Google", "question": "How does HTTPS protect communication between a browser and server?", "focusSkill": "Technical"},
  {"id": "q-86", "role": "Cybersecurity", "level": "Mid", "type": "technical", "companyTag": "CrowdStrike", "question": "What is CSRF and how can it be prevented?", "focusSkill": "Technical"},
  {"id": "q-87", "role": "Cybersecurity", "level": "Mid", "type": "technical", "companyTag": "Palo Alto Networks", "question": "You discover that a web application is storing passwords as plaintext. What should you do?", "focusSkill": "Scenario"},
  {"id": "q-88", "role": "Cybersecurity", "level": "Senior", "type": "system-design", "companyTag": "Cloudflare", "question": "Design an authentication system for a large-scale web application.", "focusSkill": "System Design"},
  {"id": "q-89", "role": "Data/ML", "level": "Junior", "type": "technical", "companyTag": "OpenAI", "question": "What is the difference between supervised and unsupervised learning?", "focusSkill": "Technical"},
  {"id": "q-90", "role": "Data/ML", "level": "Junior", "type": "technical", "companyTag": "Google DeepMind", "question": "What is overfitting?", "focusSkill": "Technical"},
  {"id": "q-91", "role": "Data/ML", "level": "Junior", "type": "technical", "companyTag": "Meta AI", "question": "What is the difference between classification and regression?", "focusSkill": "Technical"},
  {"id": "q-92", "role": "Data/ML", "level": "Junior", "type": "technical", "companyTag": "Apple", "question": "Write a SQL query to find the second-highest salary in an employee table.", "focusSkill": "SQL"},
  {"id": "q-93", "role": "Data/ML", "level": "Mid", "type": "technical", "companyTag": "Amazon", "question": "How would you determine whether a machine-learning model is overfitting?", "focusSkill": "ML"},
  {"id": "q-94", "role": "Data/ML", "level": "Mid", "type": "technical", "companyTag": "OpenAI", "question": "Explain precision, recall, and F1 score.", "focusSkill": "ML"},
  {"id": "q-95", "role": "Data/ML", "level": "Mid", "type": "technical", "companyTag": "Google DeepMind", "question": "You receive a dataset containing 20% missing values. How would you decide what to do with them?", "focusSkill": "Data"},
  {"id": "q-96", "role": "Data/ML", "level": "Senior", "type": "system-design", "companyTag": "Meta AI", "question": "Design a machine-learning recommendation system for an e-commerce platform.", "focusSkill": "ML System Design"},
  {"id": "q-97", "role": "Game Development", "level": "Junior", "type": "technical", "companyTag": "Epic Games", "question": "What is a game loop and why is it necessary?", "focusSkill": "Technical"},
  {"id": "q-98", "role": "Game Development", "level": "Junior", "type": "technical", "companyTag": "Unity", "question": "Why is C++ commonly used in game engines?", "focusSkill": "C++"},
  {"id": "q-99", "role": "Game Development", "level": "Mid", "type": "technical", "companyTag": "Rockstar Games", "question": "How would you implement collision detection between two game objects?", "focusSkill": "Game Programming"},
  {"id": "q-100", "role": "Game Development", "level": "Senior", "type": "system-design", "companyTag": "EA", "question": "Design the backend architecture for a multiplayer game supporting millions of players.", "focusSkill": "Game Architecture"},
];

// Picks 5 questions matching role + level, with fallback broadening.
export function selectQuestions(role, level, gapSkills = []) {
  const normalizedRole = role.trim();
  const normalizedLevel = level.trim();

  // 1. Exact match on role + level
  let pool = QUESTION_BANK.filter(
    q => q.role.toLowerCase() === normalizedRole.toLowerCase() && q.level === normalizedLevel
  );

  // 2. If not enough, broaden to any matching role
  if (pool.length < 5) {
    const broader = QUESTION_BANK.filter(
      q => q.role.toLowerCase() === normalizedRole.toLowerCase() && !pool.includes(q)
    );
    pool = [...pool, ...broader];
  }

  // 3. If still not enough (custom role), match by level across all roles
  if (pool.length < 5) {
    const levelMatch = QUESTION_BANK.filter(
      q => q.level === normalizedLevel && !pool.includes(q)
    );
    pool = [...pool, ...levelMatch];
  }

  // 4. Final fallback — use full bank
  if (pool.length < 5) {
    const remaining = QUESTION_BANK.filter(q => !pool.includes(q));
    pool = [...pool, ...remaining];
  }

  // Prioritize questions whose focusSkill matches user's gap skills
  if (gapSkills.length > 0) {
    const gapLower = gapSkills.map(s => s.toLowerCase());
    pool.sort((a, b) => {
      const aMatch = gapLower.some(g => a.focusSkill.toLowerCase().includes(g) || g.includes(a.focusSkill.toLowerCase())) ? -1 : 0;
      const bMatch = gapLower.some(g => b.focusSkill.toLowerCase().includes(g) || g.includes(b.focusSkill.toLowerCase())) ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  // Shuffle top pool and pick 5 (Fisher-Yates on first min(pool.length, 15) elements for variety)
  const shuffleCount = Math.min(pool.length, 15);
  for (let i = shuffleCount - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 5);
}

export default QUESTION_BANK;
