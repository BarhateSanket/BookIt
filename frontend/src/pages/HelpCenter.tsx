import React, { useState } from 'react';

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I book an experience?",
      answer: "To book an experience, browse our catalog, select the experience you're interested in, choose your preferred date and time, and complete the booking process. You'll receive a confirmation email with all the details."
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes, you can cancel or reschedule most bookings up to 24 hours before the experience starts. Check the specific cancellation policy for each experience, as some may have different terms."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our encrypted payment system."
    },
    {
      question: "Do you offer refunds?",
      answer: "Refund policies vary by experience. Generally, full refunds are available for cancellations made 24+ hours in advance. For last-minute cancellations, credits may be issued instead of refunds."
    },
    {
      question: "How do I become a host?",
      answer: "To become a host, create an account, go to your dashboard, and click 'Become a Host'. Fill out your profile, add your experiences, and submit for approval. Our team will review your application within 48 hours."
    },
    {
      question: "What should I do if I have a problem with my booking?",
      answer: "Contact our support team immediately through the contact form or by emailing support@bookit.com. Include your booking reference number and describe the issue in detail."
    },
    {
      question: "Are the experiences insured?",
      answer: "All experiences listed on BookIt are covered by our comprehensive insurance policy. Hosts are also required to maintain their own liability insurance for their activities."
    },
    {
      question: "Can I book for a group?",
      answer: "Yes! Many experiences can accommodate groups. Check the experience details for group size limits and pricing. For large groups (10+ people), contact the host directly for custom arrangements."
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-gray-600 dark:text-gray-400">Find answers to common questions and get support</p>
      </header>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
          <svg className="w-12 h-12 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get instant help from our support team</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            Start Chat
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
          <svg className="w-12 h-12 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Email Support</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Send us an email and we'll respond within 24 hours</p>
          <a href="mailto:support@bookit.com" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-block">
            Email Us
          </a>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
          <svg className="w-12 h-12 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Call us during business hours</p>
          <a href="tel:+15551234567" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-block">
            Call Now
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {filteredFAQs.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No results found for "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Still need help?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/contact"
            className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="mailto:support@bookit.com"
            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
