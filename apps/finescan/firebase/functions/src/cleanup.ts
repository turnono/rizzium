import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const cleanupOldDocuments = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const firestore = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  try {
    const usersSnapshot = await firestore.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userSettings = await firestore
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('preferences')
        .get();

      const retentionDays = userSettings.exists ? userSettings.data()?.dataRetention || 30 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldAnalyses = await firestore
        .collection('users')
        .doc(userId)
        .collection('analyses')
        .where('createdAt', '<', cutoffDate)
        .get();

      // Use batch for Firestore operations
      const batch = firestore.batch();
      const deletePromises: Promise<void>[] = [];

      for (const analysis of oldAnalyses.docs) {
        const data = analysis.data();

        if (data.fileUrl) {
          // Add Storage delete operations to promises array
          deletePromises.push(
            bucket
              .file(`finescan-uploads/${userId}/${data.fileUrl.split('/').pop()}`)
              .delete()
              .catch((error) => console.error(`Error deleting file for analysis ${analysis.id}:`, error))
          );
        }

        // Add Firestore delete operation to batch
        batch.delete(analysis.ref);
      }

      // Execute all Storage deletions and Firestore batch
      await Promise.all([...deletePromises, batch.commit()]);
    }

    console.log('Cleanup completed successfully');
    return null;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
});
