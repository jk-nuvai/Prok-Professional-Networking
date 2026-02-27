const API_URL = 'http://localhost:5000';

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    created_at: string;
  };
}

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  signup: async (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};
