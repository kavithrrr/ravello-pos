"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 🛡️ Security Check: ලොගින් වෙලා නැත්නම් ලොගින් පේජ් එකට යවනවා
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
        
        // Notification Sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});

        if (payload.new.is_service_call) {
          setNotifications((prev) => [...prev, payload.new]);
          setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black italic text-red-600">
            RAVELLO <span className="text-white text-xl not-italic font-light uppercase tracking-widest">Command Center</span>
          </h1>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-600 transition-colors mt-2 tracking-widest"
          >
            → LOGOUT SYSTEM
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-sm">
            Live Orders: <span className="text-red-500 font-bold">{orders.filter(o => o.status !== 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-red-600 text-white p-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-3 border border-white/20">
            <span className="text-2xl">🔔</span>
            <p className="font-bold uppercase tracking-tighter text-sm">TABLE {n.table_number} NEEDS {n.service_type}!</p>
          </div>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`p-6 rounded-3xl border transition-all duration-500 ${
              order.is_service_call 
                ? 'border-red-600 bg-red-950/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]' 
                : 'border-zinc-800 bg-zinc-900/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl font-black italic tracking-tighter">TABLE {order.table_number}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                order.status === 'pending' ? 'bg-yellow-500 text-black' : 
                order.status === 'cooking' ? 'bg-blue-500 text-white' : 'bg-green-600 text-white'
              }`}>
                {order.status}
              </span>
            </div>

            {order.is_service_call ? (
              <div className="py-4">
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Service Request</p>
                <p className="text-2xl font-black text-red-500 italic uppercase tracking-tighter">{order.service_type}</p>
              </div>
            ) : (
              <div className="py-4 text-left">
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Food Order</p>
                <p className="text-white text-sm italic font-medium">New items received in order</p>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => updateStatus(order.id, 'cooking')} 
                className="flex-1 bg-white text-black py-2 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition active:scale-95"
              >
                Cooking
              </button>
              <button 
                onClick={() => updateStatus(order.id, 'completed')} 
                className="flex-1 bg-red-600 text-white py-2 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-red-700 transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}