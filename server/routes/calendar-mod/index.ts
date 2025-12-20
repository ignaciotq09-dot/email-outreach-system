import { Router } from 'express';
import { createEvent, listEvents, deleteEvent } from './events';
import { checkAvailability, findAvailableSlots } from './availability';
import { getPreferences, updatePreferences } from './preferences';
import { processReply, scheduleFromAppointment } from './meetings';

const router = Router();
router.post('/events', createEvent);
router.get('/events', listEvents);
router.delete('/events/:eventId', deleteEvent);
router.get('/availability', checkAvailability);
router.get('/available-slots', findAvailableSlots);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/meetings/process-reply', processReply);
router.post('/meetings/:appointmentId/schedule', scheduleFromAppointment);

export default router;
