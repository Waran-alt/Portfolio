/**
 * Landing Page
 *
 * Minimal entry page linking to demos.
 */

import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700" data-testid="landing-root">
      <div className="relative" style={{ perspective: '800px' }} data-testid="cube-wrapper">
        <div className={styles['cube']} data-testid="cube">
          <div className={`${styles['cubeFace']} ${styles['cubeFront']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeBack']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeRight']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeLeft']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeTop']}`} />
          <div className={`${styles['cubeFace']} ${styles['cubeBottom']}`} />
        </div>
      </div>
    </main>
  );
}