import './Breadcrumb.css';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path ? path.split('/').filter(Boolean) : [];

  const buildPath = (index: number): string => {
    return parts.slice(0, index + 1).join('/');
  };

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <button
        className="breadcrumb-item"
        onClick={() => onNavigate('')}
        aria-label="Home"
      >
        Home
      </button>

      {parts.map((part, index) => (
        <span key={index}>
          <span className="breadcrumb-separator">/</span>
          <button
            className="breadcrumb-item"
            onClick={() => onNavigate(buildPath(index))}
          >
            {part}
          </button>
        </span>
      ))}
    </nav>
  );
}
