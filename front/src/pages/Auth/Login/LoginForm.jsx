// @ts-nocheck
import React, { useState } from "react";
import {Mail, Lock} from 'lucide-react';
import Logo_Sem_Contorno from '../../../assets/Logo_Sem_Contorno.svg';
import { Link, useNavigate } from 'react-router-dom'; 
import api from '../../../services/api'; 
import { jwtDecode } from "jwt-decode"; 

const LoginForm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const renderMessage = () => {
        if (!message) return null;
        const messageClasses = message.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-500 text-white';
        return <div className={`w-full p-3 my-4 rounded-md text-center ${messageClasses}`}>{message.text}</div>;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // 1. Apenas pega o Token (RÁPIDO)
            const response = await api.post('/auth/login', {
                email: email,
                password: password 
            });

            const { access_token } = response.data;
            localStorage.setItem('accessToken', access_token);
            
            // 2. Decodifica para saber pra onde ir
            try {
                const decodedToken = jwtDecode(access_token);
                const userRole = decodedToken.lv_acesso || decodedToken.role || "aluno"; 

                // Salva Role e ID para a Sidebar usar depois
                localStorage.setItem('userRole', userRole);
                
                // Salva um "rascunho" do usuário só com o ID do token, para a Sidebar saber quem buscar
                const userId = decodedToken.id_user || decodedToken.sub;
                localStorage.setItem('userIdTemp', userId); 

                setMessage({ text: 'Sucesso! Redirecionando...', type: 'sucesso' });
                
                // Redirecionamento rápido
                setTimeout(() => {
                    switch(userRole.toLowerCase()) {
                        case 'admin':
                        case 'colaborador':
                        case 'recepcionista':
                        case 'supremo':
                            navigate('/admin/dashboard'); 
                            break;
                        case 'instrutor':
                        case 'professor':
                            navigate('/instrutor/dashboard'); 
                            break;
                        case 'aluno':
                        default:
                            navigate('/aluno/dashboard');
                            break;
                    }
                }, 500); // Reduzi para meio segundo

            } catch (decodeError) {
                console.error("Erro token:", decodeError);
                navigate('/aluno/dashboard');
            }
            
        } catch (error) {
            console.error("Erro no login:", error);
            const errorMessage = error.response?.data?.detail || "Falha na autenticação.";
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <form className='flex flex-col items-center justify-center min-h-screen bg-bismark-800 p-4' onSubmit={handleSubmit}>
        <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md w-full max-w-md">
            <img src={Logo_Sem_Contorno} alt="Logo da Empresa" className="w-40 mb-4" />
            {renderMessage()}
            <h2 className="text-xl font-bold mb-6 text-gray-800">LOGIN</h2>

            <div className="flex items-center w-full p-2 mb-4 border border-gray-300 rounded-md">
                <Mail className="text-gray-500 mr-2"/>
                <input type="email" placeholder="Email" className="flex-grow outline-none border-none bg-transparent text-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="flex items-center w-full p-2 mb-4 border border-gray-300 rounded-md">
                <Lock className="text-gray-500 mr-2"/>
                <input type="password" placeholder="Senha" className="flex-grow outline-none border-none bg-transparent text-gray-700" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <Link to={'/forgot-password'} className='text font-mono text-center text-gray-500 mt-1 hover:text-dove-gray-950'>ESQUECI A SENHA</Link> 
            <br />
            <button className="w-full py-3 bg-blumine-900 text-white font-bold rounded-md hover:bg-blumine-950 transition-colors duration-300" type="submit" disabled={isLoading}>
                {isLoading ? 'AGUARDE...' : 'ENTRAR'}
            </button>
        </div>
    </form>
  );
};

export default LoginForm;