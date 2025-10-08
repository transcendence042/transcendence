import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthContextProvider({children}) {


    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setUser(null);
                setLoading(false);
                console.log("You are not allow!")
                return ;
            }
            try {
                const res = await fetch('/api/auth/me', {
                    headers: {'Authorization': `Bearer ${token}`}
                })
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user)
                } else {
                    console.log("token is invalid");
                }

            } catch {
                console.log("token is invalid");
            } finally {
                setLoading(false)
            }

        }
        checkAuth();
    }, [token])


    return (
        <AuthContext.Provider value={{user, setUser, token, setToken, loading, setLoading}}>
            {children}
        </AuthContext.Provider>
    )
}
