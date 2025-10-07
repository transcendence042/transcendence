import { useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../Context/AuthContext"

const ProtectorOfThings = () => {
    
const navigate = useNavigate({childre});

    const {allow} = useContext(AuthContext);
    useEffect(() => {
        if (allow) {
            navigate("/index/")
        } else {
            navigate("/login/")
        }
    }, [allow])
    return (
        <></>
    )
}

export default ProtectorOfThings
