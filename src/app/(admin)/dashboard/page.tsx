"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();

    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => [payload.new, ...prev]);
        
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});

        if (payload.new.is_service_call) {
          setNotifications((prev) => [...prev, payload.new]);
          setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        // Real-time status update logic
        setOrders((prev) => prev.map(o => o.id === payload.new.id ? payload.new : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) console.error("Error updating status:", error);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black italic text-red-600 tracking-tighter">
            RAVELLO <span className="text-white text-xl not-italic font-light uppercase tracking-widest">Command Center</span>
          </h1>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-600 transition-colors mt-2 tracking-widest"
          >
            → LOGOUT SYSTEM
          </button>
        </div>
        
        <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest">
          Active Tasks: <span className="text-red-500 text-lg ml-2">{orders.filter(o => o.status !== 'completed').length}</span>
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-red-600 text-white p-5 rounded-2xl shadow-2xl animate-bounce flex items-center gap-4 border border-white/20">
            <span className="text-3xl">🔔</span>
            <p className="font-black uppercase tracking-tight text-sm">TABLE {n.table_number} : {n.service_type}!</p>
          </div>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
              order.is_service_call 
                ? 'border-blue-600/50 bg-blue-950/10 shadow-[0_15px_40px_rgba(37,99,235,0.1)]' 
                : 'border-zinc-800 bg-zinc-900/40'
            } ${order.status === 'completed' ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-2xl font-black italic tracking-tighter uppercase">Table {order.table_number}</span>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                order.status === 'pending' ? 'bg-white text-black' : 
                order.status === 'cooking' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="py-2 mb-6 text-left">
              <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">
                {order.is_service_call ? 'Service Request' : 'Food Order'}
              </p>
              <h3 className={`text-2xl font-black italic uppercase tracking-tighter leading-none ${
                order.is_service_call ? 'text-blue-500' : 'text-zinc-100'
              }`}>
                {order.service_type.replace('ORDER: ', '')}
              </h3>
              {!order.is_service_call && (
                <p className="text-zinc-400 text-xs font-mono mt-3">Rs. {order.price?.toLocaleString()}</p>
              )}
            </div>

            {/* Context-Aware Action Buttons */}
            <div className="flex gap-3">
              {order.is_service_call ? (
                // 🔔 Only "Done" button for Service Calls (No Cooking)
                <>
                  {order.status !== 'completed' ? (
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-4 rounded-2xl uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      Done / Attended
                    </button>
                  ) : (
                    <div className="flex-1 text-center text-zinc-600 text-[10px] font-black py-4 uppercase tracking-widest border border-zinc-800 rounded-2xl">
                      Request Cleared
                    </div>
                  )}
                </>
              ) : (
                // 🍔 Food Order Actions
                <>
                  <button 
                    onClick={() => updateStatus(order.id, 'cooking')} 
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all active:scale-95 ${
                      order.status === 'cooking' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    Cooking
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, 'completed')} 
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all active:scale-95 ${
                      order.status === 'completed' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}