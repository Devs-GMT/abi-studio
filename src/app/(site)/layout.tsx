import { AnnouncementBar } from '@/sections/announcement-bar/announcement-bar'
import { Footer } from '@/sections/footer/footer'
import { Navbar } from '@/sections/navbar/navbar'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      {/* The rails: one ruled column from the navbar to the footer. */}
      <div className="relative mx-auto max-w-[1248px] md:border-x md:border-line">
        <main id="main">{children}</main>
        <Footer />
      </div>
    </>
  )
}
