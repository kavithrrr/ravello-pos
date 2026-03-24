"use client";
import { QRCodeSVG } from 'qrcode.react';

export default function QRGenerator() {
  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // මෙතනට ඕන කරන ටේබල් ගණන දාන්න
  const baseUrl = "http://localhost:3000/menu"; // පස්සේ මේක domain එකට වෙනස් කරන්න

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans">
      <h1 className="text-2xl font-black italic text-red-600 mb-10 border-l-4 border-red-600 pl-4">
        RAVELLO <span className="text-white font-light">QR GENERATOR</span>
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {tables.map((num) => (
          <div key={num} className="bg-white p-6 rounded-3xl flex flex-col items-center shadow-2xl border-b-8 border-red-600">
            <QRCodeSVG value={`${baseUrl}?table=${num}`} size={150} />
            <div className="mt-4 text-center">
              <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">Ravello Studios</p>
              <h2 className="text-3xl font-black text-black italic leading-none">TABLE {num}</h2>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => window.print()} className="fixed bottom-10 right-10 bg-red-600 px-8 py-3 rounded-full font-bold">PRINT ALL LABELS 🖨️</button>
    </div>
  );
}