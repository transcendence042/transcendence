import { useContext, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../Context/AuthContext"

const ProtectorOfThings = ({children}) => {
    const {user, loading} = useContext(AuthContext);

    if (loading) {
        return <p>...is Loading</p>
    }
    
    return user ? children : <Navigate to='/login'/>
}

export default ProtectorOfThings
