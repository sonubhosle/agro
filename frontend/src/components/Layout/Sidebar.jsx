import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiHome,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const farmerMenu = [
    {
      name: 'Dashboard',
      path: '/dashboard/farmer',
      icon: FiHome,
    },
    {
      name: 'My Crops',
      path: '/dashboard/farmer/crops',
      icon: FiPackage,
    },
    {
      name: 'Price Analytics',
      path: '/dashboard/farmer/prices',
      icon: FiTrendingUp,
    },
    {
      name: 'Orders',
      path: '/dashboard/farmer/orders',
      icon: FiShoppingCart,
    },
    {
      name: 'Earnings',
      path: '/dashboard/farmer/earnings',
      icon: FiDollarSign,
    },
    {
      name: 'Messages',
      path: '/chat',
      icon: FiMessageSquare,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: FiUser,
    },
  ];

  const buyerMenu = [
    {
      name: 'Dashboard',
      path: '/dashboard/buyer',
      icon: FiHome,
    },
    {
      name: 'Browse Crops',
      path: '/crops',
      icon: FiPackage,
    },
    {
      name: 'Price Dashboard',
      path: '/prices',
      icon: FiTrendingUp,
    },
    {
      name: 'My Orders',
      path: '/orders',
      icon: FiShoppingCart,
    },
    {
      name: 'Messages',
      path: '/chat',
      icon: FiMessageSquare,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: FiUser,
    },
  ];

  const adminMenu = [
    {
      name: 'Dashboard',
      path: '/dashboard/admin',
      icon: FiHome,
    },
    {
      name: 'Users',
      path: '/dashboard/admin/users',
      icon: FiUsers,
    },
    {
      name: 'Crops',
      path: '/dashboard/admin/crops',
      icon: FiPackage,
    },
    {
      name: 'Orders',
      path: '/dashboard/admin/orders',
      icon: FiShoppingCart,
    },
    {
      name: 'Analytics',
      path: '/dashboard/admin/analytics',
      icon: FiBarChart2,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: FiSettings,
    },
  ];

  const getMenu = () => {
    switch (user?.role) {
      case 'farmer':
        return farmerMenu;
      case 'buyer':
        return buyerMenu;
      case 'admin':
        return adminMenu;
      default:
        return [];
    }
  };

  const menu = getMenu();

  return (
    <aside
      className={`bg-white border-r border-gray-200 fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } hidden md:block`}
      style={{ marginTop: '64px' }}
    >
      <div className="h-full flex flex-col">
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isCollapsed ? (
              <FiChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <FiChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <FiUser className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;