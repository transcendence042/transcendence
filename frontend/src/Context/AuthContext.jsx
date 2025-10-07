import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthContextProvider({children}) {


    const [allow, setAllow] = useState(false)
    const [username, setUsername] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setUsername(null);
                setAllow(false);
                setLoading(false);
                console.log("You are not allow!")
                return ;
            }
            try {
                const res = await fetch('/api/auth/me', {
                    headers: {'Autorization': `bearer ${token}`}
                })
                if (res.ok) {
                    const data = await res.json();
                    setUsername(data.username)
                    setAllow(true)
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
        <AuthContext.Provider value={{username, setUsername, token, setToken, loading, allow}}>
            {children}
        </AuthContext.Provider>
    )
}
