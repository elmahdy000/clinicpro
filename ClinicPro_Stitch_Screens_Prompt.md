# ClinicPro — Stitch UI/UX Screens Design Prompt

## Purpose

Design a complete modern web dashboard for **ClinicPro**, a private clinic management system for **one doctor only**. The system is not a hospital, not a multi-branch clinic, and not a multi-doctor medical center.

The goal is to help one doctor manage:

- Patients
- Appointments
- Visits
- Medical records
- Prescriptions
- Patient files
- Daily clinic workflow
- Basic clinic statistics

The design must be clean, professional, medical, calm, fast to use, and suitable for Arabic and English users.

---

## Product Type

**Single Doctor Clinic Management Dashboard**

This is a focused web app for a private doctor clinic. It should feel like a practical medical operations system, not a generic SaaS dashboard.

---

## Main Users

### 1. Doctor / Owner

The main user of the system.

The doctor can:

- View the full dashboard
- Search and manage patients
- View patient history
- Add visits
- Add diagnoses and treatment plans
- Create prescriptions
- Upload and view medical files
- Review today’s appointments
- Mark appointments as completed
- View reports and statistics
- Manage clinic settings

### 2. Receptionist

The receptionist handles front-desk work.

The receptionist can:

- Register new patients
- Search patients
- Create appointments
- Edit appointment status
- Check in waiting patients
- View today’s queue
- View limited patient information

### 3. Assistant

Optional role.

The assistant can:

- View today’s appointments
- Add vital signs
- Add pre-visit notes
- Upload files
- Prepare patients before doctor examination

---

## Design Language

Use a modern, calm, medical dashboard style.

### Visual Direction

- Clean white background
- Soft blue, teal, or green medical accent
- Light gray surfaces
- Rounded cards
- Clear spacing
- Modern icons
- High readability
- Minimal visual noise
- Professional and trustworthy
- Desktop-first, responsive for tablet and mobile

### Avoid

- Dark heavy UI
- Over-colorful design
- Complex gradients
- Crowded tables
- Tiny fonts
- Hospital enterprise feeling
- Multi-doctor or multi-department assumptions
- Overly futuristic style

---

## Language and Direction

The UI must support both:

- English LTR
- Arabic RTL

For Stitch, design screens in English first, but structure the UI so Arabic RTL can be applied easily.

Use clear labels and avoid long text in buttons.

---

## Global Layout

### Main Dashboard Layout

Use a classic admin layout:

- Left sidebar navigation in English version
- Top header bar
- Main content area
- Search bar in header
- User profile menu
- Notification icon
- Responsive collapsed sidebar for smaller screens

### Sidebar Navigation

Required sidebar items:

1. Dashboard
2. Today Queue
3. Patients
4. Appointments
5. Visits
6. Prescriptions
7. Files
8. Reports
9. Settings
10. Profile
11. Logout

### Header Bar

The header should include:

- Page title
- Global patient search
- Today date
- Notification icon
- Logged-in user name and role
- Quick action button: `New Patient` or `New Appointment`

---

## Required Screens

# 1. Login Screen

## Route

`/login`

## Purpose

Allow doctor, receptionist, or assistant to log in.

## UI Elements

- ClinicPro logo
- Login card
- Email field
- Password field
- Remember me checkbox
- Login button
- Forgot password link
- Small medical illustration or clean abstract medical graphic

## Design Notes

- Centered layout
- Calm medical background
- Minimal distractions
- Professional look

---

# 2. Dashboard Screen

## Route

`/dashboard`

## Purpose

Give the doctor a quick overview of today’s clinic activity.

## UI Elements

### Top KPI Cards

- Today’s Appointments
- Waiting Patients
- Completed Visits Today
- New Patients This Month
- Total Patients
- Cancelled Appointments

### Main Sections

- Today’s schedule timeline
- Waiting queue card
- Recent visits
- Quick patient search
- Quick action buttons

### Quick Actions

- Add Patient
- Book Appointment
- Start Visit
- Create Prescription

## Design Notes

Dashboard must be operational, not decorative. The doctor should understand the clinic status in seconds.

---

# 3. Today Queue Screen

## Route

`/queue/today`

## Purpose

Manage patients currently visiting the clinic today.

## UI Elements

- Date selector
- Queue summary cards:
  - Waiting
  - In Progress
  - Completed
  - Cancelled
- Patient queue table/cards

## Queue Item Fields

- Queue number
- Patient name
- Phone
- Appointment time
- Reason
- Status badge
- Waiting duration
- Actions

## Actions

- Check In
- Start Visit
- Mark Completed
- Cancel
- View Patient

## Design Notes

This screen should feel like a live reception workflow.

---

# 4. Patients List Screen

## Route

`/patients`

## Purpose

Search, filter, and manage all patients.

## UI Elements

- Page title: Patients
- Add New Patient button
- Search by name, phone, or patient code
- Filters:
  - Gender
  - Age range
  - Last visit date
  - Has chronic disease
- Patients table

## Table Columns

- Patient code
- Name
- Phone
- Age
- Gender
- Last visit
- Next appointment
- Status
- Actions

## Actions

- View Profile
- Edit
- Book Appointment
- New Visit

## Design Notes

Patient search must be prominent and fast.

---

# 5. Add New Patient Screen

## Route

`/patients/new`

## Purpose

Register a new patient.

## UI Elements

### Form Sections

1. Basic Information
   - First name
   - Last name
   - Phone
   - Gender
   - Date of birth
   - Address

2. Medical Information
   - Blood group
   - Allergies
   - Chronic diseases
   - Medical history
   - Notes

3. Emergency Contact
   - Contact name
   - Contact phone
   - Relation

## Actions

- Save Patient
- Save and Book Appointment
- Cancel

## Design Notes

Use sectioned form cards. Avoid one long flat form.

---

# 6. Patient Profile Screen

## Route

`/patients/[id]`

## Purpose

This is the most important screen in the system.

It should show a complete medical and administrative profile for one patient.

## UI Layout

### Top Patient Header

- Patient name
- Patient code
- Age
- Gender
- Phone
- Last visit date
- Next appointment
- Status badges

### Quick Actions

- New Visit
- Book Appointment
- Create Prescription
- Upload File
- Edit Patient
- Print Summary

### Main Tabs

1. Overview
2. Visits
3. Prescriptions
4. Appointments
5. Files
6. Medical History
7. Notes

## Overview Tab

- Basic patient data
- Chronic diseases
- Allergies
- Important warnings
- Latest visit summary
- Latest prescription
- Upcoming appointment

## Visits Tab

- Timeline of visits
- Visit date
- Chief complaint
- Diagnosis
- Treatment plan
- Doctor notes
- Vital signs
- View visit button

## Prescriptions Tab

- Prescription list
- Date
- Related visit
- Medicine count
- Print button
- View button

## Appointments Tab

- Past appointments
- Upcoming appointments
- Status
- Reason
- Actions

## Files Tab

- Uploaded medical documents
- File type
- Upload date
- Notes
- Preview/download action

## Medical History Tab

- Allergies
- Chronic diseases
- Past surgeries
- Family history
- Medication history

## Notes Tab

- Internal doctor notes
- Reception notes
- Assistant notes

## Design Notes

The Patient Profile must be clean, structured, and quick to scan. Use tabs, cards, status badges, and timeline components.

---

# 7. Edit Patient Screen

## Route

`/patients/[id]/edit`

## Purpose

Edit patient information.

## UI Elements

Same sections as Add New Patient screen, but pre-filled.

## Actions

- Save Changes
- Cancel

---

# 8. Appointments Calendar Screen

## Route

`/appointments`

## Purpose

Manage all clinic appointments.

## UI Elements

- Calendar view
- List view toggle
- Date picker
- Status filters
- Add Appointment button

## Calendar Modes

- Day view
- Week view
- Month view

## Appointment Card Fields

- Patient name
- Time
- Reason
- Status
- Phone

## Actions

- View appointment
- Edit
- Check In
- Cancel

## Design Notes

For one doctor only. Do not show doctor selection unless it is in settings as clinic owner.

---

# 9. Add Appointment Screen

## Route

`/appointments/new`

## Purpose

Book a new appointment.

## UI Elements

- Patient search/select
- Appointment date
- Appointment time
- Duration
- Reason
- Notes
- Status

## Actions

- Save Appointment
- Save and Add Another
- Cancel

## Design Notes

Patient search should allow selecting existing patient or creating new patient quickly.

---

# 10. Appointment Details Screen

## Route

`/appointments/[id]`

## Purpose

View and manage one appointment.

## UI Elements

- Patient summary card
- Appointment date/time
- Reason
- Status badge
- Notes
- Created by
- Created at

## Actions

- Check In
- Start Visit
- Reschedule
- Cancel
- Mark Completed
- View Patient Profile

---

# 11. New Visit Screen

## Route

`/visits/new?patientId={id}`

## Purpose

Create a new medical visit for a patient.

## UI Sections

### Patient Summary

- Name
- Age
- Gender
- Allergies
- Chronic diseases
- Last visit

### Vital Signs

- Blood pressure
- Temperature
- Weight
- Height
- Pulse
- Oxygen saturation

### Visit Details

- Chief complaint
- Diagnosis
- Treatment plan
- Doctor notes

### Prescription Section

- Add medicines inside the same workflow
- Medicine name
- Dosage
- Frequency
- Duration
- Notes

## Actions

- Save Visit
- Save Visit and Prescription
- Print Prescription
- Cancel

## Design Notes

This screen must be doctor-friendly and fast. The doctor should be able to complete a visit without navigating between many pages.

---

# 12. Visit Details Screen

## Route

`/visits/[id]`

## Purpose

View one completed or saved visit.

## UI Elements

- Patient summary
- Visit date
- Chief complaint
- Diagnosis
- Treatment plan
- Vital signs
- Notes
- Related prescription
- Related files

## Actions

- Edit Visit
- Print Visit Summary
- View Patient
- Create Prescription if missing

---

# 13. Prescriptions List Screen

## Route

`/prescriptions`

## Purpose

View and search prescriptions.

## UI Elements

- Search by patient name/code/phone
- Date range filter
- Prescriptions table

## Table Columns

- Prescription number
- Patient name
- Date
- Related visit
- Medicine count
- Actions

## Actions

- View
- Print
- Edit

---

# 14. Prescription Details / Print Screen

## Route

`/prescriptions/[id]`

## Purpose

View and print a prescription.

## UI Elements

- Clinic header
- Doctor name
- Patient name
- Age
- Date
- Diagnosis optional
- Medicine list
- Instructions
- Doctor signature area

## Medicine List Fields

- Medicine name
- Dosage
- Frequency
- Duration
- Notes

## Actions

- Print
- Download PDF
- Edit
- Back to Patient

## Design Notes

Create a clean printable prescription layout. It should fit A4 or half-page prescription paper.

---

# 15. Files Screen

## Route

`/files`

## Purpose

Manage uploaded medical files.

## UI Elements

- Search files
- Filter by patient
- Filter by file type
- Upload date filter
- Files grid/table

## File Types

- Lab result
- X-ray
- Scan
- Report
- Other

## Actions

- Preview
- Download
- Delete
- Open Patient Profile

---

# 16. Upload Patient File Screen / Modal

## Route

Can be modal inside patient profile or standalone:

`/patients/[id]/files/upload`

## Purpose

Upload a document for a patient.

## UI Elements

- Patient name
- Drag and drop upload area
- File type selector
- Notes
- Upload button

## Design Notes

Should support PDFs and images visually.

---

# 17. Reports Screen

## Route

`/reports`

## Purpose

Show simple clinic statistics.

## UI Elements

- Date range filter
- KPI cards
- Simple charts

## Required Reports

- Total visits
- New patients
- Completed appointments
- Cancelled appointments
- Most common visit reasons
- Patient growth over time

## Design Notes

Keep reports simple. This is not a hospital analytics platform.

---

# 18. Settings Screen

## Route

`/settings`

## Purpose

Configure clinic information and system preferences.

## Sections

### Clinic Information

- Clinic name
- Doctor name
- Specialty
- Phone
- Address
- Logo upload

### Appointment Settings

- Default appointment duration
- Working days
- Working hours

### Prescription Settings

- Prescription header
- Footer notes
- Print layout preference

### User Management

- Add receptionist
- Add assistant
- Change roles

## Design Notes

Settings should be simple and sectioned.

---

# 19. Profile Screen

## Route

`/profile`

## Purpose

Allow logged-in user to manage their profile.

## UI Elements

- Name
- Email
- Role
- Password change
- Avatar optional

---

# 20. Not Found / Empty States / Error States

## Required States

Design reusable empty and error states for:

- No patients found
- No appointments today
- No visits yet
- No prescriptions yet
- No files uploaded
- Failed loading data
- Unauthorized access

## Design Notes

Empty states must include a clear action button, such as Add Patient or Book Appointment.

---

## Core Components Required

Design these reusable UI components:

### Navigation Components

- Sidebar
- Top header
- Breadcrumb
- User menu
- Notification dropdown

### Data Components

- Patient card
- Patient table row
- Appointment card
- Queue item card
- Visit timeline item
- Prescription medicine row
- File card
- KPI card
- Status badge

### Form Components

- Text input
- Phone input
- Date picker
- Time picker
- Select dropdown
- Textarea
- File upload area
- Searchable patient selector
- Medicine repeater fields

### Feedback Components

- Toast notification
- Confirmation modal
- Delete warning modal
- Loading skeleton
- Empty state
- Error state

---

## Status Badges

Use clear badge colors and labels.

### Appointment Status

- Scheduled
- Confirmed
- Waiting
- In Progress
- Completed
- Cancelled
- Missed

### Patient Status

- Active
- New
- Follow-up
- Has Warning

### File Type

- Lab
- X-ray
- Scan
- Report
- Other

---

## UX Rules

1. Patient search must always be easy to access.
2. Patient Profile is the central hub of the system.
3. The doctor must be able to start a visit from the queue, appointment, or patient profile.
4. Prescription creation should be available inside the visit workflow.
5. Avoid unnecessary screens for a single doctor clinic.
6. Do not design departments or multiple doctor management.
7. Do not design patient public portal in phase one.
8. Do not design hospital-level modules.
9. Keep forms sectioned and readable.
10. Use tables only when useful; use cards and timelines for medical history.
11. Make print prescription layout clean and professional.
12. Make all screens responsive.
13. Support Arabic RTL layout structurally.

---

## Suggested Information Architecture

```txt
Login

Dashboard
├── Today Queue
├── Patients
│   ├── Patients List
│   ├── Add Patient
│   ├── Patient Profile
│   │   ├── Overview
│   │   ├── Visits
│   │   ├── Prescriptions
│   │   ├── Appointments
│   │   ├── Files
│   │   ├── Medical History
│   │   └── Notes
│   └── Edit Patient
├── Appointments
│   ├── Calendar
│   ├── Add Appointment
│   └── Appointment Details
├── Visits
│   ├── New Visit
│   └── Visit Details
├── Prescriptions
│   ├── Prescriptions List
│   └── Prescription Details / Print
├── Files
│   ├── Files List
│   └── Upload File
├── Reports
├── Settings
└── Profile
```

---

## Priority for Stitch Design

Design the screens in this order:

1. Login
2. Main Dashboard Layout
3. Dashboard
4. Today Queue
5. Patients List
6. Add Patient
7. Patient Profile
8. Appointments Calendar
9. Add Appointment
10. New Visit
11. Prescription Print
12. Files
13. Reports
14. Settings

The Patient Profile, Today Queue, New Visit, and Prescription Print screens are the most important screens.

---

## Final Stitch Prompt

Use this prompt inside Stitch:

```txt
Design a complete modern responsive web dashboard for ClinicPro, a single-doctor private clinic management system.

The system is for one doctor only, not a hospital, not a multi-doctor clinic, and not a multi-branch system.

The dashboard must help the doctor and receptionist manage patients, appointments, today queue, visits, prescriptions, patient files, and simple clinic reports.

Use a clean medical UI style with white background, soft blue/teal/green accents, rounded cards, modern icons, readable typography, calm spacing, professional dashboard layout, and support for future Arabic RTL layout.

Required main layout:
- Sidebar navigation
- Top header
- Global patient search
- Quick action button
- User profile menu
- Responsive behavior

Required sidebar items:
Dashboard, Today Queue, Patients, Appointments, Visits, Prescriptions, Files, Reports, Settings, Profile, Logout.

Design all required screens:
1. Login screen
2. Dashboard screen with KPI cards, today's schedule, waiting queue, recent visits, quick actions
3. Today Queue screen with queue statuses and patient actions
4. Patients List screen with search, filters, table, and actions
5. Add Patient form with basic info, medical info, emergency contact
6. Patient Profile screen with tabs: Overview, Visits, Prescriptions, Appointments, Files, Medical History, Notes
7. Edit Patient screen
8. Appointments Calendar screen with day/week/month view
9. Add Appointment screen with patient search/select
10. Appointment Details screen
11. New Visit screen with patient summary, vital signs, complaint, diagnosis, treatment plan, notes, and medicine prescription fields
12. Visit Details screen
13. Prescriptions List screen
14. Prescription Details / Print screen with clean printable layout
15. Files screen
16. Upload Patient File modal/screen
17. Reports screen
18. Settings screen
19. Profile screen
20. Empty states, error states, unauthorized state, and reusable loading states

Important UX rules:
- Patient Profile is the central hub.
- Patient search must always be easy to access.
- Doctor must be able to start a visit from queue, appointment, or patient profile.
- Prescription creation should be inside the visit workflow.
- Do not design departments.
- Do not design multiple doctors.
- Do not design hospital modules.
- Do not design patient portal in phase one.
- Keep the system practical, fast, and suitable for a small private clinic.
```

---

## Output Expected from Stitch

Stitch should generate:

- Complete screen designs
- Consistent design system
- Sidebar and header layout
- Responsive dashboard UI
- Patient profile with tabs
- Queue workflow
- Appointment workflow
- Visit and prescription workflow
- Printable prescription layout
- Empty and error states

