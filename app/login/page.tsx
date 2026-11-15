import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Clock, Compass, ShieldCheck, Ticket } from '@phosphor-icons/react/ssr';
import Brand from '../components/brand';
import DevLoginForm from './dev-login-form';
import LoginForm from './login-form';
import { quickLoginAccounts, quickLoginEnabled } from '@/modules/auth/dev-login-policy';
import { getVerifiedUser } from '@/modules/auth/identity';
import { validatedReturnPath } from '@/modules/auth/return-path';
import { resolveEntryDestination } from '@/modules/auth/entry-destination';
import './login.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Masuk | Seatpax',
  description: 'Masuk ke akun Seatpax dengan kode verifikasi email untuk memesan kursi dan membuka tiket shuttle Anda.',
};

function LoginLayout({
  children,
  backHref,
  backLabel,
}: {
  children: React.ReactNode;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="lg-page">
      <a className="lg-skip" href="#login-content">
        Langsung ke konten
      </a>

      <aside className="lg-aside" aria-label="Informasi perjalanan Seatpax">
        <div className="lg-visual">
          <Image
            src="/landing/morning-road.jpg"
            alt="Jalan perjalanan shuttle antarkota di pagi hari"
            fill
            sizes="(min-width: 960px) 48vw, 0px"
            priority
          />
          <div className="lg-visual-top">
            <div className="lg-brand-pill">
              <Brand href="/" />
            </div>
            <span className="lg-visual-tag">
              <Compass size={14} weight="bold" aria-hidden="true" />
              Shuttle Antarkota
            </span>
          </div>

          <div className="lg-visual-copy">
            <p className="lg-visual-eyebrow">Satu akun terhubung</p>
            <h2>Dari cari jadwal sampai naik shuttle, semua rapi di satu tempat.</h2>
            <p>
              Masuk dengan kode email untuk memilih kursi, menyelesaikan pembayaran, dan membuka tiket QR perjalanan Anda.
            </p>
            <ul className="lg-highlights">
              <li>
                <ShieldCheck size={18} weight="regular" aria-hidden="true" />
                <span>Masuk aman dengan kode 8 digit via email, tanpa kata sandi.</span>
              </li>
              <li>
                <Ticket size={18} weight="regular" aria-hidden="true" />
                <span>Tiket digital dan QR langsung tersimpan di Pesanan saya.</span>
              </li>
              <li>
                <Clock size={18} weight="regular" aria-hidden="true" />
                <span>Pantau detail titik naik, jam berangkat, dan status kursi.</span>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="lg-main">
        <header className="lg-topbar">
          <div className="lg-mobile-brand">
            <Brand href="/" />
          </div>
          <Link className="lg-back-link" href={backHref}>
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </header>

        <main id="login-content" className="lg-form-wrap">
          {children}
        </main>

        <footer className="lg-footer">
          <span>Seatpax · Shuttle Antarkota</span>
          <Link href="/pengaduan">Butuh bantuan pengaduan?</Link>
        </footer>
      </div>
    </div>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = validatedReturnPath((await searchParams).next) ?? undefined;
  const request = await headers();
  const backHref = '/';
  const backLabel = 'Kembali ke beranda';

  if (quickLoginEnabled(process.env, request.get('host') ?? '')) {
    return (
      <LoginLayout backHref={backHref} backLabel={backLabel}>
        <section className="lg-card" aria-labelledby="login-title">
          <p className="lg-step-pill lg-step-pill--dev">Mode Development · Testing Lokal</p>
          <h1 id="login-title">Pilih akun testing</h1>
          <p className="lg-intro">Langsung masuk sesuai peran untuk mencoba alur aplikasi tanpa menunggu kode email.</p>
          <DevLoginForm accounts={quickLoginAccounts} next={next} />
          <p className="lg-note">
            <ShieldCheck size={18} weight="regular" aria-hidden="true" />
            <span>Hanya aktif di localhost development. Akses setiap akun tetap mengikuti role yang terdaftar.</span>
          </p>
        </section>
      </LoginLayout>
    );
  }

  const user = await getVerifiedUser();
  if (user) {
    let destination: string;
    try {
      destination = await resolveEntryDestination(user.id, next);
    } catch {
      return (
        <LoginLayout backHref={backHref} backLabel={backLabel}>
          <section className="lg-error-card" role="alert">
            <h1>Halaman tujuan belum dapat dimuat</h1>
            <p>Koneksi akun sedang bermasalah. Silakan coba muat ulang halaman ini sebentar lagi.</p>
            <Link href="/login">Coba lagi</Link>
          </section>
        </LoginLayout>
      );
    }
    redirect(destination);
  }

  return (
    <LoginLayout backHref={backHref} backLabel={backLabel}>
      <section className="lg-card" aria-labelledby="login-title">
        <LoginForm next={next} />
        <p className="lg-note">
          <ShieldCheck size={18} weight="regular" aria-hidden="true" />
          <span>Jangan bagikan kode verifikasi masuk kepada siapa pun, termasuk pihak yang mengaku staf.</span>
        </p>
      </section>
    </LoginLayout>
  );
}
