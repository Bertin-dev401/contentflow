import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()
const messaging = admin.messaging()

// Runs every 5 minutes.
// Finds all scheduled posts whose scheduledAt is now or in the past,
// sends an FCM push to the user's device, then marks the post as "reminded"
// so it never fires twice.
export const scheduleReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now()

    // All posts that are due and haven't been reminded yet
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get()

    if (snapshot.empty) return null

    const batch = db.batch()
    const notifications: Promise<void>[] = []

    for (const postDoc of snapshot.docs) {
      const post = postDoc.data()

      // Fetch the user's FCM token
      const userSnap = await db.collection('users').doc(post.userId).get()
      if (!userSnap.exists) continue

      const user = userSnap.data()!
      if (!user.notificationsEnabled || !user.fcmToken) continue

      // Build and send the notification
      const sendNotification = messaging
        .send({
          token: user.fcmToken,
          notification: {
            title: 'Time to post',
            body: post.title
              ? `"${post.title}" is ready to go`
              : 'Your scheduled content is ready to post',
          },
          data: {
            postId: postDoc.id,
            platform: post.platform,
          },
          webpush: {
            notification: {
              icon: '/icon-192.png',
              badge: '/badge-72.png',
            },
          },
        })
        .then(() => {
          // Mark as reminded so it never fires again
          batch.update(postDoc.ref, { status: 'reminded' })
        })
        .catch(err => {
          // Invalid token — clear it so we don't retry forever
          if (err.code === 'messaging/registration-token-not-registered') {
            batch.update(userSnap.ref, { fcmToken: admin.firestore.FieldValue.delete(), notificationsEnabled: false })
          }
          // Sanitize log inputs to prevent log injection (CWE-117)
          const safePostId = String(postDoc.id).replace(/[\r\n]/g, '_')
          const safeErrMsg = String(err.message).replace(/[\r\n]/g, '_')
          console.error(`[reminders] FCM send failed for post ${safePostId}:`, safeErrMsg)
        })

      notifications.push(sendNotification)
    }

    await Promise.all(notifications)
    await batch.commit()

    // snapshot.size is a number — safe to log directly
    console.log(`[reminders] Processed ${snapshot.size} post(s)`)
    return null
  })
