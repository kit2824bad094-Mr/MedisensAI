import { useEffect, useState } from "react";
import { samplePatients } from "./sampleData";
import type { PatientRecord } from "./types";

/**
 * In-memory patient queue. Swap for a real API / Lovable Cloud table later —
 * the shape is already the persisted record shape.
 */
let records: PatientRecord[] = [...samplePatients];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getRecords() {
  return records;
}

export function getRecord(id: string) {
  return records.find((r) => r.patientInfo.id === id);
}

export function addRecord(record: PatientRecord) {
  records = [record, ...records];
  emit();
}

export function updateRecord(id: string, patch: Partial<PatientRecord>) {
  records = records.map((r) => (r.patientInfo.id === id ? { ...r, ...patch } : r));
  emit();
}

export function useRecords() {
  const [snapshot, setSnapshot] = useState(records);
  useEffect(() => {
    const l = () => setSnapshot(records);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snapshot;
}

export function useRecord(id: string) {
  return useRecords().find((r) => r.patientInfo.id === id);
}
