import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Default initialized with Storekeeper role for instant demoing
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('storesync_user');
    return saved ? JSON.parse(saved) : {
      id: 1,
      username: 'storekeeper',
      name: 'Rajesh Sharma',
      role: 'Storekeeper',
      department: 'Main Store'
    };
  });

  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    // Fetch system users for quick role switcher
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsersList(data.users);
        }
      })
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('storesync_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('storesync_user');
  };

  const switchRoleUser = (userId) => {
    const target = usersList.find(u => u.id === Number(userId));
    if (target) {
      login(target);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, usersList, switchRoleUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
