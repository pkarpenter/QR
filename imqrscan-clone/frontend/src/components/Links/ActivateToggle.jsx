export default function ActivateToggle({ isActive, loading, onToggle, canDeactivate = false }) {
  return (
    <div className="toggle-wrap">
      {loading ? (
        <span className="spinner" />
      ) : (
        <button
          type="button"
          className={`toggle ${isActive ? 'on' : ''}`}
          onClick={onToggle}
          disabled={!canDeactivate && isActive}
          title={
            canDeactivate
              ? (isActive ? 'Click to deactivate link' : 'Click to activate link')
              : (isActive ? 'Currently active (cannot deactivate directly — activate another)' : 'Click to activate this link')
          }
        />
      )}
    </div>
  )
}
