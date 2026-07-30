'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, User, Phone, Bike, Landmark, Loader2, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/stores/auth-store'

const VEHICLE_TYPES = [
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'bicycle', label: 'Bicycle' },
]

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'transmission', label: 'Transmission' },
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
  const [bank, setBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [accountType, setAccountType] = useState('savings')
  const [showPassword, setShowPassword] = useState(false)
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
        banking_details: { bank, account_number: accountNumber, branch_code: branchCode, account_type: accountType },
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
      <Header />
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
                  <label htmlFor="rr-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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

            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Vehicle</h2>
              <div>
                <label htmlFor="rr-vehicle" className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <div className="relative">
                  <Bike size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select id="rr-vehicle" value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none bg-white">
                    {VEHICLE_TYPES.map(vt => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pb-2">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Banking Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="rr-bank" className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
                  <div className="relative">
                    <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="rr-bank" type="text" required value={bank} onChange={e => setBank(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="e.g. Standard Bank" />
                  </div>
                </div>
                <div>
                  <label htmlFor="rr-account-number" className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                  <input id="rr-account-number" type="text" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="000000000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rr-branch-code" className="block text-sm font-medium text-gray-700 mb-1.5">Branch Code</label>
                    <input id="rr-branch-code" type="text" required value={branchCode} onChange={e => setBranchCode(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="000000" />
                  </div>
                  <div>
                    <label htmlFor="rr-account-type" className="block text-sm font-medium text-gray-700 mb-1.5">Account Type</label>
                    <select id="rr-account-type" value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none bg-white">
                      {ACCOUNT_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                    </select>
                  </div>
                </div>
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
      <Footer />
    </>
  )
}
