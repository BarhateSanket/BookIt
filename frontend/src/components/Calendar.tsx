import { useState, useCallback, useMemo } from 'react';

// Calendar and Booking Types
interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
  spotsLeft: number;
  maxSpots: number;
  price?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'booking' | 'unavailable' | 'maintenance';
  status: 'confirmed' | 'pending' | 'cancelled';
  participants?: number;
}

interface CalendarProps {
  selectedDate?: string;
  selectedTime?: string;
  onDateSelect: (date: string) => void;
  onTimeSelect?: (time: string) => void;
  availability?: Record<string, AvailabilitySlot[]>;
  events?: CalendarEvent[];
  minDate?: string;
  maxDate?: string;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  multiSelect?: boolean;
  className?: string;
}

interface DateInfo {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  availabilityCount: number;
  events: CalendarEvent[];
}

// Date utilities
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};


const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return result;
};

const endOfWeek = (date: Date): Date => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
};

const isSameDay = (date1: string, date2: string): boolean => {
  return date1 === date2;
};

const isDateInRange = (date: string, startDate?: string, endDate?: string): boolean => {
  const dateObj = new Date(date);
  if (startDate && dateObj < new Date(startDate)) return false;
  if (endDate && dateObj > new Date(endDate)) return false;
  return true;
};

// Calendar component
export function Calendar({
  selectedDate,
  onDateSelect,
  availability = {},
  events = [],
  minDate,
  maxDate,
  view = 'month',
  onViewChange,
  multiSelect = false,
  className = ''
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const firstDay = startOfWeek(startOfMonth(currentDate));
    const lastDay = endOfWeek(endOfMonth(currentDate));
    
    let current = new Date(firstDay);
    while (current <= lastDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Process date information
  const dateInfoMap = useMemo(() => {
    const infoMap = new Map<string, DateInfo>();
    const today = formatDate(new Date());
    
    calendarDays.forEach(date => {
      const dateStr = formatDate(date);
      const dateEvents = events.filter(event => event.date === dateStr);
      const dayAvailability = availability[dateStr] || [];
      const availableSpots = dayAvailability.filter(slot => slot.available).length;
      
      infoMap.set(dateStr, {
        date: dateStr,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(dateStr, today),
        isSelected: selectedDate === dateStr || selectedDates.includes(dateStr),
        isAvailable: availableSpots > 0,
        availabilityCount: availableSpots,
        events: dateEvents
      });
    });
    
    return infoMap;
  }, [calendarDays, currentDate, selectedDate, selectedDates, availability, events]);

  const handleDateClick = useCallback((dateStr: string) => {
    if (!isDateInRange(dateStr, minDate, maxDate)) return;
    
    if (multiSelect) {
      setSelectedDates(prev => 
        prev.includes(dateStr) 
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      );
    } else {
      setSelectedDates([dateStr]);
    }
    
    onDateSelect(dateStr);
  }, [multiSelect, onDateSelect, minDate, maxDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
          >
            Today
          </button>
          
          {onViewChange && (
            <select
              value={view}
              onChange={(e) => onViewChange(e.target.value as 'month' | 'week' | 'day')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              aria-label="Calendar view"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const dateStr = formatDate(date);
            const dateInfo = dateInfoMap.get(dateStr);
            
            if (!dateInfo) return null;
            
            const isDisabled = !isDateInRange(dateStr, minDate, maxDate);
            const isPast = new Date(dateStr) < new Date(formatDate(new Date()));
            
            return (
              <div
                key={dateStr}
                className={`
                  relative p-2 h-16 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all
                  ${!dateInfo.isCurrentMonth ? 'opacity-30' : ''}
                  ${dateInfo.isSelected ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                  ${dateInfo.isToday ? 'ring-2 ring-blue-500' : ''}
                  ${!dateInfo.isAvailable || isDisabled || isPast ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isDisabled && !isPast && handleDateClick(dateStr)}
                role="button"
                tabIndex={!isDisabled && !isPast ? 0 : -1}
                aria-label={`${date.toDateString()}${dateInfo.isAvailable ? `, ${dateInfo.availabilityCount} slots available` : ', not available'}`}
              >
                {/* Date number */}
                <div className={`
                  text-sm font-medium
                  ${dateInfo.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}
                  ${!dateInfo.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                  ${!dateInfo.isAvailable || isDisabled || isPast ? 'text-gray-400 dark:text-gray-600' : ''}
                `}>
                  {date.getDate()}
                </div>
                
                {/* Availability indicator */}
                {dateInfo.isCurrentMonth && dateInfo.availabilityCount > 0 && (
                  <div className="absolute bottom-1 right-1">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${dateInfo.availabilityCount > 5 ? 'bg-green-500' : 
                        dateInfo.availabilityCount > 0 ? 'bg-yellow-500' : 'bg-red-500'}
                    `} />
                  </div>
                )}
                
                {/* Events indicator */}
                {dateInfo.events.length > 0 && (
                  <div className="absolute bottom-1 left-1">
                    <div className="flex space-x-1">
                      {dateInfo.events.slice(0, 3).map((event, index) => (
                        <div
                          key={index}
                          className={`
                            w-1.5 h-1.5 rounded-full
                            ${event.status === 'confirmed' ? 'bg-green-500' :
                              event.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}
                          `}
                        />
                      ))}
                      {dateInfo.events.length > 3 && (
                        <span className="text-xs text-gray-500">+{dateInfo.events.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Available (5+ spots)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Limited (1-5 spots)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Fully booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Not available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Time slot selection component
interface TimeSlotSelectorProps {
  date: string;
  availability: Record<string, AvailabilitySlot[]>;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  className?: string;
}

export function TimeSlotSelector({
  date,
  availability,
  selectedTime,
  onTimeSelect,
  className = ''
}: TimeSlotSelectorProps) {
  const timeSlots = availability[date] || [];
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Available times for {new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </h3>
      
      {timeSlots.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No available time slots for this date.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={`${slot.date}-${slot.time}`}
              onClick={() => slot.available && onTimeSelect(slot.time)}
              disabled={!slot.available || slot.spotsLeft === 0}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${selectedTime === slot.time 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                  : slot.available && slot.spotsLeft > 0
                    ? 'border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }
              `}
              aria-label={`${slot.time} - ${slot.spotsLeft} spots left`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {slot.time}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {slot.spotsLeft > 0 ? `${slot.spotsLeft} spots left` : 'Fully booked'}
              </div>
              {slot.price && (
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  ${slot.price}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Booking calendar modal
interface BookingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  experienceTitle: string;
  onDateTimeSelect: (date: string, time: string) => void;
  initialDate?: string;
  initialTime?: string;
  availability?: Record<string, AvailabilitySlot[]>;
  minAdvanceBooking?: number; // hours
  maxAdvanceBooking?: number; // days
}

export function BookingCalendarModal({
  isOpen,
  onClose,
  experienceId,
  experienceTitle,
  onDateTimeSelect,
  initialDate,
  initialTime,
  availability = {},
  maxAdvanceBooking = 365
}: BookingCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [step, setStep] = useState<'date' | 'time'>('date');

  const today = new Date();
  const minDate = formatDate(addDays(today, 0)); // Today
  const maxDate = formatDate(addDays(today, maxAdvanceBooking));

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onDateTimeSelect(selectedDate, selectedTime);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('date');
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setStep('date');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Book {experienceTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Step {step === 'date' ? '1' : '2'} of 2: Select {step === 'date' ? 'date' : 'time'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close calendar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {step === 'date' ? (
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availability={availability}
              minDate={minDate}
              maxDate={maxDate}
              className="w-full"
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to calendar
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Selected: {new Date(selectedDate).toLocaleDateString()}
                </div>
              </div>
              
              <TimeSlotSelector
                date={selectedDate}
                availability={availability}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          {step === 'time' && (
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// Mini calendar component for date picker
interface MiniCalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  className = ''
}: MiniCalendarProps) {

  const handleDateClick = (date: string) => {
    if (isDateInRange(date, minDate, maxDate)) {
      onDateSelect(date);
    }
  };

  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={handleDateClick}
      minDate={minDate}
      maxDate={maxDate}
      className={`${className} max-w-sm`}
    />
  );
}