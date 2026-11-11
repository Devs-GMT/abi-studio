import { AnnouncementBar } from '@/sections/announcement-bar/announcement-bar'
import { Footer } from '@/sections/footer/footer'
import { Navbar } from '@/sections/navbar/navbar'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      {/* Content column. Rails (border-x) are drawn per Section, so the hero stays clean. */}
      <div className="relative mx-auto max-w-[1248px]">
        <main id="main">{children}</main>
        <Footer />
      </div>
    </>
  )
}
