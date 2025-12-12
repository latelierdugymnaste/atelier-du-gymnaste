// components/navigation.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/products', label: 'Produits' },
    { href: '/orders', label: 'Commandes' },
    { href: '/customers', label: 'Clients' },
    { href: '/bons-cadeaux', label: 'Bons Cadeaux' },
    { href: '/expenses', label: 'Dépenses' },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-800">
              L'Atelier du Gymnaste
            </Link>
            <div className="flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">Chargement...</div>
            ) : session ? (
              <>
                <span className="text-sm text-gray-700">
                  {session.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}