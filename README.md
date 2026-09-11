# MediSense AI

Build Prompt: AI-Powered Patient Intake & Clinical Summary Platform

Copy-paste this whole prompt into your AI website builder (v0.dev, Lovable, Bolt.new, Claude, etc.) or use it as your own build brief.

1. Project Identity

Build "MediVoice" (rename if you like) — an AI-powered patient intake and pre-consultation platform that turns a patient's voice, touch, or text answers plus uploaded medical reports into a structured clinical summary for the doctor, with automatic red-flag alerts and a longitudinal health timeline.

This is a screening and pre-consultation support tool, not a diagnostic tool. Every AI output must be visually framed as "AI-assisted summary for physician review," never as a diagnosis.

Two connected experiences in one app:

Patient Kiosk/App — calm, accessible, conversational intake flow.

Doctor Dashboard — dense, fast, clinical-grade information view.

2. Visual Design Direction

Design this like a real, funded health-tech product (think Ada Health, Abridge, or a modern EHR like Athelas) — not a generic dashboard template.

Tone: clinical trust + calm reassurance. Avoid neon gradients, avoid "AI hype" purple-glow clichés.

Palette: a desaturated clinical base (soft white / cool gray #F7F9FA background) with one confident primary accent (deep teal or medical blue, e.g. #0F6E5E or #1D4ED8) and a distinct, unmissable alert red (#DC2626) reserved only for red-flag states so it stays meaningful.

Typography: one clean humanist sans (Inter, Manrope, or IBM Plex Sans) — larger, generous type on the patient side (readability for elderly/unwell users); tighter, denser type on the doctor dashboard (information density for clinicians scanning fast).

Motion: subtle — a breathing/listening animation during voice capture, gentle progress transitions between adaptive questions, no gratuitous bounce.

Iconography: line icons, medical-appropriate (stethoscope, pulse, document, mic), consistent stroke width.

Give real empty/loading/error states real design attention — don't leave them as placeholders.

3. Patient-Facing Flow (build these screens)

Welcome / Start — large "Speak to begin" mic button, alternate "Type instead" and "Touch/tap options" paths, language selector.

Patient Details — name, age, ID/ABHA number field (mock), a friendly progress bar showing "Step 1 of 5."

Adaptive Symptom Interview — chat-style conversation UI:

AI asks one question at a time, patient answers by voice (show live waveform + live transcript) or by tapping quick-reply chips (Yes / No / Not sure / Describe).

Each new question visibly builds on the last answer (e.g., "You mentioned fever for 3 days — is it constant or does it come and go?") to sell the adaptive engine.

Show a subtle "AI is thinking / choosing next question" state between turns.

Report Upload (Document AI) — drag-and-drop or camera capture for prescriptions/lab reports, with a live OCR extraction preview showing structured fields appearing next to the scanned image (e.g., "Glucose: 180 mg/dL" highlighted directly on the report image).

Review & Submit — a plain-language recap of everything captured, patient can correct anything before submitting.

Confirmation — "Your information has been sent to Dr. [Name]" with a calm illustration, queue position/estimated wait if relevant.

4. Doctor Dashboard (build these screens)

Patient Queue — list/card view of waiting patients with a compact AI-generated one-line summary and a colored urgency badge (Normal / Priority / 🚨 Red Flag).

Patient Detail View, organized in clear panels:

AI Clinical Summary at the top (Chief Complaint, Associated Symptoms, Duration, Past History, Current Medication) — scannable in under 10 seconds.

Red-Flag Alert banner (only if triggered) — bold but not alarmist, states which symptom combination triggered it.

Health Timeline — a horizontal or vertical timeline component plotting past conditions, treatments, and this visit against each other.

Uploaded Reports — thumbnail gallery, click to expand with the OCR-extracted data overlaid.

Full Conversation Transcript — collapsible, in case the doctor wants the raw Q&A.

Action bar: Approve Summary / Edit / Add Note / Mark Reviewed.

ABDM Integration Status — a small, honest "ABDM-ready — not yet connected" badge/settings panel rather than fake live data, since this is a college-project stage.

5. Functional / Technical Requirements

Frontend in React (component-driven: PatientKiosk, AdaptiveQuestionCard, VoiceCapture, ReportUploader, DoctorQueue, PatientSummaryPanel, HealthTimeline, RedFlagBanner).

Mock the backend with realistic sample data and simulated latency (loading states) for: speech-to-text, adaptive question generation, OCR extraction, red-flag detection, and clinical summary generation — structure the mock functions so they're a drop-in replacement point for real FastAPI/Whisper/Tesseract/LLM calls later.

State should model a real patient record shape: { patientInfo, symptoms[], history[], medications[], reports[], timelineEvents[], aiSummary, redFlags[] }.

Fully responsive: the patient kiosk should also work well as a mobile web app; the doctor dashboard should be optimized for tablet/desktop.

Accessibility: large tap targets and readable contrast on the patient side (this will be used by unwell/elderly patients), keyboard navigation throughout.

6. What "advanced and beautiful" means here — don't skip these details

Real micro-interactions: mic pulsing while listening, checkmark animation when a report finishes OCR, smooth transcript auto-scroll.

A genuinely well-designed Health Timeline visualization — this is the most "wow" component, make it a real visual centerpiece, not a plain list.

Realistic sample patients with varied, believable data (a diabetic patient with a 3-day fever, a hypertensive patient with chest pain triggering a red flag, etc.) so every screen looks populated and real, not empty-state placeholder.

A short animated walkthrough or hero section on a landing page explaining the pipeline (Voice → AI Questions → OCR → Risk Alert → Summary → Doctor) — useful for your project demo/viva.

7. Build Order (matches your own plan)

Landing/hero page explaining the system (great for your demo).

Patient kiosk flow end-to-end with mocked voice + adaptive questions.

Report upload with mocked OCR extraction.

Doctor queue + patient detail view with AI summary, red-flag banner, and timeline.

Polish states, animations, and responsiveness last.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f78a32ef-8d4c-4f09-a0b1-69e34423262e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
