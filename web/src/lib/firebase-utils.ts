import { onSnapshot } from "firebase/firestore";
import type { Query, CollectionReference, DocumentData, QuerySnapshot, FirestoreError } from "firebase/firestore";

export function safeSnapshot<T = DocumentData>(
  ref: Query<T> | CollectionReference<T>,
  onNext: (snap: QuerySnapshot<T>) => void,
  onError?: (err: FirestoreError) => void
): () => void {
  return onSnapshot(ref, onNext, (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Firestore]", err.code, err.message);
    }
    onError?.(err);
  });
}
