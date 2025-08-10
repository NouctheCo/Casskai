import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext'

function setup() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{children}</OnboardingProvider>
  )
  const { result } = renderHook(() => useOnboarding(), { wrapper })
  return result
}

describe('OnboardingContext', () => {
  it('clamp nextStep to 5 and prevStep to 1', () => {
    const res = setup()

    // initial step
    expect(res.current.currentStep).toBe(1)

    // go forward past max
    act(() => {
      for (let i = 0; i < 10; i++) res.current.nextStep()
    })
    expect(res.current.currentStep).toBe(5)

    // go backward past min
    act(() => {
      for (let i = 0; i < 10; i++) res.current.prevStep()
    })
    expect(res.current.currentStep).toBe(1)
  })

  it('goToStep clamps between 1 and 5', () => {
    const res = setup()

    act(() => {
      res.current.goToStep(100)
    })
    expect(res.current.currentStep).toBe(5)

    act(() => {
      res.current.goToStep(-5)
    })
    expect(res.current.currentStep).toBe(1)
  })
})
