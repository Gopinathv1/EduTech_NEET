import BrandLogo from './Logo';

export default function VVOverseasLogo({ className = '', label }: { className?: string; label: string }) {
  return <BrandLogo className={className} label={label} />;
}
