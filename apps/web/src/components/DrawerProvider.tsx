'use client'
import React, { createContext, useContext, useState } from 'react'

export interface DrawerCtx { tutorId: string | null; openDrawer: (id: string) => void; closeDrawer: () => void }
const Ctx = createContext<DrawerCtx>({ tutorId: null, openDrawer: () => {}, closeDrawer: () => {} })
export const useDrawerCtx = () => useContext(Ctx)

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [tutorId, setTutorId] = useState<string | null>(null)
  return (
    <Ctx.Provider value={{ tutorId, openDrawer: setTutorId, closeDrawer: () => setTutorId(null) }}>
      {children}
    </Ctx.Provider>
  )
}
