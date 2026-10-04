import { useState } from 'react'
import {
  Award,
  ArrowUpRight,
  Gift,
  Check,
  Sparkles,
} from 'lucide-react'
import type { EcoReward } from '../types'
import { database } from '../database'
import { getCurrentMonthName, getCurrentMonthShort } from '../utils/dateUtils'

interface CommunityViewProps {
  greenPoints: number
  rewards: EcoReward[]
  onOpenRewardsModal: () => void
  onToast: (msg: string) => void
}

interface CleanupDrive {
  id: string
  title: string
  dateDay: string
  dateMonth: string
  time: string
  location: string
  spotsLeft: number
  joined: boolean
}

export function CommunityView({
  greenPoints,
  rewards,
  onOpenRewardsModal,
  onToast,
}: CommunityViewProps) {
  const session = database.getSession()
  const userLoc = database.getLocation()
  const monthShort = getCurrentMonthShort()
  const monthName = getCurrentMonthName()

  const userName = session?.name || 'Citizen Steward'
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CS'

  const [drives, setDrives] = useState<CleanupDrive[]>([
    {
      id: 'CD-01',
      title: `${userLoc.city} Eco-Walk & Plastic Cleanup Drive`,
      dateDay: '08',
      dateMonth: monthShort,
      time: 'Saturday · 08:00 AM',
      location: userLoc.city === 'Pune' ? 'Mutha River Promenade, Deccan' : 'Lakeside Park, Gate 2',
      spotsLeft: 18,
      joined: false,
    },
    {
      id: 'CD-02',
      title: 'Electronic & Battery Safe Drop-Off Fair',
      dateDay: '15',
      dateMonth: monthShort,
      time: 'Friday · 10:00 AM',
      location: userLoc.city === 'Pune' ? 'Viman Nagar Community Center' : 'Community Hall, 12th Main',
      spotsLeft: 34,
      joined: true,
    },
    {
      id: 'CD-03',
      title: 'Neighbourhood Tree Basin Mulching & Bio-Waste',
      dateDay: '22',
      dateMonth: monthShort,
      time: 'Saturday · 07:30 AM',
      location: userLoc.city === 'Pune' ? 'FC Road Pedestrian Plaza, Pune' : 'Main Road Plaza',
      spotsLeft: 12,
      joined: false,
    },
  ])

  const toggleDrive = (id: string) => {
    setDrives((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextJoined = !d.joined
          onToast(nextJoined ? `RSVP confirmed for ${d.title}!` : `RSVP cancelled for ${d.title}`)
          return {
            ...d,
            joined: nextJoined,
            spotsLeft: nextJoined ? d.spotsLeft - 1 : d.spotsLeft + 1,
          }
        }
        return d
      })
    )
  }

  const leaderboard = [
    { rank: '01', name: 'Nisha Ramanathan', pts: '2,840', avatar: 'NR', isUser: false },
    { rank: '02', name: 'Karthik Swaminathan', pts: '2,420', avatar: 'KS', isUser: false },
    { rank: '03', name: 'Pooja Hegde', pts: '1,990', avatar: 'PH', isUser: false },
    { rank: '12', name: `${userName} (You)`, pts: `${greenPoints.toLocaleString()}`, avatar: userInitials, isUser: true },
    { rank: '13', name: 'Manish Sharma', pts: '1,180', avatar: 'MS', isUser: false },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Civic Collaboration & Gamification</span>
            <span className="live-indicator">{userLoc.city} Community Hub</span>
          </div>
          <h1>Community & Green Rewards</h1>
          <p className="page-subtitle">
            Join weekend cleanup drives, climb the sustainability leaderboard, and redeem eco-vouchers.
          </p>
        </div>

        <button className="primary-btn" style={{ width: 'auto' }} onClick={onOpenRewardsModal}>
          <Gift size={16} /> Open Rewards Store
        </button>
      </div>

      {/* Dynamic Month Challenge Banner */}
      <div className="community-hero-banner">
        <div className="community-banner-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', opacity: 0.9 }}>
            <Sparkles size={16} /> {monthName} Ward Mission
          </div>
          <h2>Zero Waste {userLoc.city} {new Date().getFullYear()}</h2>
          <p>
            142 registered residents have diverted 1,280 kg of waste so far this month toward our 2,000 kg neighborhood milestone!
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="outline-btn"
              style={{ background: '#ffffff', color: 'var(--primary)', borderColor: 'transparent' }}
              onClick={onOpenRewardsModal}
            >
              <Award size={15} /> Your Balance: {greenPoints} pts
            </button>
          </div>
        </div>

        <div className="community-circle-stat">
          <strong>64%</strong>
          <span>Milestone</span>
        </div>
      </div>

      {/* Split Grid: Cleanup Drives & Leaderboard */}
      <div className="layout-split">
        {/* Cleanup Drives */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Get Involved</p>
              <h2>Upcoming Neighborhood Drives</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drives.map((drive) => (
              <div
                key={drive.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Date Box */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  <strong style={{ fontSize: '18px', fontWeight: 800 }}>{drive.dateDay}</strong>
                  <span style={{ fontSize: '9px', fontWeight: 700 }}>{drive.dateMonth}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                    {drive.title}
                  </strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 4px' }}>
                    {drive.time} · {drive.location}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                    {drive.spotsLeft} volunteer spots left
                  </span>
                </div>

                <button
                  type="button"
                  className={drive.joined ? 'outline-btn' : 'primary-btn'}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    width: 'auto',
                    backgroundColor: drive.joined ? 'var(--primary-light)' : undefined,
                    color: drive.joined ? 'var(--primary)' : undefined,
                    borderColor: drive.joined ? 'var(--primary-border)' : undefined,
                  }}
                  onClick={() => toggleDrive(drive.id)}
                >
                  {drive.joined ? (
                    <>
                      <Check size={14} /> Attending
                    </>
                  ) : (
                    'RSVP'
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Green Champions Leaderboard */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Top Contributors</p>
              <h2>Ward Green Champions</h2>
            </div>
            <Award size={18} color="var(--primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: user.isUser ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  border: user.isUser ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: user.isUser ? 'var(--primary)' : 'var(--text-muted)',
                    width: '20px',
                  }}
                >
                  {user.rank}
                </span>

                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: user.isUser ? 'var(--primary)' : '#cbd5e1',
                    color: user.isUser ? '#ffffff' : '#334155',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {user.avatar}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                    {user.name}
                  </strong>
                </div>

                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                  {user.pts} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Featured Rewards Row */}
      <section className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <div className="panel-title-wrap">
            <p>Civic Perks</p>
            <h2>Featured Green Rewards</h2>
          </div>
          <button className="panel-link-btn" onClick={onOpenRewardsModal}>
            View all rewards <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="rewards-grid">
          {rewards.slice(0, 2).map((r) => (
            <div key={r.id} className="reward-card">
              <div className="reward-card-top">
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                </div>
                <span className="reward-points-badge">{r.pointsCost} pts</span>
              </div>
              <button
                type="button"
                className="outline-btn"
                style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
                onClick={onOpenRewardsModal}
              >
                Redeem Voucher
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
