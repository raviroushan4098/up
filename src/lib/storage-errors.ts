import { StorageError } from "firebase/storage";

/**
 * Converts Firebase Storage error codes to user-friendly messages.
 */
export function getStorageErrorMessage(error: unknown): string {
  if (error instanceof StorageError || (error && typeof error === "object" && "code" in error)) {
    const code = (error as { code: string }).code;

    switch (code) {
      case "storage/retry-limit-exceeded":
        return "Upload failed due to slow or unstable internet. Please check your connection and try again.";
      case "storage/unauthorized":
        return "You do not have permission to upload this file. Please log in again.";
      case "storage/unauthenticated":
        return "Your session has expired. Please log in again and retry.";
      case "storage/canceled":
        return "Upload was cancelled.";
      case "storage/invalid-checksum":
        return "The file was corrupted during upload. Please try again.";
      case "storage/cannot-slice-blob":
        return "There was a problem reading the file. Please re-select it and try again.";
      case "storage/server-file-wrong-size":
        return "Upload error — the file size didn't match. Please try again.";
      case "storage/quota-exceeded":
        return "Storage quota exceeded. Please contact support.";
      case "storage/object-not-found":
        return "The requested file was not found.";
      case "storage/unknown":
      default:
        return "Something went wrong while uploading. Please check your internet connection and try again.";
    }
  }

  // Generic fallback
  if (error instanceof Error) {
    if (error.message.includes("retry-limit-exceeded") || error.message.includes("Max retry")) {
      return "Upload failed due to slow or unstable internet. Please check your connection and try again.";
    }
    if (error.message.includes("net::ERR") || error.message.includes("NetworkError")) {
      return "Network error — please check your internet connection and try again.";
    }
  }

  return "Something went wrong while uploading. Please try again.";
}
