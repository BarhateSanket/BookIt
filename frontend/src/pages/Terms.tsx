import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 dark:text-gray-400">Last updated: December 2024</p>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using BookIt, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above,
            please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily use BookIt for personal, non-commercial
            transitory viewing only. This is the grant of a license, not a transfer of title,
            and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on BookIt</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="mb-4">
            When you create an account with us, you must provide information that is accurate,
            complete, and current at all times. You are responsible for safeguarding the password
            and for all activities that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Bookings and Payments</h2>
          <p className="mb-4">
            All bookings are subject to availability and confirmation. Prices are subject to change
            without notice. Payment must be made in full at the time of booking unless otherwise
            specified. We reserve the right to cancel or refuse any booking for any reason.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cancellation Policy</h2>
          <p className="mb-4">
            Cancellation policies vary by experience and are clearly stated at the time of booking.
            Generally, cancellations made 24 hours or more before the experience start time will
            receive a full refund. Cancellations made less than 24 hours in advance may be subject
            to fees or no refund, depending on the experience provider's policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
          <p className="mb-4">You agree not to use the service to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Transmit harmful or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Harass, abuse, or harm others</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Content and Intellectual Property</h2>
          <p className="mb-4">
            The service and its original content, features, and functionality are and will remain
            the exclusive property of BookIt and its licensors. The service is protected by copyright,
            trademark, and other laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall BookIt, nor its directors, employees, partners, agents, suppliers,
            or affiliates, be liable for any indirect, incidental, special, consequential, or
            punitive damages, including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p className="mb-4">
            We may terminate or suspend your account immediately, without prior notice or liability,
            for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be interpreted and governed by the laws of the jurisdiction in which
            BookIt operates, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material, we will try to provide at least 30 days notice prior to any
            new terms taking effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p><strong>Email:</strong> legal@bookit.com</p>
            <p><strong>Phone:</strong> (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Experience Street, Adventure City, AC 12345</p>
          </div>
        </section>
      </div>
    </div>
  );
}
