# Design Guidelines: Hackathon File Manager

## Design Approach
**System**: Linear + Notion-inspired productivity interface
**Rationale**: Clean, utility-focused design optimized for file management workflows with emphasis on clarity and efficiency. The design should feel professional and trustworthy for handling user files while maintaining simplicity for quick onboarding during a hackathon event.

## Typography System
- **Primary Font**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for file sizes, timestamps)

**Hierarchy**:
- Page titles: text-3xl, font-semibold
- Section headers: text-xl, font-semibold
- File/folder names: text-base, font-medium
- Metadata (sizes, dates): text-sm, font-normal, monospace
- Body text: text-base, font-normal
- Timer display: text-4xl md:text-6xl, font-bold, monospace

## Layout & Spacing System
**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-4 or p-6
- Section spacing: py-8 or py-12
- Card gaps: gap-4 or gap-6
- Icon-to-text spacing: gap-2

**Grid System**:
- File grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
- Navigation: Single column sidebar (w-64) + main content area
- Forms: max-w-md centered layouts

## Core Component Library

### Authentication Pages (Login/Register)
- Centered card layout (max-w-md mx-auto)
- Logo/brand at top
- Form fields with clear labels and validation states
- Primary CTA button (full width)
- Secondary actions (text links) below
- "Powered by Replit Auth" badge
- Clean, distraction-free background

### Dashboard Layout
**Structure**:
- Top navigation bar: Fixed, h-16, flex items-center justify-between
  - Left: Logo + app name
  - Center: Countdown timer (prominent, pulsing when < 5 min)
  - Right: User menu + logout
- Main content: Full-width file browser with breadcrumb navigation

### Countdown Timer Component
- **Position**: Top-center of dashboard, always visible
- **Design**: Large, monospaced digits with label
- **States**:
  - Active (> 1 hour): Standard styling
  - Warning (< 1 hour): Amber accent
  - Critical (< 10 min): Red accent with subtle pulse animation
  - Expired: Gray with "Upload Disabled" message
- Include timezone indicator below timer

### File Browser Interface
**Breadcrumb Navigation**:
- Horizontal path display: Home > Folder1 > Subfolder
- Clickable segments with chevron separators
- Current location highlighted

**Action Bar** (sticky top):
- Left side: "New Folder" + "Upload Files" + "Upload Folder" buttons
- Right side: View toggle (grid/list), sort dropdown
- Disable upload buttons when timer expires

**File/Folder Cards** (Grid View):
- Rounded containers with subtle border
- Icon at top (folder icon or file type icon from Heroicons)
- File/folder name (truncated with tooltip)
- Metadata row: Size, upload date
- Action menu (3 dots): Download, Delete
- Hover state: Slight elevation with shadow

**List View** (Alternative):
- Table layout with columns: Name, Type, Size, Modified, Actions
- Row hover states
- Sortable column headers

### Empty States
- Large centered icon (cloud upload from Heroicons)
- Heading: "No files yet"
- Subtext: "Upload your first file or folder to get started"
- Primary action button

### Welcome/Instructions Panel
**Position**: Collapsible sidebar or initial modal on first login
**Content**:
- Welcome message with user's name
- Numbered list of key features (1-7)
- Navigation tips
- Timer explanation
- Quick start guide with icons
- Dismiss/collapse option

### Upload Components
**File Upload Zone**:
- Dashed border, large drop area
- Drag-and-drop with visual feedback
- Center icon + "Drop files here or click to browse"
- Progress bars during upload
- Success/error notifications

**Folder Upload**:
- Similar to file upload but with folder icon
- Shows folder structure preview before confirming
- Maintains nested structure in S3

### Dialogs & Modals
**Create Folder**:
- Simple input field with "Create" and "Cancel" buttons
- Auto-focus on input

**Delete Confirmation**:
- Warning icon
- "Delete [filename]?" heading
- "This action cannot be undone" subtext
- Destructive action button (red) + Cancel

**Download Progress**:
- Linear progress bar
- File name and size
- Cancel option

### Navigation & Interactions
- Primary actions: Solid buttons with subtle shadow
- Secondary actions: Ghost buttons or text links
- Destructive actions: Red accent
- Loading states: Skeleton screens for file lists
- Transitions: Smooth, 200-300ms duration
- Micro-interactions: Subtle scale on button press (0.98x)

## Accessibility
- All interactive elements keyboard navigable
- Focus states: 2px outline with appropriate contrast
- ARIA labels for icon-only buttons
- Screen reader announcements for upload/delete success
- Color contrast meeting WCAG AA standards
- Clear error messages for form validation

## Icons
**Library**: Heroicons (outline style)
**Usage**:
- Folders: folder, folder-open
- Files: document, document-text
- Actions: cloud-arrow-up, cloud-arrow-down, trash, plus
- Navigation: chevron-right, chevron-left, home
- Timer: clock
- User: user-circle

## Responsive Behavior
- **Mobile** (< 768px): 
  - Single column file grid
  - Hamburger menu for navigation
  - Stacked timer and actions
- **Tablet** (768px - 1024px):
  - 2-column file grid
  - Condensed timer display
- **Desktop** (> 1024px):
  - Full layout with sidebar
  - Multi-column grid
  - Prominent timer

## Special Considerations
- **Timer Urgency**: Visual hierarchy shifts as deadline approaches
- **Upload Restrictions**: Clear visual feedback when uploads are disabled
- **User Isolation**: No hints of other users' content
- **Performance**: Optimistic UI updates, paginated file lists for large collections
- **Trust Signals**: SSL indicator, secure file handling messaging