import { useEffect, useState } from "react";
import { getBackendStatus, subscribeBackendStatus } from "../utils/backendStatus";

export function useBackendStatus() {
  const [status, setStatus] = useState(() => getBackendStatus());

  useEffect(() => subscribeBackendStatus(setStatus), []);

  return status;
}
