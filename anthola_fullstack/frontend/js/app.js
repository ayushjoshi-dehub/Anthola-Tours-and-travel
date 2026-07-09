import { renderNav, renderFooter, renderAuthModal } from './components.js';
import { initAuthModal } from './auth.js';
import { initThreeHero } from './three-hero.js';
import { initDestinationsPage } from './destinations.js';
import { initBookingPage } from './booking.js';
import { initContactPage } from './contact.js';
import { initFeaturesPage } from './features.js';
import { initOwnerPage } from './owner.js';
import { initMyPage } from './my.js';
import { initAuthPage } from './auth-page.js';

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'home';

  renderAuthModal();
  initAuthModal();
  renderNav(page);
  renderFooter();

  // Page-specific
  if (page === 'home') initThreeHero();
  if (page === 'destinations') initDestinationsPage();
  if (page === 'book') initBookingPage();
  if (page === 'contact') initContactPage();
  if (page === 'features') initFeaturesPage();
  if (page === 'owner') initOwnerPage();
  if (page === 'my') initMyPage();
  if (page === 'auth') initAuthPage();
});
