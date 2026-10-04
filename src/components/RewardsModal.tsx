import { X, Award, Check, Sparkles, Tag } from 'lucide-react'
import type { EcoReward } from '../types'
import { database } from '../database'

interface RewardsModalProps {
  greenPoints: number
  rewards: EcoReward[]
  onClose: () => void
  onRedeem: (rewardId: string) => void
}

export function RewardsModal({
  greenPoints,
  rewards,
  onClose,
  onRedeem,
}: RewardsModalProps) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: '640px' }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>
              <Sparkles size={16} />
              <span>Civic Green Rewards Store</span>
            </div>
            <h2>Redeem Your Green Points</h2>
            <p>Exchange points earned from responsible reporting and segregation for real benefits.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.2) 100%)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
              Available Balance
            </span>
            <strong style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={22} color="var(--primary)" /> {greenPoints.toLocaleString()} Points
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>
              Level 4 Civic Steward
            </span>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
              Top 12% in {database.getLocation().area || database.getLocation().city || 'Pune'}
            </span>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="rewards-grid" style={{ maxHeight: '420px', overflowY: 'auto', padding: '2px' }}>
          {rewards.map((reward) => {
            const canAfford = greenPoints >= reward.pointsCost
            return (
              <div key={reward.id} className="reward-card">
                <div className="reward-card-top">
                  <div>
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                  </div>
                  <span className="reward-points-badge">{reward.pointsCost} pts</span>
                </div>

                {reward.claimed && reward.code ? (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--primary-light)',
                      border: '1px solid var(--primary-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={13} /> Code: {reward.code}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <Check size={12} /> Claimed
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={!canAfford}
                    onClick={() => onRedeem(reward.id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      opacity: canAfford ? 1 : 0.5,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      background: canAfford ? undefined : 'var(--border)',
                      color: canAfford ? undefined : 'var(--text-muted)',
                      boxShadow: canAfford ? undefined : 'none',
                    }}
                  >
                    {canAfford ? 'Redeem Voucher' : `Need ${reward.pointsCost - greenPoints} more pts`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

