import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Library, Download, Search, Globe, Filter, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalDoc {
    id: string;
    title: string;
    description: string;
    file_url: string;
    category: string;
    country: string;
    year: number;
}

const Database: React.FC = () => {
    const [docs, setDocs] = useState<LegalDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCountry, setFilterCountry] = useState('Tous');

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        const { data, error } = await supabase
            .from('legal_database')
            .select('*')
            .order('year', { ascending: false });

        if (!error && data) setDocs(data);
        setLoading(false);
    };

    const filteredDocs = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCountry = filterCountry === 'Tous' || doc.country === filterCountry;
        return matchesSearch && matchesCountry;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container">
                <div className="bg-primary-600 rounded-3xl p-8 md:p-12 text-white mb-12 shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold mb-4">Bibliothèque Juridique</h1>
                        <p className="text-primary-100 max-w-2xl text-lg">
                            Accédez à une vaste collection de codes, dahirs, décrets et textes de loi 
                            officiels du Maroc et de la France.
                        </p>
                    </div>
                    <Library className="absolute right-[-20px] bottom-[-20px] h-64 w-64 text-primary-500/20" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un texte (Ex: Code Civil, Travail...)"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-gray-400" />
                            <select 
                                className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                                value={filterCountry}
                                onChange={(e) => setFilterCountry(e.target.value)}
                            >
                                <option value="Tous">Tous les pays</option>
                                <option value="Maroc">Maroc</option>
                                <option value="France">France</option>
                            </select>
                        </div>
                        <button className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                            <Filter className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredDocs.map((doc, index) => (
                        <motion.div 
                            key={doc.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{doc.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3 w-3" />
                                            {doc.country}
                                        </span>
                                        <span>•</span>
                                        <span>{doc.category}</span>
                                        <span>•</span>
                                        <span>{doc.year}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-xl font-bold hover:bg-primary-600 hover:text-white transition-all">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Télécharger</span>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {filteredDocs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                        <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun document trouvé pour cette recherche.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Database;
