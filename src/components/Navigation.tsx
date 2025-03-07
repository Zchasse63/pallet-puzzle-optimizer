
import React from 'react';
import { Layers, Package, Database, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'container', label: 'Container View', icon: <Database className="w-4 h-4" /> },
    { id: 'pallets', label: 'Pallet Conversion', icon: <Layers className="w-4 h-4" /> },
    { id: 'quote', label: 'Quote', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <nav className="flex items-center bg-white border-b border-gray-100 overflow-x-auto px-6">
      {tabs.map((tab, index) => (
        <motion.button
          key={tab.id}
          className={`flex items-center space-x-2 py-4 px-5 transition-all-200 relative ${
            activeTab === tab.id 
              ? 'text-app-blue font-medium' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab(tab.id)}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1], 
            delay: index * 0.05
          }}
        >
          {tab.icon}
          <span>{tab.label}</span>
          
          {activeTab === tab.id && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-blue"
              layoutId="activeTab"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </motion.button>
      ))}
    </nav>
  );
};

export default Navigation;
