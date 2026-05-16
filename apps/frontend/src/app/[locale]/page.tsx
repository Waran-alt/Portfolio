import { BusinessCardHero } from './components/BusinessCardHero';

export default function HomePage() {
  /* Scroll lock + full-viewport flex: `global.css` `body:has(main[data-portfolio-home])` (no useEffect race). */
  return <BusinessCardHero />;
}
