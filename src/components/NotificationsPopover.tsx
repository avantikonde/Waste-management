import { CheckCheck, Clock, X } from 'lucide-react'
import type { NotificationItem } from '../types'

interface NotificationsPopoverProps {
  notifications: NotificationItem[]
  onClose: () => void
  onMarkAllRead: () => void
  onItemClick: (item: NotificationItem) => void
}

export function NotificationsPopover({
  notifications,
  onClose,
  onMarkAllRead,
  onItemClick,
}: NotificationsPopoverProps) {
  return (
    <div className="notifications-popover" role="dialog" aria-label="Notifications">
      <div className="notif-header">
        <h3>Notifications</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {notifications.some((n) => !n.read) && (
            <button className="notif-mark-all" onClick={onMarkAllRead}>
              <CheckCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Mark all read
            </button>
          )}
          <button className="modal-close-btn" onClick={onClose} aria-label="Close notifications">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`notif-item ${item.read ? '' : 'unread'}`}
              onClick={() => onItemClick(item)}
            >
              {!item.read && <span className="notif-dot" />}
              <div className="notif-content">
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {item.time}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

