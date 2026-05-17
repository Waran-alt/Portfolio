'use client';

import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

const QR_MODULE_COLOR = '#0f172a';

type ContactQrCodeProps = {
  url: string;
  className?: string;
};

/**
 * Renders a scannable QR with round modules (not square pixels) for the contact face.
 * Size follows the host box via `ResizeObserver`.
 */
export function ContactQrCode({ url, className }: ContactQrCodeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = Math.max(8, Math.round(host.getBoundingClientRect().width));

    const qr = new QRCodeStyling({
      width,
      height: width,
      type: 'svg',
      data: url,
      margin: 0,
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
      dotsOptions: {
        type: 'dots',
        color: QR_MODULE_COLOR,
      },
      backgroundOptions: {
        color: 'transparent',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: QR_MODULE_COLOR,
      },
      cornersDotOptions: {
        type: 'dot',
        color: QR_MODULE_COLOR,
      },
    });

    qrRef.current = qr;
    host.replaceChildren();
    qr.append(host);

    return () => {
      qrRef.current = null;
      host.replaceChildren();
    };
  }, [url]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      const qr = qrRef.current;
      if (!qr) return;
      const side = Math.max(8, Math.round(host.getBoundingClientRect().width));
      qr.update({ width: side, height: side });
    });

    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return <div ref={hostRef} className={className} aria-hidden />;
}
