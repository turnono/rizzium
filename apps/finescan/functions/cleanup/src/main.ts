import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const cleanupOldDocuments = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const firestore = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  try {
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get user's retention setting (default to 30 days if not set)
      const userSettings = await firestore
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('preferences')
        .get();

      const retentionDays = userSettings.exists ? userSettings.data()?.dataRetention || 30 : 30;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Query for old analyses
      const oldAnalyses = await firestore
        .collection('users')
        .doc(userId)
        .collection('analyses')
        .where('createdAt', '<', cutoffDate)
        .get();

      // Delete each old analysis and its associated file
      for (const analysis of oldAnalyses.docs) {
        const data = analysis.data();

        // Delete the file from Storage if it exists
        if (data.fileUrl) {
          try {
            const fileName = data.fileUrl.split('/').pop();
            await bucket.file(`finescan-uploads/${userId}/${fileName}`).delete();
          } catch (error) {
            console.error(`Error deleting file for analysis ${analysis.id}:`, error);
          }
        }

        // Delete the analysis document
        await analysis.ref.delete();
      }
    }

    console.log('Cleanup completed successfully');
    return null;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
});
