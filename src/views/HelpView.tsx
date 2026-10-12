import { useState } from 'react'
import {
  CircleHelp,
  ChevronDown,
  PhoneCall,
  Mail,
  AlertTriangle,
  Phone,
  Send,
  X,
  Building2,
} from 'lucide-react'
import { database } from '../database'

interface HelpViewProps {
  onToast: (msg: string) => void
}

interface HelplineItem {
  number: string
  label: string
  subtitle: string
  badge: string
  badgeColor: 'rose' | 'amber' | 'primary' | 'sky'
  dialNumber: string
}

export function HelpView({ onToast }: HelpViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  // Support ticket form state
  const session = database.getSession()
  const loc = database.getLocation()
  const [ticketWard, setTicketWard] = useState(session?.ward || `${loc.area || 'Shivajinagar'}, ${loc.city || 'Pune'}`)
  const [ticketCategory, setTicketCategory] = useState('Doorstep Collection Delay')
  const [ticketPhone, setTicketPhone] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  const nationalHelplines: HelplineItem[] = [
    {
      number: '1969',
      dialNumber: '1969',
      label: 'Swachh Bharat National Helpline',
      subtitle: 'Ministry of Housing & Urban Affairs (MoHUA) nationwide sanitation & garbage grievance line',
      badge: 'Toll-Free (All India)',
      badgeColor: 'primary',
    },
    {
      number: '1533',
      dialNumber: '1533',
      label: 'Central Civic & SWM Control Room',
      subtitle: 'Universal municipal helpline for solid waste management, bin overflows, and street sweeping',
      badge: 'Toll-Free 24x7',
      badgeColor: 'sky',
    },
    {
      number: '112',
      dialNumber: '112',
      label: 'National Emergency Response (NERSS)',
      subtitle: 'Urgent chemical spills, industrial hazardous waste, drain gas leaks, or fire hazard incidents',
      badge: 'Emergency 24x7',
      badgeColor: 'rose',
    },
  ]

  const municipalHelplines: HelplineItem[] = [
    {
      number: '1800 1030 222',
      dialNumber: '18001030222',
      label: 'PMC Pune Municipal Corporation',
      subtitle: 'Pune Solid Waste Management & Doorstep Collection Grievance Line',
      badge: 'PMC Toll-Free',
      badgeColor: 'primary',
    },
    {
      number: '020-25501000',
      dialNumber: '02025501000',
      label: 'PMC Central Disaster & Waste Control',
      subtitle: 'Direct landline to PMC Shivajinagar headquarters control room',
      badge: 'Direct Line',
      badgeColor: 'amber',
    },
    {
      number: '1916',
      dialNumber: '1916',
      label: 'BMC Mumbai (MCGM)',
      subtitle: '24x7 Greater Mumbai Solid Waste Management & Disaster Control Helpline',
      badge: 'BMC 24x7',
      badgeColor: 'sky',
    },
    {
      number: '155304',
      dialNumber: '155304',
      label: 'MCD Delhi Sanitation Helpline',
      subtitle: 'Municipal Corporation of Delhi solid waste and garbage complaint cell',
      badge: 'MCD Toll-Free',
      badgeColor: 'amber',
    },
    {
      number: '080-22660000',
      dialNumber: '08022660000',
      label: 'BBMP Bengaluru Control Room',
      subtitle: 'Bruhat Bengaluru Mahanagara Palike Central Civic Complaint Cell',
      badge: 'BBMP Control',
      badgeColor: 'sky',
    },
  ]

  const faqs = [
    {
      q: 'What happens immediately after I submit a waste report?',
      a: 'Your report is instantly logged with live GPS coordinates into your municipal ward dispatch system. A ward inspector verifies the category and severity within 15–30 minutes, after which the nearest available collection crew is routed to the spot. You receive live status notifications and earn +50 Green Points once cleared.',
    },
    {
      q: 'How does doorstep bulk and society waste pickup work?',
      a: 'Use the "Book Doorstep Pickup" option to select your waste category (household, bulk mattress/furniture, e-waste, or society bins) and preferred date/time slot. You can see available drivers who pre-declared free hours for that slot and contact them directly. A designated collection truck is allocated and you can track the truck live on the map.',
    },
    {
      q: 'How is a driver assigned to my doorstep pickup or report?',
      a: 'Drivers are dispatched based on three primary factors: (1) Pre-scheduled availability slots declared by the driver for your date and time window, (2) Real-time GPS proximity using Haversine calculation to route the closest available truck, and (3) Vehicle category & load capacity matching (e.g. compactor for bulk society waste, e-cart for narrow lanes).',
    },
    {
      q: 'What items are classified as Hazardous or E-Waste?',
      a: 'Batteries, fluorescent tubes, chemicals, medical waste, paint cans, and broken electronic monitors must never be mixed with organic or dry waste. Choose "Hazardous" or "Electronic / E-waste" when reporting, which routes specialized handling squads with safety gear.',
    },
    {
      q: 'How do I redeem my Green Points for real perks?',
      a: 'Green Points are earned for reporting waste, attending cleanup drives, and segregating waste. Head to "Community & Rewards" to redeem vouchers for City Metro & transit passes, home composting kits, or municipal property tax rebate tokens.',
    },
  ]

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ticketId = `TKT-${Date.now().toString().slice(-5)}`

    database.addNotification({
      id: `NOTIF-${Date.now()}`,
      title: `📩 Ward Support Ticket Created (#${ticketId})`,
      message: `Your grievance regarding "${ticketCategory}" in ${ticketWard} has been forwarded to the Ward Officer. You will receive a call at ${ticketPhone || 'your registered number'}.`,
      time: 'Just now',
      read: false,
      type: 'system',
    })

    onToast(`✅ Support ticket #${ticketId} created! Ward Officer assigned for callback.`)
    setIsSupportModalOpen(false)
    setTicketSubject('')
    setTicketMessage('')
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>Support & Documentation</span>
            <span className="live-indicator">24/7 Civic Help</span>
          </div>
          <h1>Help & Resource Center</h1>
          <p className="page-subtitle">
            Find instant answers to common waste management questions or call verified national & municipal helplines.
          </p>
        </div>
      </div>

      <div className="layout-split">
        {/* FAQs */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <p>Knowledge Base</p>
              <h2>Frequently Asked Questions</h2>
            </div>
            <CircleHelp size={18} color="var(--primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((item, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: isOpen ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                    overflow: 'hidden',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: 'var(--text-primary)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 16px 14px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Helplines and Ward Support Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Verified National Toll-Free Hotlines */}
          <section className="panel" style={{ borderLeft: '4px solid var(--rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <AlertTriangle size={16} /> Verified Civic & Emergency Helplines
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              National Toll-Free Hotlines
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Tap any verified hotline below to connect instantly from your phone or desktop:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {nationalHelplines.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.dialNumber}`}
                  onClick={() => onToast(`Initiating call to ${h.label} (${h.number})...`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: h.badgeColor === 'rose' ? 'var(--rose-light)' : 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PhoneCall size={14} color={h.badgeColor === 'rose' ? 'var(--rose)' : 'var(--primary)'} />
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {h.label}
                      </strong>
                    </div>
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {h.subtitle}
                    </small>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: h.badgeColor === 'rose' ? 'var(--rose)' : 'var(--primary)',
                      }}
                    >
                      {h.number}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {h.badge}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Municipal Corporation Control Rooms (City Wise) */}
          <section className="panel" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Building2 size={16} /> Municipal Corporation Helplines
            </div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              City Municipal Control Rooms
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Direct numbers for municipal solid waste departments across major cities:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {municipalHelplines.map((m) => (
                <a
                  key={m.number}
                  href={`tel:${m.dialNumber}`}
                  onClick={() => onToast(`Initiating call to ${m.label} (${m.number})...`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                    gap: '10px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'block' }}>
                      {m.label}
                    </strong>
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {m.subtitle}
                    </small>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)', display: 'block' }}>
                      {m.number}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {m.badge}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Contact Support Form Box */}
          <section className="panel">
            <div className="panel-title-wrap" style={{ marginBottom: '12px' }}>
              <p>Direct Citizen Grievance</p>
              <h2>Contact Ward Support</h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Have feedback on collection timing, driver conduct, or skipped bins? Submit a direct ticket to your Ward Health Inspector.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <Mail size={15} /> Raise Ticket / Message Ward Officer
            </button>
          </section>
        </div>
      </div>

      {/* Support Ticket Modal */}
      {isSupportModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsSupportModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            <div className="modal-header">
              <div>
                <h2 id="support-modal-title">Message Ward Health Officer</h2>
                <p>Direct municipal grievance escalations receive official tracking and an SLA callback within 2 hours.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsSupportModalOpen(false)} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="form-stack">
              <label className="form-label">
                <span>Administrative Ward</span>
                <input
                  type="text"
                  className="form-input"
                  value={ticketWard}
                  onChange={(e) => setTicketWard(e.target.value)}
                  placeholder="e.g. Shivajinagar - Ghole Rd (PMC Ward 1)"
                  required
                />
              </label>

              <label className="form-label">
                <span>Issue Category</span>
                <select
                  className="form-select"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  required
                >
                  <option>Doorstep Collection Delay</option>
                  <option>Overflowing Public Bin / Spot Dumping</option>
                  <option>Collection Crew / Driver Conduct</option>
                  <option>Hazardous / Medical Waste Urgent Clearance</option>
                  <option>Segregated Waste Vehicle Not Arriving</option>
                  <option>Other Civic Waste Grievance</option>
                </select>
              </label>

              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} color="var(--primary)" /> Callback Phone Number
                </span>
                <input
                  type="tel"
                  className="form-input"
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  pattern="[0-9+() -]{7,}"
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  The Ward Health Officer will call this number directly regarding your grievance.
                </small>
              </label>

              <label className="form-label">
                <span>Subject / Summary</span>
                <input
                  type="text"
                  className="form-input"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Morning pickup truck skipped 4th lane"
                  required
                />
              </label>

              <label className="form-label">
                <span>Detailed Description</span>
                <textarea
                  className="form-textarea"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Provide landmark details, society name, or timing..."
                  rows={3}
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ flex: 1 }}
                  onClick={() => setIsSupportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ flex: 1.5 }}
                >
                  <Send size={15} /> Submit Grievance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
