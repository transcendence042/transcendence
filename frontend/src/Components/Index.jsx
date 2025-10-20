import { useState, useContext, useEffect } from "react"
import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext"

const Index = () => {

    const {user, language, lan} = useContext(AuthContext);
    const [grettings, setGrettings] = useState([]);
    const [welcome, setWelcome] = useState([]);

    useEffect(() => {
        const splitGrettings = language[lan].grettings.split("");
        const splitWelcome = language[lan].welcome.split("");
        setGrettings(splitGrettings);
        setWelcome(splitWelcome);
    }, [user, lan])

  

    return (
        <div className="text-white">
            <div className="flex flex-col justify-center items-center">
                <div className="flex mt-20">
                    {
                        grettings.map((letter, index) => (
                            <div key={index} className="group relative p-1">
                                <h1 className="relative scale-150 text-8xl bg-clip-text text-transparent bg-gradient-to-br from-emerald-300 to-emerald-600/60 hover:animate-spin hover:bg-cyan-600 cursor-pointer">
                                    {index > 0 && '\u00A0'}
                                    {letter}
                                </h1>
                            </div>
                        ))
                    }
                </div>
                <div className="flex mt-16">
                    {
                        welcome.map((letter, index) => (
                            <div key={index} className="">
                                <h1 className="text-4xl bg-clip-text text-transparent bg-gradient-to-br from-emerald-300 to-emerald-600/60 hover:animate-spin cursor-default">
                                    {index > 0 && '\u00A0'}
                                    {letter}
                                </h1>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default Index