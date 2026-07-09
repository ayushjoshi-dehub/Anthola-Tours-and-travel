import { FEATURES } from './data.js';
import { qs } from './ui.js';

export function initFeaturesPage(){
  const grid = qs('#featGrid');
  if (!grid) return;
  grid.innerHTML = FEATURES.map(f => `
    <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition">
      <div class="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
        <i class="fa-solid ${f.icon}"></i>
      </div>
      <h3 class="mt-4 text-xl font-bold text-slate-900">${f.title}</h3>
      <p class="mt-2 text-slate-600">${f.desc}</p>
    </div>
  `).join('');
}
