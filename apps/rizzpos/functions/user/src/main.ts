import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

export const deleteAnonUser = functions.https.onCall(async (data) => {
  const { uid } = data;
  try {
    const auth = getAuth();
    const firestore = getFirestore();

    const anonUser = await auth.getUser(uid);
    if (anonUser && anonUser.providerData.length === 0) {
      await auth.deleteUser(uid);
    }

    const userDoc = await firestore.collection('users').doc(uid).get();
    if (userDoc.exists) {
      await firestore.collection('users').doc(uid).delete();
    }

    const cartDoc = await firestore.collection('carts').doc(uid).get();
    if (cartDoc.exists) {
      await firestore.collection('carts').doc(uid).delete();
    }

    return { deletedCart: true, deletedUser: true };
  } catch (error) {
    console.error('Error deleting anonymous user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete anonymous user'
    );
  }
});
