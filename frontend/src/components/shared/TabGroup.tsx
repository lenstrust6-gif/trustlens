'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabGroupProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export default function TabGroup({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabGroupProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollBehavior: 'smooth',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            border:
              activeTab === tab.id
                ? '1px solid rgba(37, 99, 235, 0.60)'
                : '1px solid var(--border)',
            background:
              activeTab === tab.id
                ? 'rgba(37, 99, 235, 0.22)'
                : 'transparent',
            color:
              activeTab === tab.id
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            whiteSpace: 'nowrap',
          }}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
