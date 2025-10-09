import { useContext, useState } from "react"
import { AuthContextProvider, AuthContext } from "../Context/AuthContext"
import { useNavigate } from "react-router-dom"

const RegisterForm = () => {

    const handleRegister = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const data = {
            username: form.get("username"),
            email: form.get("email"),
            displayName: form.get("displayName"),
            password: form.get("password"),
        };

        try {
            const res = await fetch("http://localhost:3000/api/auth/register", {
                method: 'POST',
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                body: new URLSearchParams(data),
            });
            if (res.ok) {
                alert("Registration successfully! You can now login");
            } else {
                const result = await res.json();
                alert(result.error || "Registration failed");
            }

        } catch (err) {
            alert("Connection Error: " + err.message);
        }
    }

return (
    <form onSubmit={handleRegister} className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-800">Register</h1>
            <div className="mt-3">
                <h2 className="py-2">Username:</h2>
                <input name="username" type="text" className="w-full border-2 p-3 rounded-md mb-4" placeholder="username..." required/>
                 <h2 className="py-2">Email (optional):</h2>
                <input name="email" className="w-full border-2 p-3 rounded-md mb-4" placeholder="Email"/>
                <h2 className="py-2">Display Name (optional):</h2>
                <input name="displayName" className="w-full border-2 p-3 rounded-md mb-4" placeholder="DisplayName"/>
                <h2 className="p-2">Password:</h2>
                <input name="password" type="password" className="w-full border-2 p-3 rounded-md mb-10" placeholder="Password..." required/>
            </div>
            <button className="text-xl mb-4 bg-indigo-600 p-3 rounded-md text-white hover:bg-indigo-700">Register</button>
        </form>
)
}

const LoginForm = ({setToken, setLoading}) => {

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.target);
        const data = {
            username: form.get("username"),
            password: form.get("password"),
        };
        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                body: new URLSearchParams(data),
            });
            if (res.ok) {
                const result = await res.json();
                localStorage.setItem('token', result.token)
                setToken(result.token);
                navigate('/index')
            } else {
                const result = await res.json();
                alert(result.error || "Login failed");
            }

        } catch (err) {
            alert("Connection Error: " + err.message);
        }
    }

    return (
        <>
        <form onSubmit={handleLogin} className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-800">Login</h1>
            <div className="mt-3">
                <h2 className="py-2">Username:</h2>
                <input name="username" type="text" className="w-full border-2 p-3 rounded-md mb-4" placeholder="username..." required/>
                <h2 className="p-2">Password:</h2>
                <input name="password" type="password" className="w-full border-2 p-3 rounded-md mb-10" placeholder="Password..." required/>
            </div>
            <button className="text-xl bg-indigo-600 p-3 rounded-md text-white hover:bg-indigo-700">Login</button>
        </form>
                <div className="mt-4 text-center mb-4">
                    {/* Use an anchor for OAuth redirect so the browser performs a full navigation */}
                    <a
                        href="/auth/google"
                        className="w-full inline-flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        aria-label="Sign in with Google"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Sign in with Google
                    </a>
                </div>
            </>
    )
}

const Login = () => {
    const {setToken, setLoading} = useContext(AuthContext);
    const [form, setForm] = useState('loginForm');

    return (
        <div className="bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-500 min-h-screen flex justify-center items-center">
            <div className="bg-white flex flex-col justify-center w-full max-w-md rounded-lg px-8 py-6">
                <h1 className="flex justify-center text-3xl font-sans mb-6 font-bold">Authentication 🔒</h1>
                <div className="flex justify-center py-4 mb-5">
                    <button
                        onClick={() => setForm('loginForm')}
                        className={`w-48 text-lg rounded-l-md  focus:outline-none focus:ring-1 focus:ring-indigo-700 focus:z-10 transition-colors ${form === 'loginForm' ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-indigo-600 hover:text-white hover:ring-2 hover:ring-indigo-400 hover:z-10'}`}
                    >
                        Login
                    </button>

                    <button
                        onClick={() => setForm('registerForm')}
                        className={`w-48 py-4 text-lg rounded-r-md focus:outline-none focus:ring-1  focus:ring-indigo-700 focus:z-10 transition-colors ${form === 'registerForm' ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-indigo-600 hover:text-white hover:ring-2 hover:ring-indigo-400 hover:z-10'}`}
                    >
                        Register
                    </button>
                </div>
                {form === 'loginForm' && <LoginForm setToken={setToken} setLoading={setLoading}/>}
                {form === 'registerForm' && <RegisterForm/>}
            </div>
        </div>
    )
}

export default Login