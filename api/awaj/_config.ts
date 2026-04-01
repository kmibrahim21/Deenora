export const AWAJ_BASE_URL = 'https://api.awajdigital.com/api';

export const getAwajHeaders = () => {
  const token = process.env.AWAJ_API_TOKEN;
  if (!token) {
    console.error('AWAJ_API_TOKEN is not set in environment variables');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

