import { useState } from 'react'
import {
  CircleHelp,
  ChevronDown,
  PhoneCall,
  Mail,
  AlertTriangle,
} from 'lucide-react'

interface HelpViewProps {
  onToast: (msg: string) => void
}

export function HelpView({ onToast }: HelpViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'What happens immediately after I submit a waste report?',
      a: 'Your report is instantly logged with GPS coordinates into your municipal ward dispatch system. A ward inspector verifies the category and severity within 15–30 minutes, after which the nearest available collection crew is routed to the spot. You receive live status notifications and earn +50 Green Points once cleared.',
    },
    {
      q: 'How does doorstep bulk and society waste pickup work?',
      a: 'Use the "Book Doorstep Pickup" option to select your waste category (household, bulk mattress/furniture, e-waste, or society bins) and preferred date/time slot. A designated collection truck is allocated and you can track the truck live on the map with real-time ETA.',
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
            Find instant answers to common waste management questions or contact our dispatch team.
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
                    }}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        color: 'var(--text-muted)',
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

        {/* Emergency Civic Hotline & Direct Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Emergency Hotline */}
          <section className="panel" style={{ borderLeft: '4px solid var(--rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <AlertTriangle size={16} /> Urgent Waste Hazard
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Emergency Civic Hotline
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              For severe chemical spills, biohazards, or major drain blockages posing immediate public health risks:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--rose-light)',
                  color: 'var(--rose)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <PhoneCall size={16} /> Central Control: 1533 (Toll Free)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                }}
              >
                <PhoneCall size={15} color="var(--primary)" /> BBMP Control Room: 080-22660000
              </div>
            </div>
          </section>

          {/* Contact Support Form Box */}
          <section className="panel">
            <div className="panel-title-wrap" style={{ marginBottom: '12px' }}>
              <p>Direct Message</p>
              <h2>Contact Ward Support</h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Have feedback on collection timing or staff conduct? Our community managers respond within 2 hours.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                onToast('Support message logged. Ticket #SUP-4821 created!')
              }}
            >
              <Mail size={15} /> Message Ward Officer
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
