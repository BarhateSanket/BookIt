import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400">Last updated: December 2024</p>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you create an account,
            make a booking, or contact us for support. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name, email address, and phone number</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Booking history and preferences</li>
            <li>Communications with our support team</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Process and manage your bookings</li>
            <li>Provide customer support</li>
            <li>Send you important updates about your bookings</li>
            <li>Improve our services and develop new features</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties
            except in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>With experience providers to fulfill your bookings</li>
            <li>With payment processors to handle transactions</li>
            <li>When required by law or to protect our rights</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. This
            includes encryption of sensitive data and regular security assessments.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience on our platform.
            You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p><strong>Email:</strong> privacy@bookit.com</p>
            <p><strong>Phone:</strong> (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Experience Street, Adventure City, AC 12345</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>
      </div>
    </div>
  );
}
