'use client';

import Link from 'next/link';
import {useState} from 'react';
import {ArrowsLeftRight, CalendarBlank, MagnifyingGlass, MapPin, X} from '@phosphor-icons/react';
import AdminSelect, {type AdminSelectOption} from '@/app/admin/components/admin-select';
import type {LocationPoint} from '@/modules/inventory/types';

export default function SearchForm({
  locations,
  initial,
}: {
  locations: LocationPoint[];
  initial: {from?: string; to?: string; date?: string; hasExplicitDate?: boolean};
}) {
  const [from, setFrom] = useState(initial.from ?? '');
  const [to, setTo] = useState(initial.to ?? '');
  const [date, setDate] = useState(initial.hasExplicitDate ? (initial.date ?? '') : '');
  const [pending, setPending] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [error, setError] = useState('');
  const hasFilters = Boolean(from || to || date);

  const locationOptions: AdminSelectOption[] = locations.map(location => ({
    value: location.id,
    label: location.name,
    description: location.address ? `${location.city}, ${location.address}` : location.city,
  }));

  const fromOptions: AdminSelectOption[] = [
    {value: '', label: 'Semua asal', description: 'Tampilkan semua titik jemput'},
    ...locationOptions,
  ];

  const toOptions: AdminSelectOption[] = [
    {value: '', label: 'Semua tujuan', description: 'Tampilkan semua titik turun'},
    ...locationOptions,
  ];

  const selectedFrom = locations.find(location => location.id === from);
  const selectedTo = locations.find(location => location.id === to);

  return (
    <section className="tp-search-section" aria-label="Pencarian jadwal perjalanan">
      <form
        className="tp-search-bar"
        action="/trips"
        onSubmit={event => {
          if ((from && !to) || (!from && to)) {
            event.preventDefault();
            setError('Pilih asal dan tujuan sekaligus, atau kosongkan keduanya untuk melihat semua rute.');
            setPending(false);
            return;
          }
          if (from && from === to) {
            event.preventDefault();
            setError('Titik asal dan tujuan tidak boleh sama.');
            setPending(false);
            return;
          }
          setError('');
          setPending(true);
        }}
      >
        <div className="tp-field">
          <label className="tp-field-label" htmlFor="trips-from">
            <MapPin size={15} aria-hidden="true" />
            Dari mana?
          </label>
          <AdminSelect
            id="trips-from"
            name="from"
            ariaLabel="Dari mana?"
            value={from}
            onChange={next => {
              setFrom(next);
              setError('');
            }}
            options={fromOptions}
          />
          {selectedFrom && <span className="tp-field-city">{selectedFrom.city}</span>}
        </div>

        <button
          className={`tp-swap${swapped ? ' is-rotated' : ''}`}
          type="button"
          aria-label="Tukar asal dan tujuan"
          onClick={() => {
            setFrom(to);
            setTo(from);
            setSwapped(current => !current);
            setError('');
          }}
        >
          <ArrowsLeftRight size={17} aria-hidden="true" />
        </button>

        <div className="tp-field">
          <label className="tp-field-label" htmlFor="trips-to">
            <MapPin size={15} aria-hidden="true" />
            Mau ke mana?
          </label>
          <AdminSelect
            id="trips-to"
            name="to"
            ariaLabel="Mau ke mana?"
            value={to}
            onChange={next => {
              setTo(next);
              setError('');
            }}
            options={toOptions}
          />
          {selectedTo && <span className="tp-field-city">{selectedTo.city}</span>}
        </div>

        <label className="tp-field tp-field-date">
          <span>
            <CalendarBlank size={15} aria-hidden="true" />
            Tanggal (opsional)
          </span>
          <input
            name="date"
            type="date"
            value={date}
            onChange={event => {
              setDate(event.target.value);
              setError('');
            }}
          />
        </label>

        <button className="tp-cta-accent tp-search-submit" type="submit" disabled={pending}>
          <MagnifyingGlass size={18} aria-hidden="true" />
          {pending ? 'Mencari…' : 'Cari jadwal'}
        </button>
      </form>

      {hasFilters && (
        <div className="tp-search-reset-row">
          <Link className="tp-reset-link" href="/trips">
            <X size={14} aria-hidden="true" />
            Reset pencarian
          </Link>
        </div>
      )}

      {error && (
        <p className="tp-search-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
