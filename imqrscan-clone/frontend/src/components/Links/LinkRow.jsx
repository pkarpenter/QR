import { ExternalLink, Edit2, Trash2 } from 'lucide-react'
import ActivateToggle from './ActivateToggle'

export default function LinkRow({
  index,
  link,
  onActivate,
  onEdit,
  onDelete,
  activating,
  deleting,
  isMultiLink = false,
  isMultiActive = false,
  onToggleMultiLink,
}) {
  const active = isMultiLink ? isMultiActive : link.is_active
  const dotColor = active ? 'var(--accent-green)' : 'var(--text-muted)'

  return (
    <tr>
      <td className="text-muted text-xs font-mono">{index + 1}</td>
      <td>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: active ? '0 0 8px var(--accent-green)' : 'none',
          }}
        />
      </td>
      <td style={{ fontWeight: 600 }}>{link.title}</td>
      <td>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-sm flex items-center gap-1.5"
          style={{ color: 'var(--accent)', textDecoration: 'none', maxWidth: 280 }}
        >
          {link.url}
          <ExternalLink size={12} />
        </a>
      </td>
      <td>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {link.scans_30d ?? 0}
        </span>
      </td>
      <td>
        {active ? (
          <span className="badge badge-active">● Active</span>
        ) : (
          <span className="badge badge-inactive">Inactive</span>
        )}
      </td>
      <td>
        <ActivateToggle
          isActive={active}
          canDeactivate={isMultiLink}
          loading={activating === link.id}
          onToggle={() => {
            if (isMultiLink) {
              if (onToggleMultiLink) onToggleMultiLink(link.id)
            } else {
              if (!link.is_active) onActivate(link.id)
            }
          }}
        />
      </td>
      <td>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1.5"
            onClick={() => onEdit(link)}
            title="Edit link"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm p-1.5"
            disabled={deleting === link.id}
            onClick={() => onDelete(link.id)}
            title="Delete link"
          >
            {deleting === link.id ? <span className="spinner" /> : <Trash2 size={13} />}
          </button>
        </div>
      </td>
    </tr>
  )
}
