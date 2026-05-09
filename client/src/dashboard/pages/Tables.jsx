import { useState } from 'react';

const INITIAL_TABLES = [
  { id: 'T-1',  seats: 2, status: 'available', currentToken: null,  orderId: null        },
  { id: 'T-2',  seats: 2, status: 'occupied',  currentToken: 43,    orderId: 'ORD-043'   },
  { id: 'T-3',  seats: 4, status: 'available', currentToken: null,  orderId: null        },
  { id: 'T-4',  seats: 4, status: 'available', currentToken: null,  orderId: null        },
  { id: 'T-5',  seats: 4, status: 'occupied',  currentToken: 46,    orderId: 'ORD-046'   },
  { id: 'T-6',  seats: 4, status: 'reserved',  currentToken: null,  orderId: null        },
  { id: 'T-7',  seats: 6, status: 'available', currentToken: null,  orderId: null        },
  { id: 'T-8',  seats: 6, status: 'occupied',  currentToken: 49,    orderId: 'ORD-049'   },
  { id: 'T-9',  seats: 6, status: 'cleaning',  currentToken: null,  orderId: null        },
  { id: 'T-10', seats: 8, status: 'available', currentToken: null,  orderId: null        },
  { id: 'T-11', seats: 8, status: 'occupied',  currentToken: 44,    orderId: 'ORD-044'   },
  { id: 'T-12', seats: 8, status: 'occupied',  currentToken: 47,    orderId: 'ORD-047'   },
];

const STATUS_CFG = {
  available: { label: 'Available', bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-700', icon: '✅' },
  occupied:  { label: 'Occupied',  bg: 'bg-red-50',    border: 'border-red-300',   text: 'text-red-700',   icon: '🔴' },
  reserved:  { label: 'Reserved',  bg: 'bg-blue-50',   border: 'border-blue-300',  text: 'text-blue-700',  icon: '📋' },
  cleaning:  { label: 'Cleaning',  bg: 'bg-yellow-50', border: 'border-yellow-300',text: 'text-yellow-700',icon: '🧹' },
};

export default function Tables() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [filter, setFilter] = useState('all');

  const updateStatus = (id, newStatus) => {
    setTables(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: newStatus, currentToken: newStatus !== 'occupied' ? null : t.currentToken }
        : t
    ));
  };

  const filtered = filter === 'all' ? tables : tables.filter(t => t.status === filter);

  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
    cleaning:  tables.filter(t => t.status === 'cleaning').length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Table Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.available} available · {counts.occupied} occupied · {tables.length} total
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`rounded-xl p-4 border-2 text-left transition-all ${
              filter === key
                ? `${cfg.bg} ${cfg.border}`
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{cfg.icon}</div>
            <div className={`text-2xl font-extrabold ${cfg.text}`}>{counts[key]}</div>
            <div className="text-xs text-gray-500 mt-0.5">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(table => {
          const cfg = STATUS_CFG[table.status];
          return (
            <div
              key={table.id}
              className={`border-2 rounded-2xl p-5 ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{table.id}</h3>
                  <p className="text-xs text-gray-500">{table.seats} seats</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>

              {table.currentToken && (
                <div className="bg-white rounded-xl px-3 py-2 mb-3 border border-gray-100">
                  <p className="text-xs text-gray-400">Active token</p>
                  <p className={`text-xl font-extrabold ${cfg.text}`}>#{table.currentToken}</p>
                  <p className="text-xs text-gray-400">{table.orderId}</p>
                </div>
              )}

              {/* Status actions */}
              <div className="flex flex-col gap-1.5 mt-2">
                {table.status !== 'available' && (
                  <button
                    onClick={() => updateStatus(table.id, 'available')}
                    className="w-full py-1.5 bg-white border border-green-300 text-green-700 text-xs font-medium rounded-lg hover:bg-green-50 transition-colors"
                  >
                    ✅ Mark Available
                  </button>
                )}
                {table.status === 'occupied' && (
                  <button
                    onClick={() => updateStatus(table.id, 'cleaning')}
                    className="w-full py-1.5 bg-white border border-yellow-300 text-yellow-700 text-xs font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    🧹 Mark for Cleaning
                  </button>
                )}
                {table.status === 'available' && (
                  <button
                    onClick={() => updateStatus(table.id, 'reserved')}
                    className="w-full py-1.5 bg-white border border-blue-300 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    📋 Reserve Table
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}