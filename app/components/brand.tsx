import Link from 'next/link';
import Image from 'next/image';

export default function Brand({
  compact = false,
  darkAware = false,
  href = '/',
}: {
  compact?: boolean;
  darkAware?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} aria-label="Seatpax" className={`sp-brand${compact ? ' sp-brand-compact' : ''}`}>
      {compact ? (
        <Image src="/brand/seatpax-icon.png" alt="" width={1254} height={1254} />
      ) : darkAware ? (
        <>
          <Image
            src="/brand/seatpax-horizontal.png"
            alt=""
            width={2140}
            height={735}
            className="sp-brand-img-light"
          />
          <Image
            src="/brand/seatpax-horizontal-dark.png"
            alt=""
            width={2140}
            height={735}
            className="sp-brand-img-dark"
          />
        </>
      ) : (
        <Image src="/brand/seatpax-horizontal.png" alt="" width={2140} height={735} />
      )}
    </Link>
  );
}
