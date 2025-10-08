import { AuthContext } from "../Context/AuthContext";
import { useContext } from "react";
import {io} from 'socket.io-client'

function getToken() {
    const {token} = useContext(AuthContext);
    return token;
}

const socket = () => {

    io("http://localhost:3000", {
        auth: {token: getToken()},
        autoConnect: false

    })
};

export default socket