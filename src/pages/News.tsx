import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Tag, ChevronRight, Newspaper, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalNews {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    image_url: string;
    author: string;
    published_at: string;
}

const News: React.FC = () => {
    const [news, setNews] = useState<LegalNews[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        const { data, error } = await supabase
            .from('legal_news')
            .select('*')
            .order('published_at', { ascending: false });

        if (!error && data) setNews(data);
        setLoading(false);
    };

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
                <div className="flex items-center gap-4 mb-8">
                    <a href="/" className="p-2 hover:bg-white rounded-lg transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </a>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Actualités Juridiques</h1>
                        <p className="text-gray-600">Restez informé des dernières évolutions légales au Maroc et en France.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item, index) => (
                        <motion.article 
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                        >
                            <div className="h-48 bg-gray-200 relative">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-50">
                                        <Newspaper className="h-12 w-12 text-primary-200" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary-600" />
                                    <span className="text-xs font-bold text-primary-700 uppercase">{item.category}</span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{item.title}</h2>
                                <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                                    {item.summary}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-400">Par {item.author}</span>
                                    <button className="flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all text-sm">
                                        Lire la suite
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {news.length === 0 && (
                    <div className="text-center py-20">
                        <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune actualité pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default News;
