import React from 'react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">About BookIt</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Connecting people with unforgettable experiences</p>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-center">Our Mission</h2>
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-8 rounded-xl">
            <p className="text-lg text-center leading-relaxed">
              At BookIt, we believe that life is about creating memories and embracing new experiences.
              Our mission is to connect passionate individuals with unique, locally-crafted experiences
              that enrich lives and bring communities together.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold mb-6">Our Story</h2>
              <p className="mb-4">
                Founded in 2020, BookIt began as a simple idea: what if anyone could easily discover
                and book amazing local experiences? What started as a weekend project between friends
                has grown into a thriving platform connecting thousands of experience seekers with
                talented local hosts.
              </p>
              <p className="mb-4">
                We've curated experiences ranging from cooking classes and adventure tours to art
                workshops and wellness retreats. Every experience on our platform is carefully
                vetted to ensure quality, safety, and authenticity.
              </p>
              <p>
                Today, BookIt serves communities across the country, helping people discover the
                hidden gems and unique opportunities in their own backyards and beyond.
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">50K+</div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">Experiences Booked</div>
                <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">Happy Customers</div>
                <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-400">Local Hosts</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Authenticity</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We believe in genuine connections and real experiences that create lasting memories.
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We foster connections between experience seekers and local communities.
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every experience is vetted for safety, quality, and exceptional value.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">SJ</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sarah Johnson</h3>
              <p className="text-primary-600 mb-2">Co-Founder & CEO</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Passionate about connecting people with meaningful experiences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">MR</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mike Rodriguez</h3>
              <p className="text-primary-600 mb-2">Co-Founder & CTO</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tech enthusiast building the future of experience booking.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">LC</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lisa Chen</h3>
              <p className="text-primary-600 mb-2">Head of Experience Curation</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ensuring every experience meets our high standards of quality.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Have questions about BookIt or want to become a host? We'd love to hear from you!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <strong className="block mb-1">Email</strong>
                <a href="mailto:hello@bookit.com" className="text-primary-600 hover:text-primary-700">
                  hello@bookit.com
                </a>
              </div>
              <div>
                <strong className="block mb-1">Phone</strong>
                <a href="tel:+15551234567" className="text-primary-600 hover:text-primary-700">
                  (555) 123-4567
                </a>
              </div>
              <div>
                <strong className="block mb-1">Address</strong>
                <span className="text-gray-600 dark:text-gray-400">
                  123 Experience Street<br />
                  Adventure City, AC 12345
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
