'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Mail, Lock, User, Phone, Bike, Loader2 } from 'lucide-react'
import PasswordField from '@/components/PasswordField'
import Select from '@/components/ui/select'
import { createPrototypeBankingDetails } from '@/lib/prototype-banking'
import { useAuthStore } from '@/stores/auth-store'

const VEHICLE_TYPES = [
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'bicycle', label: 'Bicycle' },
]

export default function RiderRegisterClient() {
  const router = useRouter()
  const { isAuthenticated, registerRider, checkAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [vehicleType, setVehicleType] = useState('motorbike')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) router.push('/rider/dashboard')
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await registerRider({
        name, email, password,
        password_confirmation: passwordConfirmation,
        phone: phone || undefined,
        vehicle_type: vehicleType,
        // Prototype: banking details are no longer collected from riders.
        // A clearly-labelled dummy record is fabricated here (seeded by email
        // so it is stable per rider) and the backend stores it like before —
        // the API contract and the mobile flow are untouched.
        banking_details: createPrototypeBankingDetails(email),
      })
    } catch (err: any) {
      if (err.message && typeof err.message === 'object') {
        setErrors(err.message)
      } else {
        setError(err.message || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="max-w-lg mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2 text-center">Become a Rider</h1>
          <p className="text-gray-500 text-center mb-8">Register to deliver groceries with Checkstar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">
                {error}
              </motion.div>
            )}

            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Personal Details</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="rr-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Jane Rider" />
                  </div>
                  {errors.name?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
                </div>

                <div>
                  <label htmlFor="rr-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="rider@example.com" />
                  </div>
                  {errors.email?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
                </div>

                <div>
                  <label htmlFor="rr-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="+27 12 345 6789" />
                  </div>
                </div>

                <div>
                  <PasswordField
                    id="rr-password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    showIcon
                  />
                  {errors.password?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
                </div>

                <div>
                  <label htmlFor="rr-password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-password-confirm" type="password" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Repeat password" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-2">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Vehicle</h2>
              <div>
                <label htmlFor="rr-vehicle" className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <Select
                  id="rr-vehicle"
                  value={vehicleType}
                  onChange={setVehicleType}
                  options={VEHICLE_TYPES}
                  icon={<Bike size={16} />}
                />
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Submitting...' : 'Register as Rider'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </div>
        </motion.div>
      </main>
    </>
  )
}
