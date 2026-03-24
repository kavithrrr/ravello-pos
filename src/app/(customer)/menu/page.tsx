"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // 👈 useRouter එක මෙතනට ගත්තා
import { supabase } from '@/lib/supabase';

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); // 👈 Router එක initialize කළා
  const tableNumber = searchParams.get('table') || '1';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*');
      if (data) setItems(data);
      setLoading(false);
    };
    fetchMenu();
  }, []);

  // 🔔 සේවාවන් ලබාගැනීමට (Water, Waiter, Bill)
  const callWaiter = async (type: string) => {
    const { error } = await supabase.from('orders').insert({
      table_number: parseInt(tableNumber),
      is_service_call: true,
      service_type: type,
      status: 'pending'
    });
    if (!error) {
      alert(`🔔 ${type} request sent to the waiter!`);
      // සර්විස් කෝල් එකක් දැම්මත් status බලන්න ඕනේ නම් මේක දාන්න පුළුවන්:
      router.push(`/status?table=${tableNumber}`);
    }
  };

  // 🍔 කෑම බීම ඇනවුම් කිරීමට (Add to Order)
  const addToOrder = async (item: any) => {
    const { error } = await supabase.from('orders').insert({
      table_number: parseInt(tableNumber),
      is_service_call: false,
      service_type: `ORDER: ${item.name}`,
      status: 'pending'
    });

    if (!error) {
      // ✅ මෙන්න මෙතනදී තමයි auto redirect වෙන්නේ
      router.push(`/status?table=${tableNumber}`);
    } else {
      alert("❌ Error sending order. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-red-600">
      {/* Header */}
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex justify-between items-center text-left">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-red-600">
            RAVELLO <span className="text-white">STUDIOS</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            Premium Restaurant System
          </p>
        </div>
        <div className="bg-red-600 px-4 py-1 rounded-full text-xs font-black shadow-lg shadow-red-600/30">
          TABLE {tableNumber}
        </div>
      </header>

      {/* Menu Grid */}
      <main className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-zinc-600 animate-pulse font-bold uppercase tracking-widest text-xs">
            Loading Ravello Menu...
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-zinc-800 hover:border-red-600/40 transition-all duration-500 group">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 text-left" 
              />
              <div className="absolute top-5 right-5 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-2xl text-red-500 font-black border border-white/5 text-sm">
                Rs.{item.price}
              </div>
            </div>
            <div className="p-6 text-left">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold group-hover:text-red-500 transition-colors">{item.name}</h3>
              </div>
              <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed h-8">
                {item.description}
              </p>
              <button 
                onClick={() => addToOrder(item)}
                className="w-full mt-6 bg-white text-black py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl"
              >
                ADD TO ORDER
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Floating Action Bar (Service Buttons) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-white/5 px-10 py-5 rounded-[3rem] flex gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-50">
        <button onClick={() => callWaiter('Water')} className="flex flex-col items-center gap-2 group">
          <span className="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg text-left">💧</span>
          <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest transition-colors">Water</span>
        </button>
        <button onClick={() => callWaiter('Waiter')} className="flex flex-col items-center gap-2 group">
          <span className="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">🔔</span>
          <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest transition-colors">Waiter</span>
        </button>
        <button onClick={() => callWaiter('Bill')} className="flex flex-col items-center gap-2 group">
          <span className="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">💵</span>
          <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-widest transition-colors">Bill</span>
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen text-white flex items-center justify-center font-black tracking-widest uppercase text-xs">Initializing Ravello System...</div>}>
      <MenuContent />
    </Suspense>
  );
}