import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckCircle, CalendarDays, Loader2 } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingPage {
  id: number;
  userId: number;
  slug: string;
  title: string;
  description: string;
  duration: number;
  timezone: string;
  maxDaysInAdvance: number;
  userName: string;
  userEmail: string;
  userFirstName: string;
  userProfileImage: string;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirmed'>('date');
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestNotes: '',
  });

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery<BookingPage>({
    queryKey: [`/api/booking/page/${slug}`],
    enabled: !!slug,
  });

  const { data: slots, isLoading: slotsLoading } = useQuery<TimeSlot[]>({
    queryKey: [`/api/booking/page/${slug}/slots`, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return [];
      const response = await fetch(`/api/booking/page/${slug}/slots?date=${selectedDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch slots');
      return response.json();
    },
    enabled: !!slug && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: typeof formData & { startTime: string; endTime: string }) => {
      const response = await fetch(`/api/booking/page/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book');
      }
      return response.json();
    },
    onSuccess: () => {
      setStep('confirmed');
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setStep('time');
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    bookMutation.mutate({
      ...formData,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
    });
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="booking-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="booking-error">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Booking Page Not Found</h1>
            <p className="text-muted-foreground">This booking link may be invalid or no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="booking-confirmed">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Meeting Booked!</h1>
            <p className="text-muted-foreground mb-4">
              Your meeting with {page.userFirstName || page.userName} has been confirmed.
            </p>
            {selectedSlot && selectedDate && (
              <div className="bg-muted rounded-lg p-4 text-left">
                <p className="font-medium">{format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-muted-foreground">
                  {format(new Date(selectedSlot.start), 'h:mm a')} - {format(new Date(selectedSlot.end), 'h:mm a')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{page.duration} minute meeting</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              A calendar invitation has been sent to {formData.guestEmail}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableSlots = slots?.filter(s => s.available) || [];
  const minDate = startOfDay(new Date());
  const maxDate = addDays(minDate, page.maxDaysInAdvance || 30);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="booking-page">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={page.userProfileImage} />
                <AvatarFallback>{(page.userFirstName || page.userName || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle data-testid="booking-host-name">{page.userFirstName || page.userName}</CardTitle>
                <CardDescription>{page.title}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <Clock className="h-4 w-4" />
              <span>{page.duration} min</span>
            </div>
            {page.description && (
              <p className="text-sm text-muted-foreground mt-2">{page.description}</p>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Select a Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < minDate || date > maxDate}
                  className="rounded-md border"
                  data-testid="booking-calendar"
                />
              </div>

              <div>
                {step === 'date' && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mb-4" />
                    <p>Select a date to see available times</p>
                  </div>
                )}

                {step === 'time' && (
                  <div>
                    <h3 className="font-medium mb-4">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                    </h3>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No available times on this date
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto" data-testid="booking-slots">
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            onClick={() => handleSlotSelect(slot)}
                            data-testid={`slot-${index}`}
                          >
                            {format(new Date(slot.start), 'h:mm a')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 'details' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-medium mb-4">Your Details</h3>
                    
                    {selectedSlot && (
                      <div className="bg-muted rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d')} at {format(new Date(selectedSlot.start), 'h:mm a')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="guestName">Your Name *</Label>
                      <Input
                        id="guestName"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        required
                        data-testid="input-guest-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Email *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                        required
                        data-testid="input-guest-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestPhone">Phone (optional)</Label>
                      <Input
                        id="guestPhone"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                        data-testid="input-guest-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestNotes">Additional Notes (optional)</Label>
                      <Textarea
                        id="guestNotes"
                        value={formData.guestNotes}
                        onChange={(e) => setFormData({ ...formData, guestNotes: e.target.value })}
                        placeholder="Anything you'd like to discuss?"
                        data-testid="input-guest-notes"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('time')}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={bookMutation.isPending || !formData.guestName || !formData.guestEmail}
                        data-testid="button-confirm-booking"
                      >
                        {bookMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </Button>
                    </div>

                    {bookMutation.isError && (
                      <p className="text-sm text-destructive" data-testid="booking-error-message">
                        {bookMutation.error?.message || 'Failed to book. Please try again.'}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
