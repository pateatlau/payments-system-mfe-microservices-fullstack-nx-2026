/**
 * Admin Dashboard Component
 * Main admin interface - exposed via Module Federation
 */

import { useAuthStore } from 'shared-auth-store';

export function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name || 'Admin'}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              User Management
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Manage users, roles, and permissions
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Users →
            </button>
          </div>

          {/* Payments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Reports
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              View payment statistics and reports
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Reports →
            </button>
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              System Health
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Monitor system status and health
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Status →
            </button>
          </div>

          {/* Audit Logs Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Audit Logs
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Review system activity and audit trails
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View Logs →
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Active Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$0</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
