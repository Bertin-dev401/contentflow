import * as admin from 'firebase-admin'
import { scheduleReminders } from './reminders'

admin.initializeApp()

export { scheduleReminders }
