import React, { useState, useEffect } from 'react';

interface WaitlistButtonProps {
  experienceId: string;
  slotDate: string;
  slotTime: string;
  availableSeats: number;
  capacity: number;
  quantity: number;
  onWaitlistChange?: () => void;
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({
  experienceId,
  slotDate,
  slotTime,
  availableSeats,
  capacity,
  quantity,
  onWaitlistChange
}) => {
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistOffers, setWaitlistOffers] = useState<any[]>([]);

  useEffect(() => {
    checkWaitlistStatus();
    loadWaitlistOffers();
  }, [experienceId, slotDate, slotTime]);

  const checkWaitlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/waitlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const onWaitlist = data.waitlist.some((item: any) =>
          item.experience === experienceId &&
          item.slotDate === slotDate &&
          item.slotTime === slotTime &&
          item.status === 'waiting'
        );
        setIsOnWaitlist(onWaitlist);
      }
    } catch (error) {
      console.error('Failed to check waitlist status:', error);
    }
  };

  const loadWaitlistOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/waitlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const offers = data.waitlist.filter((item: any) =>
          item.status === 'offered' &&
          item.experience === experienceId &&
          item.slotDate === slotDate &&
          item.slotTime === slotTime
        );
        setWaitlistOffers(offers);
      }
    } catch (error) {
      console.error('Failed to load waitlist offers:', error);
    }
  };

  const joinWaitlist = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to join the waitlist');
        return;
      }

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experienceId,
          slotDate,
          slotTime,
          quantity
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsOnWaitlist(true);
        onWaitlistChange?.();
        alert('Successfully added to waitlist!');
      } else {
        alert(data.message || 'Failed to join waitlist');
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
      alert('Failed to join waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Find the waitlist entry
      const response = await fetch('/api/waitlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const entry = data.waitlist.find((item: any) =>
          item.experience === experienceId &&
          item.slotDate === slotDate &&
          item.slotTime === slotTime &&
          item.status === 'waiting'
        );

        if (entry) {
          const deleteResponse = await fetch(`/api/waitlist/${entry._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (deleteResponse.ok) {
            setIsOnWaitlist(false);
            onWaitlistChange?.();
            alert('Removed from waitlist');
          }
        }
      }
    } catch (error) {
      console.error('Failed to leave waitlist:', error);
      alert('Failed to leave waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/waitlist/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Booking confirmed! Check your email for details.');
        loadWaitlistOffers();
        onWaitlistChange?.();
      } else {
        alert(data.message || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer');
    }
  };

  const declineOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/waitlist/${offerId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadWaitlistOffers();
        onWaitlistChange?.();
      }
    } catch (error) {
      console.error('Failed to decline offer:', error);
    }
  };

  // Show waitlist offers if any exist
  if (waitlistOffers.length > 0) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">🎉 Waitlist Offer Available!</h4>
        <p className="text-green-700 mb-3">A spot has opened up for your requested time slot.</p>
        {waitlistOffers.map(offer => (
          <div key={offer._id} className="flex space-x-2">
            <button
              onClick={() => acceptOffer(offer._id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              Accept Offer
            </button>
            <button
              onClick={() => declineOffer(offer._id)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Decline
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Show join/leave waitlist button if slots are full
  if (availableSeats <= 0) {
    return (
      <div className="mt-4">
        {isOnWaitlist ? (
          <button
            onClick={leaveWaitlist}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Leaving...' : 'Leave Waitlist'}
          </button>
        ) : (
          <button
            onClick={joinWaitlist}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Joining...' : 'Join Waitlist'}
          </button>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Get notified when spots become available for this time slot.
        </p>
      </div>
    );
  }

  return null; // Don't show anything if slots are available
};

export default WaitlistButton;