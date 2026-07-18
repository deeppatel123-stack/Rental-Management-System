import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();


export const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
        setLoading(false);
    }, [token]);

    const loginUser = (userPayload, accessToken, resToken) => {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', resToken);
        localStorage.setItem('user', JSON.stringify(userPayload));
        setToken(accessToken);
        setUser(userPayload);
    };

    const logoutUser = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn('Logging out of local state only');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateLocalUser = (updatedUser) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, updateLocalUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
