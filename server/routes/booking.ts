import { Router } from "express";
import { 
  getBookingPageBySlug, 
  getBookingPageByUserId, 
  createBookingPage, 
  updateBookingPage,
  generateUniqueSlug,
  getAvailableSlots,
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  cancelBooking,
  getBookingStats
} from "../services/booking";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/my-page", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let page = await getBookingPageByUserId(req.user.id);

    if (!page) {
      const userName = req.user.name || req.user.firstName || req.user.email?.split('@')[0] || 'user';
      const slug = await generateUniqueSlug(userName);
      page = await createBookingPage(req.user.id, slug);
    }

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    res.json({
      ...page,
      bookingUrl: `${baseUrl}/book/${page.slug}`,
    });
  } catch (error: any) {
    console.error("[Booking] Error getting booking page:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/my-page", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const page = await updateBookingPage(req.user.id, req.body);
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    res.json({
      ...page,
      bookingUrl: `${baseUrl}/book/${page?.slug}`,
    });
  } catch (error: any) {
    console.error("[Booking] Error updating booking page:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/page/:slug", async (req, res) => {
  try {
    const page = await getBookingPageBySlug(req.params.slug);

    if (!page) {
      return res.status(404).json({ error: "Booking page not found" });
    }

    if (!page.isActive) {
      return res.status(404).json({ error: "Booking page is not active" });
    }

    res.json(page);
  } catch (error: any) {
    console.error("[Booking] Error getting public booking page:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/page/:slug/slots", async (req, res) => {
  try {
    const page = await getBookingPageBySlug(req.params.slug);

    if (!page) {
      return res.status(404).json({ error: "Booking page not found" });
    }

    const dateStr = req.query.date as string;
    if (!dateStr) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const slots = await getAvailableSlots(page.id, date);
    res.json(slots);
  } catch (error: any) {
    console.error("[Booking] Error getting slots:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/page/:slug/book", async (req, res) => {
  try {
    const page = await getBookingPageBySlug(req.params.slug);

    if (!page) {
      return res.status(404).json({ error: "Booking page not found" });
    }

    if (!page.isActive) {
      return res.status(404).json({ error: "Booking page is not active" });
    }

    const { guestName, guestEmail, guestPhone, guestNotes, customAnswers, startTime, endTime, timezone } = req.body;

    if (!guestName || !guestEmail || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await createBooking({
      bookingPageId: page.id,
      guestName,
      guestEmail,
      guestPhone,
      guestNotes,
      customAnswers,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone,
    });

    res.json({ 
      success: true, 
      booking: {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        meetingLink: booking.meetingLink,
      }
    });
  } catch (error: any) {
    console.error("[Booking] Error creating booking:", error);
    res.status(400).json({ error: error.message });
  }
});

router.get("/my-bookings", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const bookingsList = await getUserBookings(req.user.id, status, limit);
    res.json(bookingsList);
  } catch (error: any) {
    console.error("[Booking] Error getting bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const upcoming = await getUpcomingBookings(req.user.id, limit);
    res.json(upcoming);
  } catch (error: any) {
    console.error("[Booking] Error getting upcoming bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:bookingId/cancel", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const bookingId = parseInt(req.params.bookingId);
    const { reason } = req.body;

    const booking = await cancelBooking(bookingId, req.user.id, reason);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error: any) {
    console.error("[Booking] Error cancelling booking:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const stats = await getBookingStats(req.user.id);
    res.json(stats);
  } catch (error: any) {
    console.error("[Booking] Error getting stats:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/notification-settings", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db
      .select({ phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    res.json({
      phone: user?.phone || null,
      email: user?.email || null,
      smsEnabled: !!user?.phone,
      emailEnabled: !!user?.email,
    });
  } catch (error: any) {
    console.error("[Booking] Error getting notification settings:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/notification-settings", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { phone } = req.body;

    let normalizedPhone: string | null = null;
    if (phone && typeof phone === 'string' && phone.trim()) {
      const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
        return res.status(400).json({ error: "Invalid phone number format. Use E.164 format like +1234567890" });
      }
      normalizedPhone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    }

    await db
      .update(users)
      .set({ phone: normalizedPhone })
      .where(eq(users.id, req.user.id));

    res.json({ 
      success: true,
      phone: normalizedPhone,
      smsEnabled: !!normalizedPhone,
    });
  } catch (error: any) {
    console.error("[Booking] Error updating notification settings:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
