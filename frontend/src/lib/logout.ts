import { resetRecordCaches } from "./records";
import { clearSession } from "./session";

export function logout() {
  clearSession();
  resetRecordCaches();
}
