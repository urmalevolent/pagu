import { Mail, Phone } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="w-full px-4 md:px-8 py-4 bg-white border-t border-slate-200 shrink-0">
      <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2">
        <p>&copy; 2026 SATE - Kantor Camat Kuta Selatan.</p>
        <div className="flex items-center gap-6">
          <div className="relative group flex items-center justify-center cursor-help">
            <img
              src="/images/assets/customer-support.png"
              alt="Bantuan"
              className="w-7 h-7 hover:scale-110 transition-transform duration-300"
            />

            {/* Hover Popup Modal */}
            <div className="absolute bottom-full right-0 mb-3 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
              <div className="flex flex-col gap-2 text-left">
                <h4 className="font-bold text-slate-800 text-sm">Butuh Bantuan?</h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Jika Anda mengalami kendala teknis atau pertanyaan seputar penggunaan sistem SATE, silakan hubungi administrator atau tim dukungan teknis kami.
                </p>
                <div className="mt-3 flex flex-col gap-2 text-xs font-medium text-slate-700">
                  <a href="mailto:gededaniel14@gmail.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="text-blue-600 hover:underline">gededaniel14@gmail.com</span>
                  </a>
                  <a href="https://wa.me/6281339172556" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="text-blue-600 hover:underline">+62 813-3917-2556 (Daniel Widhi)</span>
                  </a>
                </div>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-2 right-2.5 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
            </div>
          </div>
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Versi 1.0.0</span>


        </div>
      </div>
    </footer>
  );
}
