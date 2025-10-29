import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import type { AuthContextType } from '../types';

interface Language {
    code: string;
    label: string;
    flag: string;
}

const Settings: React.FC = (): React.ReactElement => {
    const authContext = useContext(AuthContext) as AuthContextType | undefined;
    
    if (!authContext) {
        throw new Error('Settings must be used within an AuthContextProvider');
    }
    
    const { language, lan, setLan } = authContext;

    // 🔧 FUNCIÓN AUXILIAR PARA FALLBACKS
    const getFallback = (key: string): string => {
        const fallbacks: Record<string, string> = {
            'Settings': 'Settings',
            'setSelectLanguage': 'Select Language',
            'setCurrentLanguage': 'Current Language',
            'changePassword': 'Change Password'
        };
        
        return fallbacks[key] || key;
    };

    // 🔧 FUNCIÓN HELPER CORREGIDA - ERROR DE TYPE ASSERTION ARREGLADO
    const getText = (key: string): string => {
        // Verificaciones paso a paso para evitar errores de TypeScript
        if (!language) {
            console.warn('Language object is not available');
            return getFallback(key);
        }
        
        if (!lan) {
            console.warn('Language code (lan) is not available');
            return getFallback(key);
        }
        
        // Verificar si la clave del idioma existe en language
        if (!(lan in language)) {
            console.warn(`Language '${lan}' is not available in language object`);
            return getFallback(key);
        }
        
        // Acceso seguro a la propiedad del idioma
        const languageData = language[lan];
        if (!languageData || typeof languageData !== 'object') {
            console.warn(`Language data for '${lan}' is null, undefined or not an object`);
            return getFallback(key);
        }
        
        // Verificar si la clave específica existe
        if (!(key in languageData)) {
            console.warn(`Key '${key}' not found in language '${lan}'`);
            return getFallback(key);
        }
        
        // 🔧 CORRECCIÓN: Conversión doble para satisfacer TypeScript estricto
        const languageRecord = languageData as unknown as Record<string, unknown>;
        const value = languageRecord[key];
        
        // Verificar que el valor existe y es string
        if (value === undefined) {
            console.warn(`Value for key '${key}' is undefined`);
            return getFallback(key);
        }
        
        return typeof value === 'string' ? value : getFallback(key);
    };

    const languages: Language[] = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'pt', label: 'Português', flag: '🇵🇹' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'ar', label: 'العربية', flag: '🇸🇦' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' }
    ];

    const handleLanguageChange = (languageCode: string): void => {
        if (setLan) {
            setLan(languageCode);
            localStorage.setItem('language', languageCode);
        } else {
            console.warn('setLan function is not available');
        }
    };

    const handleChangePassword = (): void => {
        alert('Change password functionality will be implemented soon!');
    };

    // Función helper para encontrar idioma actual de forma segura
    const getCurrentLanguage = (): { label: string; flag: string } => {
        const defaultLang = { label: 'English', flag: '🇬🇧' };
        
        if (!lan) return defaultLang;
        
        const foundLang = languages.find(l => l.code === lan);
        return foundLang || defaultLang;
    };

    const currentLang = getCurrentLanguage();

    return (
        <div className='flex justify-center items-start p-6 w-full'>
            <div className='w-full max-w-2xl'>
                {/* Header */}
                <div className="mb-8">
                    <h2 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2 tracking-tight flex items-center gap-3'>
                        <span>⚙️</span>
                        {getText('Settings')}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"></div>
                </div>

                {/* Language Selection Section */}
                <section className='relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-purple-500/20 rounded-xl p-8 shadow-2xl shadow-purple-500/10 mb-8 overflow-hidden'>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                    
                    <h3 className='text-2xl font-bold text-white mb-6 flex items-center gap-3'>
                        <span className="text-purple-400">🌍</span>
                        {getText('setSelectLanguage')}
                    </h3>
                    
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`
                                    group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl 
                                    border-2 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden
                                    ${lan === lang.code 
                                        ? 'border-purple-400 bg-gradient-to-br from-purple-500/20 to-cyan-500/10 text-purple-300 shadow-lg shadow-purple-500/30' 
                                        : 'border-slate-600 bg-gradient-to-br from-slate-700 to-slate-800 text-gray-300 hover:border-slate-500 hover:from-slate-600 hover:to-slate-700'
                                    }
                                `}
                            >
                                {lan === lang.code && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                                    </div>
                                )}
                                
                                <span className='text-5xl group-hover:scale-110 transition-transform duration-200'>{lang.flag}</span>
                                <span className='font-bold text-lg'>{lang.code.toUpperCase()}</span>
                                <span className='text-sm text-center leading-tight'>{lang.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Current Selection Display */}
                    <div className='bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700/50'>
                        <div className="flex items-center gap-3">
                            <span className="text-cyan-400 text-xl">✨</span>
                            <p className='text-sm text-gray-400'>
                                {getText('setCurrentLanguage')}: 
                                <span className='text-white font-bold ml-2 text-lg'>
                                    {currentLang.label}
                                </span>
                                <span className="ml-2 text-2xl">
                                    {currentLang.flag}
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Change Password Section */}
                <section className='relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-xl p-8 shadow-2xl shadow-cyan-500/10 overflow-hidden'>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                    
                    <h3 className='text-2xl font-bold text-white mb-6 flex items-center gap-3'>
                        <span className="text-cyan-400">🔐</span>
                        Security Settings
                    </h3>
                    
                    <button 
                        onClick={handleChangePassword}
                        className="group w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                    >
                        <span className="text-xl group-hover:rotate-12 transition-transform duration-200">🔑</span>
                        {getText('changePassword')}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default Settings;