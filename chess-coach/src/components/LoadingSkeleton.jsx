export default function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-badge"></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-label"></div>
        <div className="skeleton-line skeleton-full"></div>
        <div className="skeleton-line skeleton-three-quarter"></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-label"></div>
        <div className="skeleton-line skeleton-full"></div>
        <div className="skeleton-line skeleton-half"></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-label"></div>
        <div className="skeleton-line skeleton-full"></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-label"></div>
        <div className="skeleton-chips">
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
        </div>
      </div>
    </div>
  );
}
