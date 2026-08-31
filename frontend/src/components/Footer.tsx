import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1B1816] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-base sm:text-xl font-bold text-white mb-4">Checkstar</h3>
            <p className="text-sm leading-relaxed">
              Durban-based supermarket chain serving fresh groceries with free delivery across the city.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/about" className="hover:text-primary transition-colors">About</Link>
              <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
              <Link href="/specials" className="hover:text-primary transition-colors">Specials</Link>
              <Link href="/stores" className="hover:text-primary transition-colors">Our Stores</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Customer Service</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
              <Link href="/careers" className="hover:text-primary transition-colors">Careers</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Contact</h4>
            <div className="flex flex-col gap-2 text-sm">
              <span>Durban, South Africa</span>
              <span>Tel: (031) 000-0000</span>
              <span>info@checkstar.co.za</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Checkstar. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
