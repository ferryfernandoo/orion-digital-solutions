import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiEdit, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';

const Calendar = () => {
  // Load saved events from localStorage or initialize empty
  const loadEvents = () => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : {};
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState(loadEvents());
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    startTime: '09:00', 
    endTime: '10:00',
    color: '#3b82f6' 
  });
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [searchQuery, setSearchQuery] = useState('');

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
  ];

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1
    ));
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const formatDate = (date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    // Always show event form when clicking a date
    setShowEventForm(true);
    setNewEvent({
      id: Date.now().toString(),
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      color: '#3b82f6'
    });
    setEditMode(false);
  };

  const handleAddEvent = () => {
    if (newEvent.title.trim()) {
      const dateStr = formatDate(selectedDate);
      const eventToAdd = {
        ...newEvent,
        id: newEvent.id || Date.now().toString(),
        date: dateStr
      };

      setEvents(prevEvents => ({
        ...prevEvents,
        [dateStr]: [...(prevEvents[dateStr] || []), eventToAdd]
      }));

      resetEventForm();
    }
  };

  const handleUpdateEvent = () => {
    if (newEvent.title.trim()) {
      const dateStr = formatDate(selectedDate);
      
      setEvents(prevEvents => ({
        ...prevEvents,
        [dateStr]: (prevEvents[dateStr] || []).map(event => 
          event.id === newEvent.id ? newEvent : event
        )
      }));

      resetEventForm();
    }
  };

  const handleDeleteEvent = (dateStr, eventId) => {
    setEvents(prevEvents => ({
      ...prevEvents,
      [dateStr]: (prevEvents[dateStr] || []).filter(event => event.id !== eventId)
    }));
  };

  const resetEventForm = () => {
    setNewEvent({ 
      id: '', 
      title: '', 
      description: '', 
      startTime: '09:00', 
      endTime: '10:00',
      color: '#3b82f6' 
    });
    setShowEventForm(false);
    setEditMode(false);
  };

  const startEditEvent = (event) => {
    setNewEvent(event);
    setShowEventForm(true);
    setEditMode(true);
  };

  const renderMonthView = () => {
    const calendar = [];
    let date = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfMonth) {
          week.push(<td key={`empty-${j}`} className="p-1 h-24 border border-gray-200"></td>);
        } else if (date > daysInMonth) {
          week.push(<td key={`empty-end-${j}`} className="p-1 h-24 border border-gray-200"></td>);
        } else {
          const currentDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
          const dateStr = formatDate(currentDateObj);
          const dayEvents = events[dateStr] || [];
          const isToday = currentDateObj.toDateString() === new Date().toDateString();
          const isSelected = selectedDate.toDateString() === currentDateObj.toDateString();
          
          week.push(            <motion.td 
              key={date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-1 h-24 border border-gray-200 relative group cursor-pointer
                ${isToday ? 'bg-blue-50' : ''} 
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                hover:bg-gray-50`}
              onClick={() => handleDateClick(currentDateObj)}
            >
              <div className="relative h-full">
                <div className={`absolute top-1 right-1 w-7 h-7 flex items-center justify-center 
                  rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'} 
                  font-semibold text-sm z-10`}>
                  {date}
                </div>
                
                {/* Quick Add Button */}
                <motion.button
                  className="absolute top-1 left-1 w-6 h-6 bg-blue-500 rounded-full text-white opacity-0 
                           group-hover:opacity-100 flex items-center justify-center shadow-lg
                           hover:bg-blue-600 transition-all duration-200 z-20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(currentDateObj);
                    setShowEventForm(true);
                    setNewEvent({
                      id: Date.now().toString(),
                      title: '',
                      description: '',
                      startTime: '09:00',
                      endTime: '10:00',
                      color: '#3b82f6'
                    });
                  }}
                >
                  <FiPlus size={14} />
                </motion.button>

                <div className="overflow-y-auto max-h-20 mt-8 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xs p-1 mb-1 rounded truncate cursor-pointer"
                      style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditEvent(event);
                      }}
                    >
                      {event.startTime} {event.title}
                    </motion.div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            </motion.td>
          );
          date++;
        }
      }
      calendar.push(<tr key={i}>{week}</tr>);
      if (date > daysInMonth) break;
    }
    return calendar;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDate(day);
      const dayEvents = events[dateStr] || [];
      const isToday = day.toDateString() === new Date().toDateString();
      const isSelected = selectedDate.toDateString() === day.toDateString();
      
      weekDays.push(
        <motion.td 
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-2 border border-gray-200 ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="text-center font-medium">
            {shortDays[i]} {day.getDate()}
          </div>
          <div className="h-64 overflow-y-auto">
            {dayEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm p-2 mb-2 rounded cursor-pointer"
                style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
                onClick={(e) => {
                  e.stopPropagation();
                  startEditEvent(event);
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500">{event.startTime} - {event.endTime}</div>
              </motion.div>
            ))}
          </div>
        </motion.td>
      );
    }
    
    return (
      <tr>
        {weekDays}
      </tr>
    );
  };

  const renderDayView = () => {
    const hours = [];
    const dateStr = formatDate(selectedDate);
    const dayEvents = events[dateStr] || [];
    
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const hourEvents = dayEvents.filter(event => 
        parseInt(event.startTime.split(':')[0]) === hour
      );
      
      hours.push(
        <tr key={hour} className="h-16 border-b border-gray-200">
          <td className="w-16 text-right p-2 text-gray-500">{timeString}</td>
          <td className="relative">
            {hourEvents.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-0 left-0 right-0 mx-2 p-2 rounded cursor-pointer"
                style={{ 
                  backgroundColor: `${event.color}20`, 
                  borderLeft: `3px solid ${event.color}`,
                  height: 'calc(100% - 4px)'
                }}
                onClick={() => startEditEvent(event)}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500">
                  {event.startTime} - {event.endTime}
                </div>
              </motion.div>
            ))}
          </td>
        </tr>
      );
    }
    
    return (
      <table className="w-full">
        <tbody>
          {hours}
        </tbody>
      </table>
    );
  };

  const filteredEvents = Object.entries(events)
    .flatMap(([date, events]) => events.map(event => ({ ...event, date })))
    .filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-lg ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('month')}
                >
                  Month
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('week')}
                >
                  Week
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setViewMode('day')}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => navigateMonth(-1)}
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              onClick={navigateToToday}
            >
              Today
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => navigateMonth(1)}
            >
              <FiChevronRight size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
            onClick={() => {
              setShowEventForm(true);
              setNewEvent({
                id: Date.now().toString(),
                title: '',
                description: '',
                startTime: '09:00',
                endTime: '10:00',
                color: '#3b82f6'
              });
              setEditMode(false);
            }}
          >
            <FiPlus className="mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {viewMode === 'month' && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {shortDays.map(day => (
                    <th key={day} className="p-3 text-gray-600 font-medium">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{renderMonthView()}</tbody>
            </table>
          )}

          {viewMode === 'week' && (
            <table className="w-full border-collapse">
              <tbody>{renderWeekView()}</tbody>
            </table>
          )}

          {viewMode === 'day' && (
            <div className="p-4">
              <div className="text-xl font-semibold text-gray-800 mb-4">
                {days[selectedDate.getDay()]}, {selectedDate.getDate()} {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
              {renderDayView()}
            </div>
          )}
        </div>

        {/* Selected Date Events */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiCalendar className="mr-2 text-blue-600" />
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          <div className="space-y-3">
            {events[formatDate(selectedDate)]?.length > 0 ? (
              events[formatDate(selectedDate)].map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  style={{ borderLeft: `3px solid ${event.color}` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <FiClock className="mr-1" size={14} />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="text-gray-400 hover:text-blue-600"
                        onClick={() => startEditEvent(event)}
                      >
                        <FiEdit size={16} />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteEvent(formatDate(selectedDate), event.id)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      <AnimatePresence>
        {showEventForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={resetEventForm}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editMode ? 'Edit Event' : 'Add Event'}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={resetEventForm}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Meeting with team"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Discuss project progress..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time*</label>
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time*</label>
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex space-x-2">
                    {colorOptions.map(color => (
                      <div 
                        key={color.value}
                        className={`w-8 h-8 rounded-full cursor-pointer ${newEvent.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  {editMode && (
                    <button
                      className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-white"
                      onClick={() => {
                        handleDeleteEvent(formatDate(selectedDate), newEvent.id);
                        resetEventForm();
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                    onClick={resetEventForm}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
                    onClick={editMode ? handleUpdateEvent : handleAddEvent}
                  >
                    {editMode ? 'Update' : 'Save'} Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Modal */}
      <AnimatePresence>
        {searchQuery && filteredEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSearchQuery('')}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Search Results for "{searchQuery}"
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="space-y-3">
                {filteredEvents.map(event => {
                  const eventDate = new Date(event.date);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                      style={{ borderLeft: `3px solid ${event.color}` }}
                      onClick={() => {
                        const date = new Date(event.date);
                        setSelectedDate(date);
                        setCurrentDate(date);
                        setViewMode('day');
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{event.title}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            {eventDate.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <FiClock className="mr-1" size={14} />
                            {event.startTime} - {event.endTime}
                          </div>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditEvent(event);
                          }}
                        >
                          <FiEdit size={16} />
                        </button>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;