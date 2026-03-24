"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function StatusContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || '1';
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const router = useRouter();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('table_number', parseInt(tableNumber))
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      setLatestOrder(data[0]);
      setAllOrders(data.filter(o => !o.is_service_call));
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel(`live-updates-${tableNumber}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `table_number=eq.${tableNumber}` 
      }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableNumber]);

  // 🧮 බිල ගණන් හදන හැටි
  const subtotal = allOrders.reduce((acc, order) => acc + (order.price || 0), 0);
  const serviceCharge = subtotal * 0.10;
  const total = subtotal + serviceCharge;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans pb-20 selection:bg-red-600">
      {/* Top Branding */}
      <div className="text-center mb-8 mt-4">
        <h1 className="text-xl font-black italic text-red-600 tracking-tighter uppercase">Order Tracking</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Table {tableNumber}</p>
      </div>

      {!latestOrder ? (
        <div className="text-center py-20 text-zinc-600 font-bold uppercase text-xs tracking-widest animate-pulse">
          No active orders found.
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-8">
          
          {/* 🔥 Main Animated Status Card (The "Lassana" Part) */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="text-6xl mb-6 animate-bounce">
              {latestOrder.status === 'pending' ? '⏳' : latestOrder.status === 'cooking' ? '👨‍🍳' : '✅'}
            </div>
            <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">
              {latestOrder.status === 'pending' ? 'RECEIVED' : 
               latestOrder.status === 'cooking' ? 'COOKING' : 'READY!'}
            </h2>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-6">
                Your latest item is being processed
            </p>
            
            {/* Animated Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-red-600 transition-all duration-1000 ease-out ${
                  latestOrder.status === 'pending' ? 'w-1/3' : 
                  latestOrder.status === 'cooking' ? 'w-2/3' : 'w-full'
                }`}
              ></div>
            </div>
          </div>

          {/* 🧾 Bill Summary & Item List Section */}
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] p-6 shadow-inner relative">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Current Bill</h3>
                <span className="bg-red-600/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-full border border-red-600/20 uppercase">Live Update</span>
            </div>

            <div className="space-y-4 mb-8">
              {allOrders.map((order, idx) => (
                <div key={idx} className="flex justify-between items-start group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-tight">
                        {order.service_type.replace('ORDER: ', '')}
                    </span>
                    <span className={`text-[8px] font-black uppercase ${
                      order.status === 'completed' ? 'text-green-500' : 'text-red-600'
                    }`}>
                      • {order.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">Rs. {order.price?.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* 💰 Totals Table */}
            <div className="space-y-2 border-t border-zinc-800 pt-6">
              <div className="flex justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <span>Service Charge (10%)</span>
                <span>Rs. {serviceCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white text-xl font-black uppercase mt-4 border-t border-zinc-800 pt-6 italic tracking-tighter">
                <span className="text-red-600">Total Bill</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={() => router.push(`/menu?table=${tableNumber}`)}
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] py-5 bg-white text-black rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            ← Add More To Order
          </button>
        </div>
      )}
      
      {/* Footer Footer */}
      <div className="text-center mt-20 opacity-20">
         <p className="text-[8px] font-black tracking-[0.5em] uppercase italic text-red-600">Ravello Smart POS v2.0</p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen text-white flex items-center justify-center font-black uppercase tracking-widest text-[10px]">Syncing Ravello Cloud...</div>}>
      <StatusContent />
    </Suspense>
  );
}