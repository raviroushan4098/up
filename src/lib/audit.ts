import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function logAuditAction({
  actionType,
  entityId,
  entityName,
  applicationNo,
  previousValue,
  newValue,
  performedByUid,
  performedByName,
  performedByRole,
}: {
  actionType: string;
  entityId: string;
  entityName: string;
  applicationNo?: string;
  previousValue: string;
  newValue: string;
  performedByUid: string;
  performedByName: string;
  performedByRole: string;
}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      actionType,
      entityId,
      entityName,
      applicationNo: applicationNo || null,
      previousValue,
      newValue,
      performedByUid,
      performedByName,
      performedByRole,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
