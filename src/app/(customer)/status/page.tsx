"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function StatusContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || '1';
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. මුලින්ම පරණ ඩේටා ටික fetch කරගන්නවා
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('table_number', parseInt(tableNumber))
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) setLatestOrder(data[0]);
    };

    fetchStatus();

    // 2. Real-time Channel එක හරියටම සෙට් කරනවා
    // 'realtime:public:orders' කියන format එක පාවිච්චි කිරීම වඩාත් ආරක්ෂිතයි
    const channel = supabase
      .channel(`status-room-${tableNumber}`) 
      .on('postgres_changes', { 
        event: 'UPDATE', // Dashboard එකෙන් status එක update කරන නිසා
        schema: 'public', 
        table: 'orders',
        filter: `table_number=eq.${tableNumber}` 
      }, (payload) => {
        console.log("Real-time Update Received:", payload.new);
        setLatestOrder(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to Realtime!');
        }
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [tableNumber]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      {/* Top Branding */}
      <div className="mb-10">
        <h1 className="text-xl font-black italic text-red-600 tracking-tighter uppercase">Order Tracking</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Table {tableNumber}</p>
      </div>

      {!latestOrder ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Searching for your order...</p>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          {/* Status Icon with Animation */}
          <div className="text-7xl mb-8 drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            {latestOrder.status === 'pending' ? '⏳' : 
             latestOrder.status === 'cooking' ? '👨‍🍳' : '✅'}
          </div>
          
          <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter leading-none">
            {latestOrder.status === 'pending' ? 'RECEIVED' : 
             latestOrder.status === 'cooking' ? 'COOKING' : 'READY!'}
          </h2>
          
          <p className="text-zinc-500 text-[10px] mb-10 uppercase tracking-[0.2em] font-black">
            {latestOrder.service_type}
          </p>

          {/* Dynamic Progress Bar */}
          <div className="relative w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-12">
            <div 
              className={`absolute h-full transition-all duration-1000 ease-out bg-red-600 shadow-[0_0_10px_#dc2626] ${
                latestOrder.status === 'pending' ? 'w-1/3' : 
                latestOrder.status === 'cooking' ? 'w-2/3' : 'w-full'
              }`}
            ></div>
          </div>

          {/* Dynamic Message */}
          <p className="text-zinc-400 text-xs mb-10 italic">
             {latestOrder.status === 'pending' && "We've received your order. Hang tight!"}
             {latestOrder.status === 'cooking' && "Our chef is working its magic..."}
             {latestOrder.status === 'completed' && "Your order is ready to be served. Enjoy!"}
          </p>

          <button 
            onClick={() => router.push(`/menu?table=${tableNumber}`)}
            className="group flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
          </button>
        </div>
      )}
      
      {/* Bottom Footer */}
      <div className="fixed bottom-10 opacity-20">
         <p className="text-[8px] font-black tracking-[0.5em] uppercase">Powered by Ravello Studios</p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen text-white flex items-center justify-center font-black tracking-widest text-[10px] uppercase">Ravello System Initializing...</div>}>
      <StatusContent />
    </Suspense>
  );
}