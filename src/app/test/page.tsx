export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-800 mb-6">4some Golf App</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Styling Test Page</h2>
          <p className="text-gray-600 mb-4">
            This is a test page to verify that Tailwind CSS is working properly.
          </p>
          <div className="space-y-2">
            <div className="bg-green-100 p-3 rounded">Green background test</div>
            <div className="bg-blue-100 p-3 rounded">Blue background test</div>
            <div className="bg-red-100 p-3 rounded">Red background test</div>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
            Test Button
          </button>
        </div>
      </div>
    </div>
  )
}