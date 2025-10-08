import { AuthContext } from "../Context/AuthContext"
import { useContext, useEffect } from "react"

const Logout = () => {
const {setToken, setLoading} = useContext(AuthContext)
    useEffect(() => {
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