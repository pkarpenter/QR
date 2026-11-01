import { useState } from 'react'
import { Link2 } from 'lucide-react'
import LinkRow from './LinkRow'
import EditLinkModal from './EditLinkModal'
import ConfirmModal from '../ConfirmModal'
import { activateLink, deleteLink, updateLink } from '../../lib/api'

export default function LinkTable({
  qrId,
  links,
  onRefresh,
  onNotify,
  isMultiLink = false,
  activeMultiLinkIds = [],
  onToggleMultiLink,
}) {
  const [activating, setActivating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState(null)

  async function handleActivate(linkId) {
    setActivating(linkId)
    try {
      await activateLink(qrId, linkId)
      if (onNotify) onNotify('Live from next scan! ✨')
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setActivating(null)
    }
  }

  function handleRequestDelete(linkId) {
    const target = links.find(l => l.id === linkId)
    setLinkToDelete(target || { id: linkId, title: 'this link' })
  }

  async function handleConfirmDelete() {
    if (!linkToDelete) return
    setDeleting(linkToDelete.id)
    try {
      await deleteLink(qrId, linkToDelete.id)
      if (onNotify) onNotify('Link deleted successfully')
      setLinkToDelete(null)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  async function handleSaveEdit(linkId, data) {
    setSavingEdit(true)
    try {
      await updateLink(qrId, linkId, data)
      if (onNotify) onNotify('Link updated successfully!')
      setEditingLink(null)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingEdit(false)
    }
  }

  if (!links?.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Link2 size={36} color="var(--text-muted)" /></div>
        <div className="empty-title">No links yet</div>
        <div className="empty-desc">Add your first destination link to this QR code</div>
      </div>
    )
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 30 }} />
              <th>Title</th>
              <th>Destination URL</th>
              <th>Scans (30d)</th>
              <th>Status</th>
              <th>{isMultiLink ? 'Active (Multi)' : 'Active (Single)'}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, idx) => (
              <LinkRow
                key={link.id}
                index={idx}
                link={link}
                activating={activating}
                deleting={deleting}
                onActivate={handleActivate}
                onEdit={setEditingLink}
                onDelete={handleRequestDelete}
                isMultiLink={isMultiLink}
                isMultiActive={activeMultiLinkIds.includes(link.id)}
                onToggleMultiLink={onToggleMultiLink}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Link Modal */}
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSubmit={handleSaveEdit}
          saving={savingEdit}
        />
      )}

      {/* Custom Centered Delete Confirmation Popup */}
      <ConfirmModal
        isOpen={Boolean(linkToDelete)}
        title="Delete Destination Link?"
        message={`Are you sure you want to remove "${linkToDelete?.title}"? All historical scan data associated with this destination link will be deleted.`}
        confirmText="Yes, Delete Link"
        cancelText="Cancel"
        isDanger={true}
        loading={Boolean(deleting)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLinkToDelete(null)}
      />
    </>
  )
}
