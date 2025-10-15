import { AuthContext } from "../Context/AuthContext"
import { ComponentContext } from "../Context/ComponentsContext"
import { useContext, useEffect, useRef } from "react"

const Logout = () => {
const {setToken, setLoading} = useContext(AuthContext)
const hasLoggedOut = useRef(false);

    useEffect(() => {
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;

        const handleLogout = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch("http://localhost:3000/api/auth/logout", {
                    method: 'POST',
                    headers: {"Authorization": `Bearer ${token}`},

                }); 
            } catch (err) {
                alert("You are out");
            }
            localStorage.removeItem('token');
            setToken(null);
        }
        handleLogout();
    }, []);

    return (
        <p>
            This is the logout
        </p>
    )
}

export default Logout