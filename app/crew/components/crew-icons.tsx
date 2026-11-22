import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Bus } from '@phosphor-icons/react/dist/ssr/Bus';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Camera } from '@phosphor-icons/react/dist/ssr/Camera';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { MapTrifold } from '@phosphor-icons/react/dist/ssr/MapTrifold';
import { Package } from '@phosphor-icons/react/dist/ssr/Package';
import { QrCode } from '@phosphor-icons/react/dist/ssr/QrCode';
import { StopCircle } from '@phosphor-icons/react/dist/ssr/StopCircle';

export type CrewIconProps = PhosphorIconProps & { size?: number };

export function IconArrowLeft({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <ArrowLeft size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconArrowRight({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <ArrowRight size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconCalendar({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <CalendarBlank size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconCamera({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <Camera size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconCheck({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <CheckCircle size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconClipboard({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <ClipboardText size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconClock({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <Clock size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconInfo({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <Info size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconMapPin({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <MapPin size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconMapTrifold({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <MapTrifold size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconPackage({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <Package size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconQrCode({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <QrCode size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconSearch({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <MagnifyingGlass size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconStop({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <StopCircle size={size} weight={weight} aria-hidden="true" {...props} />;
}

export function IconVan({ size = 18, weight = 'regular', ...props }: CrewIconProps) {
  return <Bus size={size} weight={weight} aria-hidden="true" {...props} />;
}
