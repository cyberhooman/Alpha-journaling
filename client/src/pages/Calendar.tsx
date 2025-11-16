import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsAPI } from '../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => analyticsAPI.getCalendar({ year, month }),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create calendar grid
  const firstDayOfWeek = monthStart.getDay();
  const calendarDays = Array(firstDayOfWeek).fill(null).concat(daysInMonth);

  // Map data by date
  const dataByDate = new Map();
  calendarData?.data.forEach((item: any) => {
    dataByDate.set(item.date, item);
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trading Calendar</h1>
          <p className="text-slate-600 mt-1">View your trading activity by date</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-slate-900 min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = dataByDate.get(dateStr);
            const pnl = dayData ? Number(dayData.pnl) : 0;
            const trades = dayData ? Number(dayData.trades) : 0;
            const wins = dayData ? Number(dayData.wins) : 0;

            return (
              <div
                key={dateStr}
                className={`aspect-square border border-slate-200 rounded-lg p-2 ${
                  isToday(day) ? 'ring-2 ring-primary-500' : ''
                } ${
                  isSameMonth(day, currentDate) ? '' : 'opacity-50'
                } ${
                  dayData ? 'hover:shadow-md cursor-pointer transition-shadow' : ''
                }`}
              >
                <div className="h-full flex flex-col">
                  <div className="text-sm font-medium text-slate-900">
                    {format(day, 'd')}
                  </div>

                  {dayData && (
                    <div className="flex-1 mt-1 space-y-1">
                      <div className="text-xs text-slate-600">{trades} trades</div>
                      <div className={`text-xs font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${pnl.toFixed(0)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {wins}/{trades} wins
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-500 rounded"></div>
            <span className="text-slate-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-slate-600">Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-slate-600">Loss Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
