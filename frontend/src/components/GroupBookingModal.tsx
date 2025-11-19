import React, { useState } from 'react';

interface Participant {
  name: string;
  email: string;
  phone: string;
}

interface GroupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  slotDate: string;
  slotTime: string;
  basePrice: number;
  onBookingSuccess: (booking: any) => void;
}

const GroupBookingModal: React.FC<GroupBookingModalProps> = ({
  isOpen,
  onClose,
  experienceId,
  slotDate,
  slotTime,
  basePrice,
  onBookingSuccess
}) => {
  const [participants, setParticipants] = useState<Participant[]>([
    { name: '', email: '', phone: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '', phone: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const calculateDiscount = (quantity: number) => {
    if (quantity >= 10) return 15;
    if (quantity >= 5) return 10;
    if (quantity >= 3) return 5;
    return 0;
  };

  const quantity = participants.length;
  const discountPercentage = calculateDiscount(quantity);
  const totalBeforeDiscount = basePrice * quantity;
  const discountAmount = (totalBeforeDiscount * discountPercentage) / 100;
  const finalTotal = totalBeforeDiscount - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate participants
    const validParticipants = participants.filter(p => p.name.trim() && p.email.trim());
    if (validParticipants.length < 2) {
      alert('Please add at least 2 participants with name and email');
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validParticipants.filter(p => !emailRegex.test(p.email));
    if (invalidEmails.length > 0) {
      alert('Please enter valid email addresses for all participants');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to make a booking');
        return;
      }

      const response = await fetch('/api/group-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experienceId,
          slotDate,
          slotTime,
          participants: validParticipants,
          paymentMethod: 'full' // Organizer pays full amount initially
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Group booking created successfully! You saved $${discountAmount.toFixed(2)} with the group discount.`);
        onBookingSuccess(data.booking);
        onClose();
      } else {
        alert(data.message || 'Failed to create group booking');
      }
    } catch (error) {
      console.error('Group booking error:', error);
      alert('Failed to create group booking');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create Group Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Participants ({quantity})</h3>

              {participants.map((participant, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">
                      Participant {index + 1} {index === 0 && '(Organizer)'}
                    </h4>
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={participant.phone}
                      onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addParticipant}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                + Add Participant
              </button>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Pricing Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Price ({quantity} × ${basePrice}):</span>
                  <span>${totalBeforeDiscount.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Group Discount ({discountPercentage}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <p className="text-sm text-green-600">
                    🎉 You save ${discountAmount.toFixed(2)} with group booking!
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating Booking...' : 'Create Group Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupBookingModal;