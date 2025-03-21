'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Settings, 
  PlusCircle,
  Share2,
  Eye,
  Calendar,
  Truck,
  BarChart4,
  AlertCircle
} from 'lucide-react';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useQuotes } from '@/hooks/useQuotes';

// Utilities
import { generateA11yId } from '@/utils/accessibility';

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    quotes, 
    isLoading, 
    error, 
    formatDate, 
    isExpired 
  } = useQuotes({ limit: 5 });
  
  // Generate unique IDs for accessibility
  const dashboardId = useRef(generateA11yId('dashboard')).current;
  const quotesTableId = useRef(generateA11yId('quotes-table')).current;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <ProtectedRoute>
      <div 
        className="min-h-screen bg-gray-50"
        id={dashboardId}
        aria-label="Dashboard"
      >
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Pallet Puzzle Optimizer</h1>
                </div>
                <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Main navigation">
                  <Link 
                    href="/dashboard" 
                    className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    aria-current="page"
                  >
                    <LayoutDashboard className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/quotes" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <FileText className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span>Quotes</span>
                  </Link>
                  <Link 
                    href="/products" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Package className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span>Products</span>
                  </Link>
                  <Link 
                    href="/quotes/create" 
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <Truck className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span>Optimize</span>
                  </Link>
                </nav>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <Link 
                  href="/profile" 
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Profile settings"
                >
                  <Settings className="h-6 w-6" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="px-4 py-6 sm:px-0">
            <motion.div 
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              variants={itemVariants}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                Welcome, {user?.user_metadata?.full_name || 'User'}
              </h2>
              <Link
                href="/quotes/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Create a new quote"
              >
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Create New Quote</span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <motion.div 
                className="bg-white shadow overflow-hidden sm:rounded-lg p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
                  <Package className="mr-2 h-5 w-5 text-blue-500" aria-hidden="true" />
                  <span>Product Management</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add, edit, and manage your products for optimization
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  aria-label="View all products"
                >
                  <span>View Products</span>
                </Link>
                <Link
                  href="/products/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Add a new product"
                >
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Add Product</span>
                </Link>
              </motion.div>
              
              <motion.div 
                className="bg-white shadow overflow-hidden sm:rounded-lg p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
                  <Truck className="mr-2 h-5 w-5 text-blue-500" aria-hidden="true" />
                  <span>Optimization Engine</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create quotes with optimized pallet arrangements
                </p>
                <Link
                  href="/quotes"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  aria-label="View all quotes"
                >
                  <span>View Quotes</span>
                </Link>
                <Link
                  href="/quotes/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Create a new optimization"
                >
                  <BarChart4 className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>New Optimization</span>
                </Link>
              </motion.div>
            </div>
            
            <motion.div 
              className="bg-white shadow overflow-hidden sm:rounded-lg"
              variants={itemVariants}
            >
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Your Recent Quotes</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View and manage your quotes
                </p>
              </div>
              
              {isLoading ? (
                <div className="px-4 py-12 flex justify-center" aria-live="polite">
                  <LoadingSpinner size="lg" label="Loading quotes..." />
                </div>
              ) : error ? (
                <div className="px-4 py-5" role="alert">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : quotes.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500" aria-live="polite">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                  <p className="mt-2 text-sm">You haven't created any quotes yet.</p>
                  <p className="mt-1">
                    <Link 
                      href="/quotes/create" 
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Create your first quote
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table 
                    className="min-w-full divide-y divide-gray-200"
                    id={quotesTableId}
                    aria-label="Recent quotes"
                  >
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stats
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotes.slice(0, 5).map((quote) => (
                        <tr 
                          key={quote.id} 
                          className={isExpired(quote.expires_at) ? 'bg-red-50' : ''}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {quote.name}
                            </div>
                            {isExpired(quote.expires_at) && (
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                aria-label="Expired"
                              >
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(quote.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quote.expires_at ? formatDate(quote.expires_at) : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-4 text-sm text-gray-500">
                              <span 
                                className="inline-flex items-center"
                                aria-label={`${quote.view_count || 0} views`}
                              >
                                <Eye className="mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                                {quote.view_count || 0}
                              </span>
                              <span 
                                className="inline-flex items-center"
                                aria-label={`${quote.share_count || 0} shares`}
                              >
                                <Share2 className="mr-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                                {quote.share_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              href={`/quotes/${quote.id}`}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              aria-label={`View quote ${quote.name}`}
                            >
                              View
                            </Link>
                            <Link 
                              href={`/quotes/${quote.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                              aria-label={`Edit quote ${quote.name}`}
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {quotes.length > 5 && (
                    <div className="bg-gray-50 px-6 py-3 text-right">
                      <Link 
                        href="/quotes"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        aria-label="View all quotes"
                      >
                        View all quotes
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div 
                className="bg-white overflow-hidden shadow rounded-lg"
                variants={itemVariants}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Quotes
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {quotes.length}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link 
                      href="/quotes" 
                      className="font-medium text-blue-600 hover:text-blue-500"
                      aria-label="View all quotes"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white overflow-hidden shadow rounded-lg"
                variants={itemVariants}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <Calendar className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Quotes
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {quotes.filter(q => !isExpired(q.expires_at)).length}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link 
                      href="/quotes?filter=active" 
                      className="font-medium text-blue-600 hover:text-blue-500"
                      aria-label="View active quotes"
                    >
                      View active
                    </Link>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white overflow-hidden shadow rounded-lg"
                variants={itemVariants}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <Package className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Products
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {/* This would ideally be fetched from the API */}
                            -
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link 
                      href="/products" 
                      className="font-medium text-blue-600 hover:text-blue-500"
                      aria-label="View all products"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
