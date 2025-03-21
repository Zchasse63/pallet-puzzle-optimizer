import React from 'react';

/**
 * Simple test page to verify application rendering
 */
const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold mb-4">Pallet Puzzle Optimizer</h1>
        <p className="mb-4">If you can see this page, the basic React rendering is working correctly.</p>
        <hr className="my-6" />
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Status Check</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>React application is running</li>
            <li>Basic component rendering works</li>
            <li>Router is functional if you reached this page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
