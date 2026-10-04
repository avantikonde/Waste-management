import { Activity, CheckCircle2, Truck, Award, Calendar } from 'lucide-react'
import { getCurrentMonthName } from '../utils/dateUtils'

export function ActivityView() {
  const currentMonth = getCurrentMonthName()

  const events = [
    {
      title: 'Collection vehicle dispatched for Pickup PK-2026-004120',
      time: '10:02 AM today',
      category: 'Pickup',
      icon: <Truck size={14} />,
      desc: 'Driver Ravi K. (MH 12 AB 2840) marked en route from East Depot to Bluebell Heights, Viman Nagar.',
    },
    {
      title: 'Civic Report CW-2026-009102 assigned to PMC Crew #4',
      time: '09:51 AM today',
      category: 'Report',
      icon: <CheckCircle2 size={14} />,
      desc: 'Ward dispatcher assigned rapid clearance squad for FC Road commercial mixed waste accumulation.',
    },
    {
      title: 'Doorstep pickup request PK-2026-004120 verified',
      time: '09:48 AM today',
      category: 'Pickup',
      icon: <Truck size={14} />,
      desc: 'Society segregated waste request confirmed for 08:00 - 10:00 AM slot.',
    },
    {
      title: '+50 Green Points credited to your account',
      time: 'Yesterday at 04:30 PM',
      category: 'Rewards',
      icon: <Award size={14} />,
      desc: 'Debris report in Kothrud was verified and cleared by the PMC Heavy Squad.',
    },
    {
      title: 'Report CW-2026-009071 resolved & cleared',
      time: 'Yesterday at 02:15 PM',
      category: 'Clearance',
      icon: <CheckCircle2 size={14} />,
      desc: 'PMC Heavy Squad cleared 210 kg of construction rubble from residential lane turning.',
    },
    {
      title: `Joined ${currentMonth} Ward Cleanup Walk RSVP`,
      time: 'Earlier this week',
      category: 'Community',
      icon: <Calendar size={14} />,
      desc: 'Reserved volunteer spot for the Riverbank Eco-Walk & Plastic Drive on Saturday.',
    },
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Audit Trail</span>
            <span className="live-indicator">Live Activity Stream</span>
          </div>
          <h1>System Activity Timeline</h1>
          <p className="page-subtitle">
            A transparent record of reports, dispatches, verifications, and reward achievements.
          </p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '800px' }}>
        <div className="panel-header">
          <div className="panel-title-wrap">
            <p>Chronological Stream</p>
            <h2>Recent Events</h2>
          </div>
          <Activity size={18} color="var(--primary)" />
        </div>

        <div className="timeline-stepper" style={{ paddingLeft: '32px' }}>
          {events.map((e, idx) => (
            <div key={idx} className="timeline-step completed">
              <div
                className="step-marker"
                style={{
                  backgroundColor: 'var(--primary-light)',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                }}
              >
                {e.icon}
              </div>
              <div className="step-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <strong>{e.title}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {e.time}
                  </span>
                </div>
                <small style={{ marginTop: '3px' }}>{e.desc}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

