import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/components/GymAdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const helperCode = `
const getAuthHeaders = () => {
  const token = localStorage.getItem('fitcore_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
};

const authFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    }
  });
};
`;

if (!content.includes('const authFetch =')) {
  content = content.replace(
    "const API_BASE = 'http://localhost:7000/api/gym-admin';",
    "const API_BASE = 'http://localhost:7000/api/gym-admin';\n" + helperCode
  );
  content = content.split('fetch(').join('authFetch(');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ GymAdminDashboard updated with authFetch!');
} else {
  console.log('authFetch already exists in GymAdminDashboard.');
}
