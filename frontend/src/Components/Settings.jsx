
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

const Settings = () => {
    const { language, lan, setLan } = useContext(AuthContext);

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'pt', label: 'Português', flag: '🇵🇹' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
    ];

    return (
        <div className='flex justify-center items-start p-6 w-full max-w-2'>
            <div className='w-full max-w-2xl'>
                {/* Header */}
                <h2 className='text-3xl font-bold text-pong-green mb-8'>{language[lan].Settings}</h2>

                {/* Language Selection Section */}
                <section className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
                    <h3 className='text-xl font-semibold text-white mb-4'>Select Language</h3>
                    
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLan(lang.code)}
                                className={`
                                    flex flex-col items-center justify-center gap-2 p-4 rounded-lg 
                                    border-2 transition-all duration-300
                                    ${lan === lang.code 
                                        ? 'border-pong-green bg-pong-green/10 text-pong-green' 
                                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                                    }
                                `}
                            >
                                <span className='text-4xl'>{lang.flag}</span>
                                <span className='font-semibold text-sm'>{lang.code.toUpperCase()}</span>
                                <span className='text-xs'>{lang.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Current Selection Display */}
                    <div className='mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700'>
                        <p className='text-sm text-gray-400'>
                            Current Language: <span className='text-white font-semibold'>
                                {languages.find(l => l.code === lan)?.label || 'English'}
                            </span>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
